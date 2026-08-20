import { is, b } from "yuku-ast";

import { transformNode } from "../shared/transform";
import {
  getTagName,
  isDynamic,
  registerImportMethod,
  filterChildren,
  checkLength,
  getConfig,
  getRendererConfig,
  convertJSXIdentifier,
  canNativeSpread,
  transformCondition,
  escapeStringForTemplate,
  generateUid,
} from "../shared/utils";
import type {
  TransformContext,
  TransformResult,
  Expression,
  Statement,
  Identifier,
  JSXElement,
  JSXAttribute,
  JSXSpreadAttribute,
  JSXIdentifier,
  JSXNamespacedName,
  JSXExpressionContainer,
} from "../types";

export function transformElement(
  ctx: TransformContext,
  node: JSXElement,
  info: WrappingInfo,
): TransformResult {
  const tagName = getTagName(node);
  const results: TransformResult = {
    id: b.Identifier({ name: generateUid(ctx, "el$") }),
    declarations: [],
    exprs: [],
    dynamics: [],
    postExprs: [],
    tagName,
    renderer: "universal",
  };

  results.declarations.push(
    b.VariableDeclarator({
      id: results.id,
      init: b.CallExpression({
        callee: registerImportMethod(
          ctx,
          "createElement",
          getRendererConfig(ctx, "universal").moduleName,
        ),
        arguments: [b.Literal({ value: tagName })],
        optional: false,
      }),
    }),
  );

  transformAttributes(ctx, node, results);
  transformChildren(ctx, node, results);

  return results;
}

function getAttrName(name: JSXIdentifier | JSXNamespacedName): string {
  if (is.JSXNamespacedName(name)) {
    return `${name.namespace.name}:${name.name.name}`;
  }
  return name.name;
}

function transformAttributes(
  ctx: TransformContext,
  node: JSXElement,
  results: TransformResult,
): void {
  let children: JSXExpressionContainer | undefined;
  let spreadExpr: Statement | undefined;
  let attributes = node.openingElement.attributes;
  const elem = results.id!;
  const hasChildren = node.children.length > 0;
  const config = getConfig(ctx);

  if (attributes.some((a) => is.JSXSpreadAttribute(a))) {
    [attributes, spreadExpr] = processSpreads(ctx, node, attributes, {
      elem,
      hasChildren,
      wrapConditionals: config.wrapConditionals,
    });
  }

  attributes.forEach((attribute) => {
    if (is.JSXSpreadAttribute(attribute)) return;

    const attr = attribute;
    let value = attr.value;
    const key = getAttrName(attr.name);
    const reservedNameSpace =
      is.JSXNamespacedName(attr.name) && attr.name.namespace.name === "use";

    if (reservedNameSpace && !is.JSXExpressionContainer(value)) {
      attr.value = value = b.JSXExpressionContainer({
        expression: value || b.JSXEmptyExpression(),
      });
    }

    if (is.JSXExpressionContainer(value)) {
      const expr = value.expression;

      if (key === "ref") {
        let valueExpr = expr;
        while (
          is.TSNonNullExpression(valueExpr) ||
          is.TSAsExpression(valueExpr)
        ) {
          valueExpr = valueExpr.expression;
        }

        const refIdentifier = b.Identifier({ name: generateUid(ctx, "_ref$") });
        const isConstant = is.Identifier(valueExpr);
        const isFunc = is.Function(valueExpr);

        if (!isConstant && is.Identifier(valueExpr)) {
          results.exprs.unshift(
            b.VariableDeclaration({
              kind: "var",
              declarations: [
                b.VariableDeclarator({ id: refIdentifier, init: valueExpr }),
              ],
            }),
            b.ExpressionStatement({
              expression: b.ConditionalExpression({
                test: b.BinaryExpression({
                  operator: "===",
                  left: b.UnaryExpression({
                    operator: "typeof",
                    argument: refIdentifier,
                    prefix: true,
                  }),
                  right: b.Literal({ value: "function" }),
                  optional: false,
                }),
                consequent: b.CallExpression({
                  callee: registerImportMethod(
                    ctx,
                    "use",
                    getRendererConfig(ctx, "universal").moduleName,
                  ),
                  arguments: [refIdentifier, elem],
                  optional: false,
                }),
                alternate: b.AssignmentExpression({
                  operator: "=",
                  left: valueExpr,
                  right: elem,
                }),
                optional: false,
              }),
            }),
          );
        } else if (isConstant || isFunc) {
          results.exprs.unshift(
            b.ExpressionStatement({
              expression: b.CallExpression({
                callee: registerImportMethod(
                  ctx,
                  "use",
                  getRendererConfig(ctx, "universal").moduleName,
                ),
                arguments: [valueExpr, elem],
                optional: false,
              }),
            }),
          );
        } else {
          results.exprs.unshift(
            b.VariableDeclaration({
              kind: "var",
              declarations: [
                b.VariableDeclarator({ id: refIdentifier, init: valueExpr }),
              ],
            }),
            b.ExpressionStatement({
              expression: b.LogicalExpression({
                operator: "&&",
                left: b.BinaryExpression({
                  operator: "===",
                  left: b.UnaryExpression({
                    operator: "typeof",
                    argument: refIdentifier,
                    prefix: true,
                  }),
                  right: b.Literal({ value: "function" }),
                  optional: false,
                }),
                right: b.CallExpression({
                  callee: registerImportMethod(
                    ctx,
                    "use",
                    getRendererConfig(ctx, "universal").moduleName,
                  ),
                  arguments: [refIdentifier, elem],
                  optional: false,
                }),
                optional: false,
              }),
            }),
          );
        }
      } else if (key.startsWith("use:")) {
        const directiveName = b.JSXIdentifier({ name: key.slice(4) });
        results.exprs.unshift(
          b.ExpressionStatement({
            expression: b.CallExpression({
              callee: registerImportMethod(
                ctx,
                "use",
                getRendererConfig(ctx, "universal").moduleName,
              ),
              arguments: [
                directiveName,
                elem,
                b.ArrowFunctionExpression({
                  params: [],
                  body: is.JSXEmptyExpression(expr)
                    ? b.Literal({ value: true })
                    : expr,
                }),
              ],
              optional: false,
            }),
          }),
        );
      } else if (key === "children") {
        children = value;
      } else if (
        config.effectWrapper &&
        isDynamic(ctx, expr, { checkMember: true })
      ) {
        results.dynamics.push({ elem, key, value: expr });
      } else {
        results.exprs.push(
          b.ExpressionStatement(setAttr(ctx, elem, key, expr)),
        );
      }
    } else {
      results.exprs.push(b.ExpressionStatement(setAttr(ctx, elem, key, value)));
    }
  });

  if (spreadExpr) results.exprs.push(spreadExpr);
  if (!hasChildren && children) {
    node.children.push(children);
  }
}

