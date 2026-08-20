import { decode } from "html-entities";
import { is, b } from "yuku-ast";

import {
  BooleanAttributes,
  Aliases,
  ChildProperties,
  SVGElements,
} from "../constants";
import { transformNode, getCreateTemplate } from "../shared/transform";
import {
  getTagName,
  registerImportMethod,
  filterChildren,
  checkLength,
  escapeHTML,
  reservedNameSpaces,
  getConfig,
  trimWhitespace,
  isDynamic,
  isComponent,
  convertJSXIdentifier,
} from "../shared/utils";
import type {
  TransformContext,
  TransformResult,
  WrappingInfo,
  Expression,
  Statement,
  JSXElement,
  JSXAttribute,
  JSXSpreadAttribute,
  Identifier,
  JSXText,
  JSXExpressionContainer,
  JSXIdentifier,
  JSXNamespacedName,
} from "../types";
import VoidElements from "../VoidElements";
import { createTemplate } from "./template";

function appendToTemplate(template: string[], value: string | string[]): void {
  let array: string[] | undefined;
  if (Array.isArray(value)) {
    [value, ...array] = value;
  }
  template[template.length - 1] += value;
  if (array && array.length) template.push.apply(template, array);
}

export function transformElement(
  ctx: TransformContext,
  node: JSXElement,
  info: WrappingInfo,
): TransformResult {
  const config = getConfig(ctx);
  const tagName = getTagName(node);
  const doNotEscape = tagName === "script" || tagName === "style";

  if (node.openingElement.attributes.some((a: any) => is.JSXSpreadAttribute(a)))
    return createElement(ctx, node, { ...info, ...config });

  const voidTag = VoidElements.indexOf(tagName) > -1;
  const results: TransformResult = {
    id: null,
    template: [`<${tagName}`],
    templateValues: [],
    declarations: [],
    exprs: [],
    dynamics: [],
    postExprs: [],
    tagName,
    renderer: "ssr",
  };

  if (info.topLevel && config.hydratable) {
    if (tagName === "head") {
      registerImportMethod(ctx, "NoHydration");
      registerImportMethod(ctx, "createComponent");
      const child = transformElement(ctx, node, { ...info, topLevel: false });
      results.template = "";
      results.exprs.push(
        b.ExpressionStatement({
          expression: b.CallExpression({
            callee: b.Identifier({ name: "_$createComponent" }),
            arguments: [
              b.Identifier({ name: "_$NoHydration" }),
              b.ObjectExpression({
                properties: [
                  b.Property({
                    key: b.Identifier({ name: "children" }),
                    value: b.FunctionExpression({
                      params: [],
                      body: b.BlockStatement({
                        body: [
                          b.ReturnStatement({
                            argument: createTemplate(ctx, child),
                          }),
                        ],
                      }),
                    }),
                    kind: "init",
                    method: true,
                    shorthand: false,
                    computed: false,
                  }),
                ],
              }),
            ],
            optional: false,
          }),
        }),
      );
      return results;
    }
    (results.template as string[]).push("");
    results.templateValues!.push(
      b.CallExpression({
        callee: registerImportMethod(ctx, "ssrHydrationKey"),
        arguments: [],
        optional: false,
      }),
    );
  }
  transformAttributes(ctx, node, results, { ...config, ...info });
  appendToTemplate(results.template as string[], ">");
  if (!voidTag) {
    transformChildren(ctx, node, results, { ...config, ...info });
    appendToTemplate(results.template as string[], `</${tagName}>`);
  }
  return results;
}

function toAttribute(key: string, isSVG: boolean): string {
  key = Aliases[key] || key;
  if (!isSVG) key = key.toLowerCase();
  return key;
}

function setAttr(
  ctx: TransformContext,
  results: TransformResult,
  name: string,
  value: Expression,
  isSVG: boolean,
): void {
  let parts: string[] | undefined;
  let namespace: string | undefined;
  if (
    (parts = name.split(":")) &&
    parts[1] &&
    reservedNameSpaces.has(parts[0])
  ) {
    name = parts[1];
    namespace = parts[0];
  }

  name = toAttribute(name, isSVG);
  const attr = b.CallExpression({
    callee: registerImportMethod(ctx, "ssrAttribute"),
    arguments: [b.Literal({ value: name }), value, b.Literal({ value: false })],
    optional: false,
  });
  const template = results.template as string[];
  const templateValues = results.templateValues!;
  if (template[template.length - 1].length) {
    template.push("");
    templateValues.push(attr);
  } else {
    const last = templateValues.length - 1;
    templateValues[last] = b.BinaryExpression({
      operator: "+",
      left: templateValues[last],
      right: attr,
      optional: false,
    });
  }
}

