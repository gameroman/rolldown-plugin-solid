import { decode } from "html-entities";
import { is, b } from "yuku-ast";

import type {
  TransformContext,
  TransformResult,
  Expression,
  Identifier,
  JSXElement,
  Node,
} from "../types";
import { transformNode, getCreateTemplate } from "./transform";
import {
  getConfig,
  isDynamic,
  registerImportMethod,
  filterChildren,
  trimWhitespace,
  transformCondition,
  convertJSXIdentifier,
  generateUid,
} from "./utils";

function convertComponentIdentifier(node: any): Expression {
  if (is.JSXIdentifier(node)) {
    if (node.name === "this") return b.ThisExpression();
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(node.name))
      return b.Identifier({ name: node.name });
    else return b.Literal({ value: node.name });
  } else if (is.JSXMemberExpression(node)) {
    const prop = convertComponentIdentifier(node.property);
    const computed = is.StringLiteral(prop);
    return b.MemberExpression({
      object: convertComponentIdentifier(node.object),
      property: prop,
      computed,
      optional: false,
    });
  }
  return node;
}

export default function transformComponent(
  ctx: TransformContext,
  node: JSXElement,
): TransformResult {
  const config = getConfig(ctx);
  const tagId = convertComponentIdentifier(node.openingElement.name);
  let props: Expression[] = [];
  let runningObject: any[] = [];
  let dynamicSpread = false;
  const hasChildren = node.children.length > 0;

  if (is.Identifier(tagId) && config.builtIns.indexOf(tagId.name) > -1) {
    const newTagId = registerImportMethod(ctx, tagId.name);
    tagId.name = newTagId.name;
  }

  node.openingElement.attributes.forEach((attr) => {
    if (is.JSXSpreadAttribute(attr)) {
      if (runningObject.length) {
        props.push(b.ObjectExpression({ properties: runningObject }));
        runningObject = [];
      }
      props.push(
        isDynamic(ctx, attr.argument, { checkMember: true }) &&
          (dynamicSpread = true)
          ? is.CallExpression(attr.argument) &&
            !attr.argument.arguments.length &&
            !is.CallExpression(attr.argument.callee) &&
            !is.MemberExpression(attr.argument.callee)
            ? attr.argument.callee
            : b.ArrowFunctionExpression({ params: [], body: attr.argument })
          : attr.argument,
      );
    } else {
      const value =
        (is.StringLiteral(attr.value)
          ? b.Literal({ value: attr.value.value })
          : attr.value) || b.Literal({ value: true });
      const id = convertJSXIdentifier(attr.name);
      const key = is.Identifier(id) ? id.name : "";
      if (hasChildren && key === "children") return;
      if (is.JSXExpressionContainer(value)) {
        if (key === "ref") {
          if (config.generate === "ssr") return;
          let valueExpr = value.expression;
          while (
            is.TSNonNullExpression(valueExpr) ||
            is.TSAsExpression(valueExpr) ||
            is.TSSatisfiesExpression(valueExpr)
          ) {
            valueExpr = valueExpr.expression;
          }
          let binding: any;
          const isConstant =
            is.Identifier(valueExpr) && (binding = valueExpr) && true;
          if (
            !isConstant &&
            (is.Identifier(valueExpr) ||
              is.MemberExpression(valueExpr) ||
              is.CallExpression(valueExpr))
          ) {
            const refIdentifier = b.Identifier({
              name: generateUid(ctx, "_ref$"),
            });
            runningObject.push(
              b.Property({
                key: b.Identifier({ name: "ref" }),
                value: b.FunctionExpression({
                  id: null,
                  params: [b.Identifier({ name: "r$" })],
                  body: b.BlockStatement({
                    body: [
                      b.VariableDeclaration({
                        kind: "var",
                        declarations: [
                          b.VariableDeclarator({
                            id: refIdentifier,
                            init: valueExpr,
                          }),
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
                          }),
                          consequent: b.CallExpression({
                            callee: refIdentifier,
                            arguments: [b.Identifier({ name: "r$" })],
                            optional: false,
                          }),
                          alternate: b.AssignmentExpression({
                            operator: "=",
                            left: valueExpr,
                            right: b.Identifier({ name: "r$" }),
                          }),
                        }),
                      }),
                    ],
                  }),
                  generator: false,
                  async: false,
                }),
                computed: false,
                shorthand: false,
                kind: "method",
                method: true,
              }),
            );
          } else if (isConstant || is.Function(valueExpr)) {
            runningObject.push(
              b.Property({
                key: b.Identifier({ name: "ref" }),
                value: valueExpr,
                computed: false,
                shorthand: false,
              }),
            );
          }
        } else if (
          isDynamic(ctx, value.expression, {
            checkMember: true,
            checkTags: true,
          })
        ) {
          if (
            config.wrapConditionals &&
            (is.LogicalExpression(value.expression) ||
              is.ConditionalExpression(value.expression))
          ) {
            const expr = transformCondition(ctx, value.expression, true);
            runningObject.push(
              b.Property({
                key: id,
                value: b.FunctionExpression({
                  id: null,
                  params: [],
                  body: b.BlockStatement({
                    body: [b.ReturnStatement({ argument: expr.body || expr })],
                  }),
                  generator: false,
                  async: false,
                }),
                computed: !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key),
                shorthand: false,
                kind: "get",
              }),
            );
          } else {
            runningObject.push(
              b.Property({
                key: id,
                value: b.FunctionExpression({
                  id: null,
                  params: [],
                  body: b.BlockStatement({
                    body: [b.ReturnStatement({ argument: value.expression })],
                  }),
                  generator: false,
                  async: false,
                }),
                computed: !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key),
                shorthand: false,
                kind: "get",
              }),
            );
          }
        } else {
          runningObject.push(
            b.Property({
              key: id,
              value: value.expression,
              computed: false,
              shorthand: false,
            }),
          );
        }
      } else {
        runningObject.push(
          b.Property({ key: id, value, computed: false, shorthand: false }),
        );
      }
    }
  });

  const childResult = transformComponentChildren(ctx, node.children, config);
  if (childResult && childResult[0]) {
    if (childResult[1]) {
      runningObject.push(
        b.Property({
          key: b.Identifier({ name: "children" }),
          value: b.FunctionExpression({
            id: null,
            params: [],
            body: b.BlockStatement({
              body: [b.ReturnStatement({ argument: childResult[0] })],
            }),
            generator: false,
            async: false,
          }),
          computed: false,
          shorthand: false,
          kind: "get",
        }),
      );
    } else {
      runningObject.push(
        b.Property({
          key: b.Identifier({ name: "children" }),
          value: childResult[0],
          computed: false,
          shorthand: false,
        }),
      );
    }
  }

  if (runningObject.length || !props.length)
    props.push(b.ObjectExpression({ properties: runningObject }));
  if (props.length > 1 || dynamicSpread) {
    props = [
      b.CallExpression({
        callee: registerImportMethod(ctx, "mergeProps"),
        arguments: props,
        optional: false,
      }),
    ];
  }
  const exprs: Statement[] = [
    b.ExpressionStatement({
      expression: b.CallExpression({
        callee: registerImportMethod(ctx, "createComponent"),
        arguments: [tagId, props[0]],
        optional: false,
      }),
    }),
  ];

  return {
    exprs,
    template: "",
    component: true,
    dynamics: [],
    postExprs: [],
    declarations: [],
  };
}