export function setAttr(
  ctx: TransformContext,
  elem: Expression,
  name: string,
  value: Expression,
  opts?: { dynamic?: boolean; prevId?: Identifier },
): Expression {
  if (!value) value = b.Literal({ value: true });
  const args: Expression[] = opts?.prevId
    ? [elem, b.Literal({ value: name }), value, opts.prevId]
    : [elem, b.Literal({ value: name }), value];
  return b.CallExpression({
    callee: registerImportMethod(
      ctx,
      "setProp",
      getRendererConfig(ctx, "universal").moduleName,
    ),
    arguments: args,
    optional: false,
  });
}

function transformChildren(
  ctx: TransformContext,
  node: JSXElement,
  results: TransformResult,
): void {
  const filteredChildren = filterChildren(node.children);
  const multi = checkLength(filteredChildren);
  const childNodes = filteredChildren.reduce(
    (memo: TransformResult[], child) => {
      const childResult = transformNode(ctx, child);
      if (!childResult) return memo;
      const i = memo.length;
      if (childResult.text && i && memo[i - 1].text) {
        memo[i - 1].template =
          (memo[i - 1].template as string) + (childResult.template as string);
        memo[i - 1].templateWithClosingTags =
          (memo[i - 1].templateWithClosingTags ||
            (memo[i - 1].template as string)) +
          (childResult.templateWithClosingTags ||
            (childResult.template as string));
      } else memo.push(childResult);
      return memo;
    },
    [],
  );

  const appends: Statement[] = [];
  childNodes.forEach((child, index) => {
    if (!child) return;
    if (child.tagName && child.renderer !== "universal") {
      throw new Error(
        `<${child.tagName}> is not supported in <${getTagName(node)}>. ` +
          `Wrap the usage with a component that would render this element, eg. Canvas`,
      );
    }
    if (child.id) {
      const insertNode = registerImportMethod(
        ctx,
        "insertNode",
        getRendererConfig(ctx, "universal").moduleName,
      );
      let insert: Expression = child.id;
      if (child.text) {
        const createTextNode = registerImportMethod(
          ctx,
          "createTextNode",
          getRendererConfig(ctx, "universal").moduleName,
        );
        if (multi) {
          results.declarations.push(
            b.VariableDeclarator({
              id: child.id,
              init: b.CallExpression({
                callee: createTextNode,
                arguments: [
                  b.TemplateLiteral({
                    quasis: [
                      b.TemplateElement({
                        value: {
                          raw: escapeStringForTemplate(
                            child.template as string,
                          ),
                          cooked: child.template as string,
                        },
                        tail: true,
                      }),
                    ],
                    expressions: [],
                  }),
                ],
                optional: false,
              }),
            }),
          );
        } else {
          insert = b.CallExpression({
            callee: createTextNode,
            arguments: [
              b.TemplateLiteral({
                quasis: [
                  b.TemplateElement({
                    value: {
                      raw: escapeStringForTemplate(child.template as string),
                      cooked: child.template as string,
                    },
                    tail: true,
                  }),
                ],
                expressions: [],
              }),
            ],
            optional: false,
          });
        }
      }
      appends.push(
        b.ExpressionStatement({
          expression: b.CallExpression({
            callee: insertNode,
            arguments: [results.id, insert],
            optional: false,
          }),
        }),
      );
      results.declarations.push(...child.declarations);
      results.exprs.push(...child.exprs);
      results.dynamics.push(...child.dynamics);
    } else if (child.exprs.length) {
      const insert = registerImportMethod(
        ctx,
        "insert",
        getRendererConfig(ctx, "universal").moduleName,
      );
      if (multi) {
        results.exprs.push(
          b.ExpressionStatement({
            expression: b.CallExpression({
              callee: insert,
              arguments: [
                results.id,
                (child.exprs[0] as Statement & { expression: Expression })
                  .expression,
                nextChild(childNodes, index) || b.Literal({ value: null }),
              ],
              optional: false,
            }),
          }),
        );
      } else {
        results.exprs.push(
          b.ExpressionStatement({
            expression: b.CallExpression({
              callee: insert,
              arguments: [
                results.id,
                (child.exprs[0] as Statement & { expression: Expression })
                  .expression,
              ],
              optional: false,
            }),
          }),
        );
      }
    }
  });
  results.exprs.unshift(...appends);
}