function escapeExpression(
  ctx: TransformContext,
  expression: Expression,
  attr: boolean,
  escapeLiterals?: boolean,
): Expression {
  if (
    is.Literal(expression) ||
    (is.TemplateLiteral(expression) && expression.expressions.length === 0)
  ) {
    if (escapeLiterals) {
      if (is.Literal(expression) && typeof expression.value === "string") {
        return b.Literal({ value: escapeHTML(expression.value, attr) });
      } else if (is.TemplateLiteral(expression)) {
        return b.Literal({
          value: escapeHTML(expression.quasis[0].value.raw, attr),
        });
      }
    }
    return expression;
  } else if (is.Function(expression)) {
    if (is.BlockStatement(expression.body)) {
      expression.body.body = expression.body.body.map((e: any) => {
        if (is.ReturnStatement(e)) {
          e.argument = escapeExpression(ctx, e.argument, attr, escapeLiterals);
        }
        return e;
      });
    } else {
      expression.body = escapeExpression(
        ctx,
        expression.body,
        attr,
        escapeLiterals,
      );
    }
    return expression;
  } else if (is.TemplateLiteral(expression)) {
    if (attr) escapeTemplateQuasis(expression, true);
    expression.expressions = expression.expressions.map((e: any) =>
      escapeExpression(ctx, e, attr, escapeLiterals),
    );
    return expression;
  } else if (is.UnaryExpression(expression)) {
    return expression;
  } else if (is.BinaryExpression(expression)) {
    expression.left = escapeExpression(
      ctx,
      expression.left,
      attr,
      escapeLiterals,
    );
    expression.right = escapeExpression(
      ctx,
      expression.right,
      attr,
      escapeLiterals,
    );
    return expression;
  } else if (is.ConditionalExpression(expression)) {
    expression.consequent = escapeExpression(
      ctx,
      expression.consequent,
      attr,
      escapeLiterals,
    );
    expression.alternate = escapeExpression(
      ctx,
      expression.alternate,
      attr,
      escapeLiterals,
    );
    return expression;
  } else if (is.LogicalExpression(expression)) {
    if (expression.operator === "&&") {
      expression.right = escapeExpression(
        ctx,
        expression.right,
        attr,
        escapeLiterals,
      );
      return expression;
    }
  } else if (is.CallExpression(expression) && is.Function(expression.callee)) {
    if (is.BlockStatement(expression.callee.body)) {
      expression.callee.body.body = expression.callee.body.body.map(
        (e: any) => {
          if (is.ReturnStatement(e)) {
            e.argument = escapeExpression(
              ctx,
              e.argument,
              attr,
              escapeLiterals,
            );
          }
          return e;
        },
      );
    } else {
      expression.callee.body = escapeExpression(
        ctx,
        expression.callee.body,
        attr,
        escapeLiterals,
      );
    }
    return expression;
  } else if (
    is.JSXElement(expression) &&
    !isComponent(getTagName(expression))
  ) {
    expression.wontEscape = true;
    return expression;
  }

  return b.CallExpression({
    callee: registerImportMethod(ctx, "escape"),
    arguments: attr ? [expression, b.Literal({ value: true })] : [expression],
    optional: false,
  });
}

function escapeTemplateQuasis(expression: Expression, attr: boolean): void {
  for (const quasi of expression.quasis) {
    const src =
      quasi.value.cooked != null ? quasi.value.cooked : quasi.value.raw;
    const escaped = escapeHTML(src, attr);
    if (typeof escaped !== "string" || escaped === src) continue;
    quasi.value.cooked = escaped;
    quasi.value.raw = escaped
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");
  }
}