function transformComponentChildren(
  ctx: TransformContext,
  children: Node[],
  config: TransformContext["config"],
): [Expression, boolean] | null {
  const filteredChildren = filterChildren(children);
  if (!filteredChildren.length) return null;
  let dynamic = false;

  let transformedChildren: any[] = filteredChildren.reduce(
    (memo: any[], child) => {
      if (is.JSXText(child)) {
        const v = decode(trimWhitespace(child.raw));
        if (v.length) {
          memo.push(b.Literal({ value: v }));
        }
      } else {
        const childResult = transformNode(ctx, child, {
          topLevel: true,
          componentChild: true,
          lastElement: true,
        });
        if (childResult) {
          dynamic = dynamic || !!childResult.dynamic;
          const templateFn = getCreateTemplate(config, childResult);
          memo.push(templateFn(ctx, childResult, filteredChildren.length > 1));
        }
      }
      return memo;
    },
    [],
  );

  if (transformedChildren.length === 1) {
    let result = transformedChildren[0];
    if (
      !is.JSXExpressionContainer(filteredChildren[0]) &&
      !is.JSXSpreadChild(filteredChildren[0]) &&
      !is.JSXText(filteredChildren[0])
    ) {
      result =
        is.CallExpression(result) &&
        !result.arguments.length &&
        !is.Identifier(result.callee)
          ? result.callee
          : b.ArrowFunctionExpression({ params: [], body: result });
      dynamic = true;
    }
    return [result, dynamic];
  } else {
    return [
      b.ArrowFunctionExpression({
        params: [],
        body: b.ArrayExpression({ elements: transformedChildren }),
      }),
      true,
    ];
  }
}