function nextChild(
  children: TransformResult[],
  index: number,
): Expression | undefined {
  return (
    children[index + 1] &&
    (children[index + 1].id || nextChild(children, index + 1))
  );
}

interface WrappingInfo {
  elem: Identifier;
  hasChildren: boolean;
  wrapConditionals: boolean;
}

function processSpreads(
  ctx: TransformContext,
  node: JSXElement,
  attributes: (JSXAttribute | JSXSpreadAttribute)[],
  { elem, hasChildren, wrapConditionals }: WrappingInfo,
): [(JSXAttribute | JSXSpreadAttribute)[], Statement] {
  const filteredAttributes: (JSXAttribute | JSXSpreadAttribute)[] = [];
  const spreadArgs: Expression[] = [];
  let runningObject = [];
  let dynamicSpread = false;
  let firstSpread = false;

  attributes.forEach((attribute) => {
    if (is.JSXSpreadAttribute(attribute)) {
      firstSpread = true;
      if (runningObject.length) {
        spreadArgs.push(b.ObjectExpression({ properties: runningObject }));
        runningObject = [];
      }
      const arg = attribute.argument;
      if (isDynamic(ctx, arg, { checkMember: true })) {
        dynamicSpread = true;
        if (
          is.CallExpression(arg) &&
          !arg.arguments.length &&
          !is.CallExpression(arg.callee) &&
          !is.MemberExpression(arg.callee)
        ) {
          spreadArgs.push(arg.callee);
        } else {
          spreadArgs.push(b.ArrowFunctionExpression({ params: [], body: arg }));
        }
      } else {
        spreadArgs.push(arg);
      }
    } else if (is.JSXAttribute(attribute)) {
      const attr = attribute;
      const key = getAttrName(attr.name);
      const isContainer = is.JSXExpressionContainer(attr.value);

      if (
        (firstSpread ||
          (isContainer &&
            isDynamic(ctx, attr.value.expression, {
              checkMember: true,
            }))) &&
        canNativeSpread(key, { checkNameSpaces: true })
      ) {
        const dynamic =
          isContainer &&
          isDynamic(ctx, attr.value.expression, {
            checkMember: true,
          });
        if (dynamic) {
          const id = convertJSXIdentifier(attr.name);
          const innerExpr = attr.value.expression;
          const expr =
            wrapConditionals &&
            (is.LogicalExpression(innerExpr) ||
              is.ConditionalExpression(innerExpr))
              ? transformCondition(ctx, innerExpr, true)
              : b.ArrowFunctionExpression({ params: [], body: innerExpr });
          const computed = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
          runningObject.push(
            b.Property({
              key: computed ? b.Literal({ value: key }) : id,
              value: b.FunctionExpression({
                params: [],
                body: b.BlockStatement({
                  body: [b.ReturnStatement({ argument: expr.body || expr })],
                }),
              }),
              kind: "init",
              method: true,
              shorthand: false,
              computed,
            }),
          );
        } else {
          const computed = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
          runningObject.push(
            b.Property({
              key: computed
                ? b.Literal({ value: key })
                : b.Identifier({ name: key }),
              value: isContainer
                ? attr.value.expression
                : attr.value || b.Literal({ value: true }),
              kind: "init",
              method: false,
              shorthand: false,
              computed,
            }),
          );
        }
      } else {
        filteredAttributes.push(attribute);
      }
    }
  });

  if (runningObject.length) {
    spreadArgs.push(b.ObjectExpression({ properties: runningObject }));
  }

  const props: Expression =
    spreadArgs.length === 1 && !dynamicSpread
      ? spreadArgs[0]
      : b.CallExpression({
          callee: registerImportMethod(ctx, "mergeProps"),
          arguments: spreadArgs,
          optional: false,
        });

  const spreadCall = b.ExpressionStatement({
    expression: b.CallExpression({
      callee: registerImportMethod(
        ctx,
        "spread",
        getRendererConfig(ctx, "universal").moduleName,
      ),
      arguments: [elem, props, b.Literal({ value: hasChildren })],
      optional: false,
    }),
  });

  return [filteredAttributes, spreadCall];
}