function transformToObject(
  ctx: TransformContext,
  attrName: string,
  attributes: JSXAttribute[],
  selectedIndices: number[],
): void {
  const properties: any[] = [];
  const existingAttr = attributes.find((a) => {
    const name = is.JSXNamespacedName(a.name)
      ? (a.name as JSXNamespacedName).name.name
      : (a.name as JSXIdentifier).name;
    return name === attrName;
  });

  for (let i = 0; i < selectedIndices.length; i++) {
    const attr = attributes[selectedIndices[i]];
    const nsName = is.JSXNamespacedName(attr.name)
      ? (attr.name as JSXNamespacedName).name.name
      : (attr.name as JSXIdentifier).name;
    const isComputed = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(nsName);
    properties.push(
      b.Property({
        key: isComputed
          ? b.Literal({ value: nsName })
          : b.Identifier({ name: nsName }),
        value: is.JSXExpressionContainer(attr.value)
          ? attr.value.expression
          : attr.value,
        kind: "init",
        method: false,
        shorthand: false,
        computed: isComputed,
      }),
    );
  }

  if (
    existingAttr &&
    is.JSXExpressionContainer(existingAttr.value) &&
    is.ObjectExpression(existingAttr.value.expression)
  ) {
    existingAttr.value.expression.properties.push(...properties);
  } else {
    const target = existingAttr || attributes[selectedIndices[0]];
    target.value = b.JSXExpressionContainer({
      expression: b.ObjectExpression({ properties }),
    });
  }
}

function normalizeAttributes(
  ctx: TransformContext,
  node: JSXElement,
): JSXAttribute[] {
  const attributes = node.openingElement.attributes as JSXAttribute[];
  const styleAttributes = attributes.filter(
    (a: any) =>
      is.JSXNamespacedName(a.name) &&
      (a.name as JSXNamespacedName).namespace.name === "style",
  );
  const classNamespaceAttributes = attributes.filter(
    (a: any) =>
      is.JSXNamespacedName(a.name) &&
      (a.name as JSXNamespacedName).namespace.name === "class",
  );

  if (classNamespaceAttributes.length) {
    const classNsIndices = classNamespaceAttributes.map((a) =>
      attributes.indexOf(a),
    );
    transformToObject(ctx, "classList", attributes, classNsIndices);
  }

  const classAttributes = attributes.filter((a: any) => {
    const name = is.JSXNamespacedName(a.name)
      ? (a.name as JSXNamespacedName).name.name
      : (a.name as JSXIdentifier).name;
    return name === "class" || name === "className" || name === "classList";
  });

  if (classAttributes.length > 1) {
    const first = classAttributes[0];
    const firstNsName = is.JSXNamespacedName(first.name)
      ? (first.name as JSXNamespacedName).name.name
      : (first.name as JSXIdentifier).name;
    const values: Expression[] = [];
    const quasis: any[] = [
      b.TemplateElement({ value: { cooked: "", raw: "" }, tail: false }),
    ];

    for (let i = 0; i < classAttributes.length; i++) {
      const attr = classAttributes[i];
      const isLast = i === classAttributes.length - 1;
      const attrValue = attr.value;
      const nsName = is.JSXNamespacedName(attr.name)
        ? (attr.name as JSXNamespacedName).name.name
        : (attr.name as JSXIdentifier).name;

      if (!is.JSXExpressionContainer(attrValue)) {
        const prev = quasis.pop();
        quasis.push(
          b.TemplateElement({
            value: {
              raw:
                (prev ? prev.value.raw : "") +
                `${attrValue.value}` +
                (isLast ? "" : " "),
              cooked:
                (prev ? prev.value.cooked : "") +
                `${attrValue.value}` +
                (isLast ? "" : " "),
            },
            tail: isLast,
          }),
        );
      } else {
        let expr = attrValue.expression;
        if (nsName === "classList") {
          if (
            is.ObjectExpression(expr) &&
            !expr.properties.some((p: any) => is.SpreadElement(p))
          ) {
            transformClasslistObject(ctx, expr, values, quasis);
            if (!isLast) quasis[quasis.length - 1].value.raw += " ";
            continue;
          }
          expr = b.CallExpression({
            callee: registerImportMethod(ctx, "ssrClassList"),
            arguments: [expr],
            optional: false,
          });
        }
        values.push(
          b.LogicalExpression({
            operator: "||",
            left: expr,
            right: b.Literal({ value: "" }),
            optional: false,
          }),
        );
        quasis.push(
          b.TemplateElement({
            value: { raw: isLast ? "" : " ", cooked: isLast ? "" : " " },
            tail: isLast,
          }),
        );
      }
    }

    first.name = b.JSXIdentifier({ name: "class" });
    first.value = b.JSXExpressionContainer({
      expression: b.TemplateLiteral({ quasis, expressions: values }),
    });
  }

  if (styleAttributes.length) {
    const styleNsIndices = styleAttributes.map((a) => attributes.indexOf(a));
    transformToObject(ctx, "style", attributes, styleNsIndices);
  }

  return attributes;
}

function transformAttributes(
  ctx: TransformContext,
  node: JSXElement,
  results: TransformResult,
  info: PluginConfig & WrappingInfo,
): void {
  const tagName = getTagName(node);
  const isSVG = SVGElements.has(tagName);
  const hasChildren = node.children.length > 0;
  const attributes = normalizeAttributes(ctx, node);
  let children: JSXExpressionContainer | undefined;

  attributes.forEach((attribute: any) => {
    const attrNode = attribute;
    let value: any = attrNode.value;
    const key = is.JSXNamespacedName(attrNode.name)
      ? `${(attrNode.name as JSXNamespacedName).namespace.name}:${(attrNode.name as JSXNamespacedName).name.name}`
      : (attrNode.name as JSXIdentifier).name;
    const reservedNameSpace =
      is.JSXNamespacedName(attrNode.name) &&
      reservedNameSpaces.has(
        (attrNode.name as JSXNamespacedName).namespace.name,
      );

    if (
      (reservedNameSpace || ChildProperties.has(key)) &&
      !is.JSXExpressionContainer(value)
    ) {
      attrNode.value = value = b.JSXExpressionContainer({
        expression: value || b.JSXEmptyExpression(),
      });
    }

    if (
      is.JSXExpressionContainer(value) &&
      (reservedNameSpace ||
        ChildProperties.has(key) ||
        !(
          is.Literal(value.expression) ||
          is.NumericLiteral(value.expression) ||
          (is.Literal(value.expression) &&
            typeof value.expression.value === "boolean")
        ))
    ) {
      const expr = value.expression;

      if (
        key === "ref" ||
        key.startsWith("use:") ||
        key.startsWith("prop:") ||
        key.startsWith("on")
      )
        return;

      if (ChildProperties.has(key)) {
        if (info.hydratable && key === "textContent" && value && expr) {
          value.expression = b.LogicalExpression({
            operator: "||",
            left: expr,
            right: b.Literal({ value: " " }),
            optional: false,
          });
        }
        children = value;
      } else {
        let doEscape = true;

        let attrKey = key.startsWith("attr:") ? key.replace("attr:", "") : key;
        if (BooleanAttributes.has(attrKey) || attrKey.startsWith("bool:")) {
          attrKey = attrKey.replace("bool:", "");
          (results.template as string[]).push("");
          const fn = b.CallExpression({
            callee: registerImportMethod(ctx, "ssrAttribute"),
            arguments: [
              b.Literal({ value: attrKey }),
              expr,
              b.Literal({ value: true }),
            ],
            optional: false,
          });
          results.templateValues!.push(fn);
          return;
        }

        if (attrKey === "style") {
          if (
            is.ObjectExpression(expr) &&
            !expr.properties.some((p: any) => is.SpreadElement(p))
          ) {
            if (expr.properties.length === 0) return;

            const props = expr.properties.map((p: any, i: number) => {
              if (p.computed) {
                return b.CallExpression({
                  callee: registerImportMethod(ctx, "ssrStyleProperty"),
                  arguments: [
                    b.BinaryExpression({
                      operator: "+",
                      left: p.key,
                      right: b.Literal({ value: ":" }),
                      optional: false,
                    }),
                    escapeExpression(ctx, p.value, true, true),
                  ],
                  optional: false,
                });
              }
              return b.CallExpression({
                callee: registerImportMethod(ctx, "ssrStyleProperty"),
                arguments: [
                  b.Literal({
                    value:
                      (i ? ";" : "") +
                      (is.Identifier(p.key) ? p.key.name : p.key.value) +
                      ":",
                  }),
                  escapeExpression(ctx, p.value, true, true),
                ],
                optional: false,
              });
            });

            let res = props[0];
            for (let i = 1; i < props.length; i++) {
              res = b.BinaryExpression({
                operator: "+",
                left: res,
                right: props[i],
                optional: false,
              });
            }
            value.expression = res;
          } else {
            value.expression = b.CallExpression({
              callee: registerImportMethod(ctx, "ssrStyle"),
              arguments: [expr],
              optional: false,
            });
          }
          doEscape = false;
        }

        if (attrKey === "classList") {
          if (
            is.ObjectExpression(expr) &&
            !expr.properties.some((p: any) => is.SpreadElement(p))
          ) {
            const clsValues: Expression[] = [];
            const clsQuasis: any[] = [
              b.TemplateElement({
                value: { raw: "", cooked: "" },
                tail: false,
              }),
            ];
            transformClasslistObject(ctx, expr, clsValues, clsQuasis);
            if (!clsValues.length) {
              value.expression = b.Literal({
                value: clsQuasis[0].value.raw,
              });
            } else if (
              clsValues.length === 1 &&
              !clsQuasis[0].value.raw &&
              !clsQuasis[1].value.raw
            ) {
              value.expression = clsValues[0];
            } else {
              value.expression = b.TemplateLiteral({
                quasis: clsQuasis,
                expressions: clsValues,
              });
            }
          } else {
            value.expression = b.CallExpression({
              callee: registerImportMethod(ctx, "ssrClassList"),
              arguments: [expr],
              optional: false,
            });
          }
          attrKey = "class";
          doEscape = false;
        }

        if (doEscape) {
          value.expression = escapeExpression(ctx, expr, true);
        }

        if (!doEscape || is.Literal(expr)) {
          const normalizedKey = toAttribute(attrKey, isSVG);
          appendToTemplate(results.template as string[], ` ${normalizedKey}="`);
          (results.template as string[]).push(`"`);
          results.templateValues!.push(expr);
        } else {
          setAttr(ctx, results, attrKey, expr, isSVG);
        }
      }
    } else {
      if (key === "$ServerOnly") return;
      if (is.JSXExpressionContainer(value)) value = value.expression;
      const normalizedKey = toAttribute(key, isSVG);
      const isBoolean = BooleanAttributes.has(normalizedKey);
      if (isBoolean && value && value.value !== "" && !value.value) return;
      appendToTemplate(results.template as string[], ` ${normalizedKey}`);
      if (!value) return;
      let text = isBoolean ? "" : value.value;
      if (normalizedKey === "style" || normalizedKey === "class") {
        text = trimWhitespace(String(text));
        if (normalizedKey === "style") {
          text = text.replace(/; /g, ";").replace(/: /g, ":");
        }
      }
      appendToTemplate(
        results.template as string[],
        String(text) === "" ? `` : `="${escapeHTML(text, true)}"`,
      );
    }
  });

  if (!hasChildren && children) {
    node.children.push(children);
  }
}

function transformClasslistObject(
  ctx: TransformContext,
  expr: Expression,
  values: Expression[],
  quasis: any[],
): void {
  expr.properties.forEach((prop: any, i: number) => {
    const isLast = expr.properties.length - 1 === i;
    let key = prop.key;
    if (is.Identifier(prop.key) && !prop.computed) {
      key = b.Literal({ value: prop.key.name });
    } else if (prop.computed) {
      key = b.CallExpression({
        callee: registerImportMethod(ctx, "escape"),
        arguments: [prop.key, b.Literal({ value: true })],
        optional: false,
      });
    } else {
      key = b.Literal({ value: escapeHTML(prop.key.value) });
    }

    if (is.Literal(prop.value) && typeof prop.value.value === "boolean") {
      if (prop.value.value === true) {
        if (!prop.computed) {
          const prev = quasis.pop();
          quasis.push(
            b.TemplateElement({
              value: {
                raw:
                  (prev ? prev.value.raw : "") +
                  (i ? " " : "") +
                  `${key.value}` +
                  (isLast ? "" : " "),
                cooked:
                  (prev ? prev.value.cooked : "") +
                  (i ? " " : "") +
                  `${key.value}` +
                  (isLast ? "" : " "),
              },
              tail: isLast,
            }),
          );
        } else {
          values.push(key);
          quasis.push(
            b.TemplateElement({
              value: { raw: isLast ? "" : " ", cooked: isLast ? "" : " " },
              tail: isLast,
            }),
          );
        }
      }
    } else {
      values.push(
        b.ConditionalExpression({
          test: prop.value,
          consequent: key,
          alternate: b.Literal({ value: "" }),
          optional: false,
        }),
      );
      quasis.push(
        b.TemplateElement({
          value: { raw: isLast ? "" : " ", cooked: isLast ? "" : " " },
          tail: isLast,
        }),
      );
    }
  });
}

function transformChildren(
  ctx: TransformContext,
  node: JSXElement,
  results: TransformResult,
  { hydratable }: { hydratable: boolean },
): void {
  const doNotEscape =
    getTagName(node) === "script" || getTagName(node) === "style";
  const filteredChildren = filterChildren(node.children);
  const multi = checkLength(filteredChildren);
  const markers = hydratable && multi;

  filteredChildren.forEach((childNode) => {
    if (is.JSXElement(childNode) && getTagName(childNode) === "head") {
      const child = transformNode(ctx, childNode, {
        doNotEscape,
        hydratable: false,
      });
      if (!child) return;
      registerImportMethod(ctx, "NoHydration");
      registerImportMethod(ctx, "createComponent");
      (results.template as string[]).push("");
      results.templateValues!.push(
        b.CallExpression({
          callee: b.Identifier({ name: "_$createComponent" }),
          arguments: [
            b.Identifier({ name: "_$NoHydration" }),
            b.ObjectExpression({
              properties: [
                b.Property({
                  key: b.Identifier({ name: "children" }),
                  value: b.FunctionExpression({
                    params: [],
                    body: b.BlockStatement({
                      body: [
                        b.ReturnStatement({
                          argument: createTemplate(ctx, child),
                        }),
                      ],
                    }),
                  }),
                  kind: "init",
                  method: true,
                  shorthand: false,
                  computed: false,
                }),
              ],
            }),
          ],
          optional: false,
        }),
      );
      return;
    }

    const child = transformNode(ctx, childNode, { doNotEscape });
    if (!child) return;
    appendToTemplate(results.template as string[], child.template as string);
    if (child.templateValues) {
      results.templateValues!.push(...child.templateValues);
    }
    if (child.exprs.length) {
      if (!doNotEscape && !child.spreadElement) {
        child.exprs[0] = {
          type: "ExpressionStatement",
          expression: escapeExpression(ctx, child.exprs[0].expression, false),
        };
      }
      if (markers && !child.spreadElement) {
        appendToTemplate(results.template as string[], `<!--$-->`);
        (results.template as string[]).push("");
        results.templateValues!.push(child.exprs[0].expression);
        appendToTemplate(results.template as string[], `<!--/-->`);
      } else {
        (results.template as string[]).push("");
        results.templateValues!.push(child.exprs[0].expression);
      }
    }
  });
}

function createElement(
  ctx: TransformContext,
  node: JSXElement,
  { topLevel, hydratable }: WrappingInfo & { hydratable: boolean },
): TransformResult {
  const tagName = getTagName(node);
  const config = getConfig(ctx);
  const attributes = normalizeAttributes(ctx, node);
  const doNotEscape = tagName === "script" || tagName === "style";

  const filteredChildren = filterChildren(node.children);
  const multi = checkLength(filteredChildren);
  const markers = hydratable && multi;
  const childNodes: Expression[] = filteredChildren.reduce(
    (memo: Expression[], childNode) => {
      if (is.JSXText(childNode)) {
        const v = decode(trimWhitespace((childNode as JSXText).raw));
        if (v.length) memo.push(b.Literal({ value: v }));
      } else {
        const child = transformNode(ctx, childNode);
        if (!child) return memo;
        if (markers && child.exprs.length && !child.spreadElement) {
          memo.push(b.Literal({ value: "<!--$-->" }));
        }
        if (child.exprs.length && !doNotEscape && !child.spreadElement) {
          child.exprs[0] = {
            type: "ExpressionStatement",
            expression: escapeExpression(ctx, child.exprs[0].expression, false),
          };
        }
        memo.push(getCreateTemplate(config, child)(ctx, child, true));
        if (markers && child.exprs.length && !child.spreadElement) {
          memo.push(b.Literal({ value: "<!--/-->" }));
        }
      }
      return memo;
    },
    [],
  );

  let props: Expression;
  if (attributes.length === 1 && is.JSXSpreadAttribute(attributes[0])) {
    props = (attributes[0] as JSXSpreadAttribute).argument;
  } else {
    const propsList: Expression[] = [];
    let runningObject: any[] = [];
    let dynamicSpread = false;
    const hasChildren = node.children.length > 0;

    attributes.forEach((attribute: any) => {
      if (is.JSXSpreadAttribute(attribute)) {
        if (runningObject.length) {
          propsList.push(b.ObjectExpression({ properties: runningObject }));
          runningObject = [];
        }
        const arg = attribute.argument;
        const isArgDynamic = isDynamic(ctx, arg, { checkMember: true });
        if (isArgDynamic) {
          dynamicSpread = true;
          if (
            is.CallExpression(arg) &&
            !arg.arguments.length &&
            !is.CallExpression(arg.callee) &&
            !is.MemberExpression(arg.callee)
          ) {
            propsList.push(arg.callee);
          } else {
            propsList.push(
              b.ArrowFunctionExpression({ params: [], body: arg }),
            );
          }
        } else {
          propsList.push(arg);
        }
      } else {
        const attrValue = attribute.value || b.Literal({ value: true });
        const id = convertJSXIdentifier(attribute.name);
        const key = is.JSXNamespacedName(attribute.name)
          ? `${(attribute.name as JSXNamespacedName).namespace.name}:${(attribute.name as JSXNamespacedName).name.name}`
          : (attribute.name as JSXIdentifier).name;

        if (hasChildren && key === "children") return;
        if (
          key === "ref" ||
          key.startsWith("use:") ||
          key.startsWith("prop:") ||
          key.startsWith("on")
        )
          return;

        if (is.JSXExpressionContainer(attrValue)) {
          const innerExpr = attrValue.expression;
          const isValDynamic = isDynamic(ctx, innerExpr, {
            checkMember: true,
            checkTags: true,
          });
          if (isValDynamic) {
            let expr = b.ArrowFunctionExpression({
              params: [],
              body: innerExpr,
            });
            const computed = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
            runningObject.push(
              b.Property({
                key: computed ? b.Literal({ value: key }) : id,
                value: b.FunctionExpression({
                  params: [],
                  body: b.BlockStatement({
                    body: [b.ReturnStatement({ argument: expr.body })],
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
                key: computed ? b.Literal({ value: key }) : id,
                value: innerExpr,
                kind: "init",
                method: false,
                shorthand: false,
                computed,
              }),
            );
          }
        } else {
          const computed = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
          runningObject.push(
            b.Property({
              key: computed ? b.Literal({ value: key }) : id,
              value: attrValue,
              kind: "init",
              method: false,
              shorthand: false,
              computed,
            }),
          );
        }
      }
    });

    if (runningObject.length || !propsList.length) {
      propsList.push(b.ObjectExpression({ properties: runningObject }));
    }
    if (propsList.length > 1 || dynamicSpread) {
      props = b.CallExpression({
        callee: registerImportMethod(ctx, "mergeProps"),
        arguments: propsList,
        optional: false,
      });
    } else {
      props = propsList[0];
    }
  }

  const childArg: Expression = childNodes.length
    ? hydratable
      ? b.ArrowFunctionExpression({
          params: [],
          body:
            childNodes.length === 1
              ? childNodes[0]
              : b.ArrayExpression({ elements: childNodes }),
        })
      : childNodes.length === 1
        ? childNodes[0]
        : b.ArrayExpression({ elements: childNodes })
    : b.Identifier({ name: "undefined" });

  const exprs: Statement[] = [
    b.ExpressionStatement({
      expression: b.CallExpression({
        callee: registerImportMethod(ctx, "ssrElement"),
        arguments: [
          b.Literal({ value: tagName }),
          props,
          childArg,
          b.Literal({ value: Boolean(topLevel && config.hydratable) }),
        ],
        optional: false,
      }),
    }),
  ];

  return {
    id: null,
    template: "",
    templateValues: [],
    declarations: [],
    exprs,
    dynamics: [],
    postExprs: [],
    spreadElement: true,
  };
}
