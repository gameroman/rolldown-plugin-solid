import { is, b } from "yuku-ast";

import {
  Aliases,
  getPropAlias,
  Properties,
  ChildProperties,
  SVGNamespace,
  DelegatedEvents,
  SVGElements,
} from "../constants";
import { transformNode } from "../shared/transform";
import {
  getTagName,
  isDynamic,
  isComponent,
  registerImportMethod,
  filterChildren,
  toEventName,
  toPropertyName,
  checkLength,
  getStaticExpression,
  reservedNameSpaces,
  wrappedByText,
  getRendererConfig,
  getConfig,
  escapeHTML,
  trimWhitespace,
  hasStaticMarker,
  generateUid,
} from "../shared/utils";
import type {
  TransformContext,
  TransformResult,
  WrappingInfo,
  Expression,
  Identifier,
  JSXElement,
  Node,
  Statement,
} from "../types";
import VoidElements from "../VoidElements";
import { InlineElements, BlockElements } from "./constants";

const alwaysClose = [
  "title",
  "style",
  "a",
  "strong",
  "small",
  "b",
  "u",
  "i",
  "em",
  "s",
  "code",
  "object",
  "table",
  "button",
  "textarea",
  "select",
  "iframe",
  "script",
  "noscript",
  "template",
  "fieldset",
];

export function transformElement(
  ctx: TransformContext,
  node: JSXElement,
  info: WrappingInfo,
): TransformResult {
  const config = getConfig(ctx);
  let tagName = getTagName(node);
  const wrapSVG = info.topLevel && tagName != "svg" && SVGElements.has(tagName);
  const voidTag = VoidElements.indexOf(tagName) > -1;
  const isCustomElement =
    tagName.indexOf("-") > -1 ||
    node.openingElement.attributes.some(
      (a: any) => a?.name?.name === "is" || a.name?.name === "is",
    );
  const isImportNode =
    (tagName === "img" || tagName === "iframe") &&
    node.openingElement.attributes.some((a: any) => a.name?.name === "loading");

  const results: TransformResult = {
    template: `<${tagName}`,
    templateWithClosingTags: `<${tagName}`,
    declarations: [],
    exprs: [],
    dynamics: [],
    postExprs: [],
    isSVG: wrapSVG,
    hasCustomElement: isCustomElement,
    isImportNode,
    tagName,
    renderer: "dom",
    skipTemplate: false,
  };

  if (
    config.hydratable &&
    (tagName === "html" || tagName === "head" || tagName === "body")
  ) {
    results.skipTemplate = true;
    if (tagName === "head" && info.topLevel) {
      const createComponent = registerImportMethod(
        ctx,
        "createComponent",
        getRendererConfig(ctx, "dom").moduleName,
      );
      const NoHydration = registerImportMethod(
        ctx,
        "NoHydration",
        getRendererConfig(ctx, "dom").moduleName,
      );
      results.exprs.push(
        b.ExpressionStatement({
          expression: b.CallExpression({
            callee: createComponent,
            arguments: [NoHydration, b.ObjectExpression({ properties: [] })],
            optional: false,
          }),
        }),
      );
      return results;
    }
  }

  if (wrapSVG) {
    results.template = "<svg>" + results.template;
    results.templateWithClosingTags = "<svg>" + results.templateWithClosingTags;
  }
  if (!info.skipId) {
    results.id = b.Identifier({ name: generateUid(ctx, "el$") });
  }

  transformAttributes(ctx, node, results);

  results.template += ">";
  results.templateWithClosingTags += ">";

  if (!voidTag) {
    const toBeClosed =
      !info.lastElement ||
      !config.omitLastClosingTag ||
      (info.toBeClosed &&
        (!config.omitNestedClosingTags || info.toBeClosed.has(tagName)));
    if (toBeClosed) {
      results.toBeClosed = new Set(info.toBeClosed || alwaysClose);
      results.toBeClosed.add(tagName);
      if (InlineElements.includes(tagName))
        BlockElements.forEach((i) => results.toBeClosed!.add(i));
    } else {
      results.toBeClosed = info.toBeClosed;
    }
    if (tagName !== "noscript") transformChildren(ctx, node, results, config);
    if (toBeClosed) results.template += `</${tagName}>`;
    results.templateWithClosingTags += `</${tagName}>`;
  }

  if (info.topLevel && config.hydratable && results.hasHydratableEvent) {
    const runHydrationEvents = registerImportMethod(
      ctx,
      "runHydrationEvents",
      getRendererConfig(ctx, "dom").moduleName,
    );
    results.postExprs.push(
      b.ExpressionStatement({
        expression: b.CallExpression({
          callee: runHydrationEvents,
          arguments: [],
          optional: false,
        }),
      }),
    );
  }

  if (wrapSVG) {
    results.template += "</svg>";
    results.templateWithClosingTags += "</svg>";
  }

  return results;
}

export function setAttr(
  ctx: TransformContext,
  elem: Expression,
  name: string,
  value: Expression,
  opts: {
    isSVG?: boolean;
    dynamic?: boolean;
    prevId?: Identifier;
    isCE?: boolean;
    tagName?: string;
    checkNameSpaces?: boolean;
  },
): Expression {
  const config = getConfig(ctx);
  let parts: string[];
  let namespace: string | undefined;
  if (
    (parts = name.split(":")) &&
    parts[1] &&
    reservedNameSpaces.has(parts[0])
  ) {
    name = parts[1];
    namespace = parts[0];
  }

  if (namespace === "style") {
    const setStyleProperty = registerImportMethod(
      ctx,
      "setStyleProperty",
      getRendererConfig(ctx, "dom").moduleName,
    );
    return b.CallExpression({
      callee: setStyleProperty,
      arguments: [
        elem,
        b.Literal({ value: name }),
        is.AssignmentExpression(value) && is.Identifier(value.left)
          ? value.right
          : value,
      ],
      optional: false,
    });
  }

  if (namespace === "class") {
    return b.CallExpression({
      callee: b.MemberExpression({
        object: b.MemberExpression({
          object: elem,
          property: b.Identifier({ name: "classList" }),
          computed: false,
          optional: false,
        }),
        property: b.Identifier({ name: "toggle" }),
        computed: false,
        optional: false,
      }),
      arguments: [
        b.Literal({ value: name }),
        opts.dynamic
          ? value
          : b.UnaryExpression({
              operator: "!",
              argument: b.UnaryExpression({
                operator: "!",
                argument: value,
                prefix: true,
              }),
              prefix: true,
            }),
      ],
      optional: false,
    });
  }

  if (name === "style") {
    return b.CallExpression({
      callee: registerImportMethod(
        ctx,
        "style",
        getRendererConfig(ctx, "dom").moduleName,
      ),
      arguments: opts.prevId ? [elem, value, opts.prevId] : [elem, value],
      optional: false,
    });
  }

  if (!opts.isSVG && name === "class") {
    return b.CallExpression({
      callee: registerImportMethod(
        ctx,
        "className",
        getRendererConfig(ctx, "dom").moduleName,
      ),
      arguments: [elem, value],
      optional: false,
    });
  }

  if (name === "classList") {
    return b.CallExpression({
      callee: registerImportMethod(
        ctx,
        "classList",
        getRendererConfig(ctx, "dom").moduleName,
      ),
      arguments: opts.prevId ? [elem, value, opts.prevId] : [elem, value],
      optional: false,
    });
  }

  if (opts.dynamic && name === "textContent") {
    if (config.hydratable) {
      return b.CallExpression({
        callee: registerImportMethod(ctx, "setProperty"),
        arguments: [elem, b.Literal({ value: "data" }), value],
        optional: false,
      });
    }
    return b.AssignmentExpression({
      operator: "=",
      left: b.MemberExpression({
        object: elem,
        property: b.Identifier({ name: "data" }),
        computed: false,
        optional: false,
      }),
      right: value,
    });
  }

  if (namespace === "bool") {
    return b.CallExpression({
      callee: registerImportMethod(
        ctx,
        "setBoolAttribute",
        getRendererConfig(ctx, "dom").moduleName,
      ),
      arguments: [elem, b.Literal({ value: name }), value],
      optional: false,
    });
  }

  const isChildProp = ChildProperties.has(name);
  const isProp = Properties.has(name);
  const alias = getPropAlias(name, (opts.tagName || "").toUpperCase());
  if (
    namespace !== "attr" &&
    (isChildProp ||
      (!opts.isSVG && isProp) ||
      opts.isCE ||
      namespace === "prop")
  ) {
    let propName = name;
    if (opts.isCE && !isChildProp && !isProp && namespace !== "prop")
      propName = toPropertyName(name);
    if (config.hydratable && namespace !== "prop") {
      return b.CallExpression({
        callee: registerImportMethod(ctx, "setProperty"),
        arguments: [elem, b.Literal({ value: alias || propName }), value],
        optional: false,
      });
    }
    return b.AssignmentExpression({
      operator: "=",
      left: b.MemberExpression({
        object: elem,
        property: b.Identifier({ name: alias || propName }),
        computed: false,
        optional: false,
      }),
      right: value,
    });
  }

  const isNameSpaced = name.indexOf(":") > -1;
  name = Aliases[name] || name;
  if (!opts.isSVG) name = name.toLowerCase();
  const ns = isNameSpaced && SVGNamespace[name.split(":")[0]];
  if (ns) {
    return b.CallExpression({
      callee: registerImportMethod(
        ctx,
        "setAttributeNS",
        getRendererConfig(ctx, "dom").moduleName,
      ),
      arguments: [
        elem,
        b.Literal({ value: ns }),
        b.Literal({ value: name }),
        value,
      ],
      optional: false,
    });
  } else {
    return b.CallExpression({
      callee: registerImportMethod(
        ctx,
        "setAttribute",
        getRendererConfig(ctx, "dom").moduleName,
      ),
      arguments: [elem, b.Literal({ value: name }), value],
      optional: false,
    });
  }
}

function transformAttributes(
  ctx: TransformContext,
  node: JSXElement,
  results: TransformResult,
): void {
  const elem = results.id!;
  const config = getConfig(ctx);
  const tagName = getTagName(node);
  const isSVG = SVGElements.has(tagName);
  const isCE =
    tagName.includes("-") ||
    node.openingElement.attributes.some((a: any) => a.name?.name === "is");
  const hasChildren = node.children.length > 0;

  let needsSpacing = true;

  function inlineAttributeOnTemplate(
    isSVG: boolean,
    key: string,
    results: TransformResult,
    value: any,
  ): void {
    if (!isSVG) key = key.toLowerCase();
    results.template += `${needsSpacing ? " " : ""}${key}`;

    if (!value) {
      needsSpacing = true;
      return;
    }

    let text = value.value;
    if (typeof text === "number") text = String(text);
    let needsQuoting = !config.omitQuotes;

    if (key === "style" || key === "class") {
      text = trimWhitespace(text);
      if (key === "style") {
        text = text.replace(/; /g, ";").replace(/: /g, ":");
      }
    }

    if (!text.length) {
      needsSpacing = true;
      return;
    }

    for (let i = 0, len = text.length; i < len; i++) {
      const char = text[i];
      if (
        char === "'" ||
        char === '"' ||
        char === " " ||
        char === "\t" ||
        char === "\n" ||
        char === "\r" ||
        char === "`" ||
        char === "=" ||
        char === "<" ||
        char === ">"
      ) {
        needsQuoting = true;
      }
    }

    if (needsQuoting) {
      needsSpacing = !config.omitAttributeSpacing;
      results.template += `="${escapeHTML(text, true)}"`;
    } else {
      needsSpacing = true;
      results.template += `=${escapeHTML(text, true)}`;
    }
  }

  node.openingElement.attributes.forEach((attribute: any) => {
    const node = attribute;
    let value = node.value;
    const key = is.JSXNamespacedName(node.name)
      ? `${node.name.namespace.name}:${node.name.name.name}`
      : node.name.name;
    const reservedNameSpace =
      is.JSXNamespacedName(node.name) &&
      reservedNameSpaces.has(node.name.namespace.name);

    if (is.JSXExpressionContainer(value) && !key.startsWith("use:")) {
      const evaluated = value.expression;
      if (is.StringLiteral(evaluated)) {
        value = b.Literal({ value: evaluated.value });
      } else if (is.NumericLiteral(evaluated)) {
        if (Properties.has(key) || key.startsWith("prop:")) {
          value = b.Literal({ value: evaluated.value });
        } else {
          value = b.Literal({ value: String(evaluated.value) });
        }
      }
    }

    if (
      is.JSXExpressionContainer(value) &&
      (reservedNameSpace ||
        !(
          is.StringLiteral(value.expression) ||
          is.NumericLiteral(value.expression)
        ))
    ) {
      if (key === "ref") {
        let valueExpr = value.expression;
        while (
          is.TSNonNullExpression(valueExpr) ||
          is.TSAsExpression(valueExpr)
        ) {
          valueExpr = valueExpr.expression;
        }

        const isConstant = is.Identifier(valueExpr);
        if (!isConstant && is.Identifier(valueExpr)) {
          const refIdentifier = b.Identifier({
            name: generateUid(ctx, "_ref$"),
          });
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
                }),
                consequent: b.CallExpression({
                  callee: registerImportMethod(
                    ctx,
                    "use",
                    getRendererConfig(ctx, "dom").moduleName,
                  ),
                  arguments: [refIdentifier, elem],
                  optional: false,
                }),
                alternate: b.AssignmentExpression({
                  operator: "=",
                  left: valueExpr,
                  right: elem,
                }),
              }),
            }),
          );
        } else if (isConstant || is.Function(valueExpr)) {
          results.exprs.unshift(
            b.ExpressionStatement({
              expression: b.CallExpression({
                callee: registerImportMethod(
                  ctx,
                  "use",
                  getRendererConfig(ctx, "dom").moduleName,
                ),
                arguments: [valueExpr, elem],
                optional: false,
              }),
            }),
          );
        } else {
          const refIdentifier = b.Identifier({
            name: generateUid(ctx, "_ref$"),
          });
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
                }),
                right: b.CallExpression({
                  callee: registerImportMethod(
                    ctx,
                    "use",
                    getRendererConfig(ctx, "dom").moduleName,
                  ),
                  arguments: [refIdentifier, elem],
                  optional: false,
                }),
              }),
            }),
          );
        }
      } else if (key === "children") {
        // handled elsewhere
      } else if (key.startsWith("on")) {
        const ev = toEventName(key);
        if (key.startsWith("on:")) {
          results.exprs.unshift(
            b.ExpressionStatement({
              expression: b.CallExpression({
                callee: registerImportMethod(
                  ctx,
                  "addEventListener",
                  getRendererConfig(ctx, "dom").moduleName,
                ),
                arguments: [
                  elem,
                  b.Literal({ value: key.split(":")[1] }),
                  value.expression,
                ],
                optional: false,
              }),
            }),
          );
        } else if (
          config.delegateEvents &&
          (DelegatedEvents.has(ev) || config.delegatedEvents.indexOf(ev) !== -1)
        ) {
          results.hasHydratableEvent = true;
          ctx.events.add(ev);
          const handler = value.expression;
          if (is.ArrayExpression(handler)) {
            if (handler.elements.length > 1) {
              results.exprs.unshift(
                b.ExpressionStatement({
                  expression: b.AssignmentExpression({
                    operator: "=",
                    left: b.MemberExpression({
                      object: elem,
                      property: b.Identifier({ name: `$$${ev}Data` }),
                      computed: false,
                      optional: false,
                    }),
                    right: handler.elements[1],
                  }),
                }),
              );
            }
            results.exprs.unshift(
              b.ExpressionStatement({
                expression: b.AssignmentExpression({
                  operator: "=",
                  left: b.MemberExpression({
                    object: elem,
                    property: b.Identifier({ name: `$$${ev}` }),
                    computed: false,
                    optional: false,
                  }),
                  right: handler.elements[0],
                }),
              }),
            );
          } else if (is.Function(handler)) {
            results.exprs.unshift(
              b.ExpressionStatement({
                expression: b.AssignmentExpression({
                  operator: "=",
                  left: b.MemberExpression({
                    object: elem,
                    property: b.Identifier({ name: `$$${ev}` }),
                    computed: false,
                    optional: false,
                  }),
                  right: handler,
                }),
              }),
            );
          } else {
            results.exprs.unshift(
              b.ExpressionStatement({
                expression: b.CallExpression({
                  callee: registerImportMethod(
                    ctx,
                    "addEventListener",
                    getRendererConfig(ctx, "dom").moduleName,
                  ),
                  arguments: [
                    elem,
                    b.Literal({ value: ev }),
                    handler,
                    b.Literal({ value: true }),
                  ],
                  optional: false,
                }),
              }),
            );
          }
        } else {
          const handler = value.expression;
          if (is.ArrayExpression(handler)) {
            let actualHandler: Expression = handler.elements[0];
            if (handler.elements.length > 1) {
              actualHandler = b.ArrowFunctionExpression({
                params: [b.Identifier({ name: "e" })],
                body: b.CallExpression({
                  callee: handler.elements[0],
                  arguments: [handler.elements[1], b.Identifier({ name: "e" })],
                  optional: false,
                }),
              });
            }
            results.exprs.unshift(
              b.ExpressionStatement({
                expression: b.CallExpression({
                  callee: b.MemberExpression({
                    object: elem,
                    property: b.Identifier({ name: "addEventListener" }),
                    computed: false,
                    optional: false,
                  }),
                  arguments: [b.Literal({ value: ev }), actualHandler],
                  optional: false,
                }),
              }),
            );
          } else if (is.Function(handler)) {
            results.exprs.unshift(
              b.ExpressionStatement({
                expression: b.CallExpression({
                  callee: b.MemberExpression({
                    object: elem,
                    property: b.Identifier({ name: "addEventListener" }),
                    computed: false,
                    optional: false,
                  }),
                  arguments: [b.Literal({ value: ev }), handler],
                  optional: false,
                }),
              }),
            );
          } else {
            results.exprs.unshift(
              b.ExpressionStatement({
                expression: b.CallExpression({
                  callee: registerImportMethod(
                    ctx,
                    "addEventListener",
                    getRendererConfig(ctx, "dom").moduleName,
                  ),
                  arguments: [elem, b.Literal({ value: ev }), handler],
                  optional: false,
                }),
              }),
            );
          }
        }
      } else if (
        config.effectWrapper &&
        (isDynamic(ctx, value.expression, { checkMember: true }) ||
          ((key === "classList" || key === "style") &&
            !hasStaticMarker(value, ctx)))
      ) {
        if (key === "value" || key === "checked") {
          const effectWrapperId = registerImportMethod(
            ctx,
            config.effectWrapper,
          );
          results.postExprs.push(
            b.ExpressionStatement({
              expression: b.CallExpression({
                callee: effectWrapperId,
                arguments: [
                  b.ArrowFunctionExpression({
                    params: [],
                    body: setAttr(ctx, elem, key, value.expression, {
                      tagName,
                      isSVG: isSVG,
                      isCE,
                    }),
                  }),
                ],
                optional: false,
              }),
            }),
          );
          return;
        }

        results.dynamics.push({
          elem,
          key,
          value: value.expression,
          isSVG,
          isCE,
          tagName,
        });
      } else if (key.slice(0, 5) === "attr:") {
        const attrValue = is.JSXExpressionContainer(value)
          ? value.expression
          : value;
        if (is.StringLiteral(attrValue) || is.NumericLiteral(attrValue)) {
          inlineAttributeOnTemplate(isSVG, key.slice(5), results, {
            value: attrValue.value,
          });
        } else {
          results.exprs.push(
            b.ExpressionStatement(
              setAttr(ctx, elem, key, attrValue, { isSVG, isCE, tagName }),
            ),
          );
        }
      } else if (key.slice(0, 5) === "bool:") {
        let content = value;
        if (is.JSXExpressionContainer(content)) content = content.expression;

        const type = content?.type;
        switch (type) {
          case "StringLiteral": {
            if (content.value.length && content.value !== "0") {
              results.template += `${needsSpacing ? " " : ""}${key.slice(5)}`;
              needsSpacing = true;
            }
            return;
          }
          case "NullLiteral":
            return;
          case "BooleanLiteral": {
            if (content.value) {
              results.template += `${needsSpacing ? " " : ""}${key.slice(5)}`;
              needsSpacing = true;
            }
            return;
          }
          case "Identifier": {
            if (content.name === "undefined") return;
            break;
          }
        }

        results.exprs.push(
          b.ExpressionStatement(
            setAttr(
              ctx,
              elem,
              key,
              is.JSXExpressionContainer(value) ? value.expression : value,
              { isSVG, isCE, tagName },
            ),
          ),
        );
      } else {
        results.exprs.push(
          b.ExpressionStatement(
            setAttr(ctx, elem, key, value.expression, { isSVG, isCE, tagName }),
          ),
        );
      }
    } else {
      if (config.hydratable && key === "$ServerOnly") {
        if (config.omitServerOnlyTemplates) results.skipTemplate = true;
        return;
      }
      const staticValue = is.JSXExpressionContainer(value)
        ? value.expression
        : value;
      const resolvedKey = Aliases[key] || key;
      if (staticValue && ChildProperties.has(resolvedKey)) {
        results.exprs.push(
          b.ExpressionStatement(
            setAttr(ctx, elem, resolvedKey, staticValue, {
              isSVG,
              isCE,
              tagName,
            }),
          ),
        );
      } else {
        inlineAttributeOnTemplate(isSVG, key, results, {
          value: staticValue?.value,
        });
      }
    }
  });
}

function transformChildren(
  ctx: TransformContext,
  node: JSXElement,
  results: TransformResult,
  config: TransformContext["config"],
): void {
  const filteredChildren = filterChildren(node.children);
  const lastElement = findLastElement(ctx, filteredChildren, config.hydratable);

  let tempPath = results.id?.name || "";
  let nextPlaceholder: Identifier | null = null;
  const childPostExprs: Statement[] = [];
  let childIndex = 0;

  const childNodes = filteredChildren.reduce(
    (memo: (TransformResult | null)[], child, index) => {
      if (is.JSXFragment(child)) {
        throw new Error(
          `Fragments can only be used top level in JSX. Not used under a <${node.openingElement.name}>.`,
        );
      }
      const transformed = transformNode(ctx, child, {
        toBeClosed: results.toBeClosed,
        lastElement: index === lastElement,
        skipId:
          !results.id ||
          !detectExpressions(ctx, filteredChildren, index, config),
      });
      if (!transformed) return memo;
      const i = memo.length;
      if (transformed.text && i && memo[i - 1]?.text) {
        memo[i - 1].template += transformed.template;
        memo[i - 1].templateWithClosingTags +=
          transformed.templateWithClosingTags || transformed.template;
      } else memo.push(transformed);
      return memo;
    },
    [],
  );

  childNodes.forEach((child, index) => {
    if (!child) return;
    if (child.tagName && child.renderer !== "dom") {
      throw new Error(
        `<${child.tagName}> is not supported in <${node.openingElement.name}>.`,
      );
    }

    results.template += child.template;
    results.templateWithClosingTags +=
      child.templateWithClosingTags || child.template;
    results.isImportNode = results.isImportNode || child.isImportNode;

    if (child.id) {
      if (child.tagName === "head") {
        if (config.hydratable) {
          const createComponent = registerImportMethod(
            ctx,
            "createComponent",
            getRendererConfig(ctx, "dom").moduleName,
          );
          const NoHydration = registerImportMethod(
            ctx,
            "NoHydration",
            getRendererConfig(ctx, "dom").moduleName,
          );
          results.exprs.push(
            b.ExpressionStatement({
              expression: b.CallExpression({
                callee: createComponent,
                arguments: [
                  NoHydration,
                  b.ObjectExpression({ properties: [] }),
                ],
                optional: false,
              }),
            }),
          );
        }
        return;
      }

      let getNextMatch: Identifier | undefined;
      if (config.hydratable && node.openingElement.name === "html") {
        getNextMatch = registerImportMethod(
          ctx,
          "getNextMatch",
          getRendererConfig(ctx, "dom").moduleName,
        );
      }

      const walk = b.MemberExpression({
        object: b.Identifier({ name: tempPath }),
        property: b.Identifier({
          name: childIndex === 0 ? "firstChild" : "nextSibling",
        }),
        computed: false,
        optional: false,
      });

      results.declarations.push(
        b.VariableDeclarator({
          id: child.id,
          init:
            config.hydratable && node.openingElement.name === "html"
              ? b.CallExpression({
                  callee: getNextMatch!,
                  arguments: [walk, b.Literal({ value: child.tagName! })],
                  optional: false,
                })
              : walk,
        }),
      );
      results.declarations.push(...child.declarations);
      results.exprs.push(...child.exprs);
      results.dynamics.push(...child.dynamics);
      childPostExprs.push(...child.postExprs);
      results.hasHydratableEvent =
        results.hasHydratableEvent || child.hasHydratableEvent;
      results.hasCustomElement =
        results.hasCustomElement || child.hasCustomElement;
      results.isImportNode = results.isImportNode || child.isImportNode;
      tempPath = child.id.name;
      nextPlaceholder = null;
      childIndex++;
    } else if (child.exprs.length) {
      const insert = registerImportMethod(
        ctx,
        "insert",
        getRendererConfig(ctx, "dom").moduleName,
      );
      const multi = checkLength(filteredChildren);
      const markers = config.hydratable && multi;

      if (markers || wrappedByText(childNodes, index)) {
        let exprId: Identifier;
        let contentId: Identifier | undefined;
        if (markers) {
          const placeholder = createPlaceholder(
            ctx,
            results,
            tempPath,
            childIndex++,
            "$",
          );
          exprId = placeholder[0];
        }
        if (nextPlaceholder) {
          exprId = nextPlaceholder;
        } else {
          const placeholder = createPlaceholder(
            ctx,
            results,
            tempPath,
            childIndex++,
            markers ? "/" : "",
          );
          exprId = placeholder[0];
          contentId = placeholder[1];
        }
        if (!markers) nextPlaceholder = exprId;
        results.exprs.push(
          b.ExpressionStatement({
            expression: b.CallExpression({
              callee: insert,
              arguments: contentId
                ? [results.id, child.exprs[0]?.expression, exprId, contentId]
                : [results.id, child.exprs[0]?.expression, exprId],
              optional: false,
            }),
          }),
        );
        tempPath = exprId.name;
      } else if (multi) {
        results.exprs.push(
          b.ExpressionStatement({
            expression: b.CallExpression({
              callee: insert,
              arguments: [
                results.id,
                child.exprs[0]?.expression,
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
              arguments: [results.id, child.exprs[0]?.expression],
              optional: false,
            }),
          }),
        );
      }
    } else {
      nextPlaceholder = null;
    }
  });

  results.postExprs.unshift(...childPostExprs);
}

function createPlaceholder(
  ctx: TransformContext,
  results: TransformResult,
  tempPath: string,
  i: number,
  char: string,
): [Identifier, Identifier?] {
  const exprId = b.Identifier({ name: generateUid(ctx, "el$") });
  const config = getConfig(ctx);
  let contentId: Identifier | undefined;

  results.template += `<!${char}>`;
  results.templateWithClosingTags += `<!${char}>`;

  if (config.hydratable && char === "/") {
    contentId = b.Identifier({ name: generateUid(ctx, "co$") });
    results.declarations.push(
      b.VariableDeclarator({
        id: b.ArrayPattern({ elements: [exprId, contentId] }),
        init: b.CallExpression({
          callee: registerImportMethod(
            ctx,
            "getNextMarker",
            getRendererConfig(ctx, "dom").moduleName,
          ),
          arguments: [
            b.MemberExpression({
              object: b.Identifier({ name: tempPath }),
              property: b.Identifier({ name: "nextSibling" }),
              computed: false,
              optional: false,
            }),
          ],
          optional: false,
        }),
      }),
    );
  } else {
    results.declarations.push(
      b.VariableDeclarator({
        id: exprId,
        init: b.MemberExpression({
          object: b.Identifier({ name: tempPath }),
          property: b.Identifier({
            name: i === 0 ? "firstChild" : "nextSibling",
          }),
          computed: false,
          optional: false,
        }),
      }),
    );
  }

  return [exprId, contentId];
}

function nextChild(children: any[], index: number): any {
  return (
    children[index + 1] &&
    (children[index + 1].id || nextChild(children, index + 1))
  );
}

function detectExpressions(
  ctx: TransformContext,
  children: Node[],
  index: number,
  config: TransformContext["config"],
): boolean {
  if (children[index - 1]) {
    const node = children[index - 1];
    if (
      is.JSXExpressionContainer(node) &&
      !is.JSXEmptyExpression(node.expression) &&
      getStaticExpression(ctx, node, null) === false
    )
      return true;
    if (is.JSXElement(node)) {
      const tagName = getTagName(node);
      if (isComponent(tagName)) return true;
    }
  }
  for (let i = index; i < children.length; i++) {
    const child = children[i];
    if (is.JSXExpressionContainer(child)) {
      if (
        !is.JSXEmptyExpression(child.expression) &&
        getStaticExpression(ctx, child, null) === false
      )
        return true;
    } else if (is.JSXElement(child)) {
      const tagName = getTagName(child);
      if (isComponent(tagName)) return true;
      if (
        config.contextToCustomElements &&
        (tagName === "slot" ||
          tagName.indexOf("-") > -1 ||
          child.openingElement.attributes.some(
            (a: any) => a.name?.name === "is",
          ))
      )
        return true;
      if (
        child.openingElement.attributes.some(
          (attr: any) =>
            is.JSXSpreadAttribute(attr) ||
            ["textContent", "innerHTML", "innerText"].includes(
              attr.name?.name,
            ) ||
            (attr.name?.namespace &&
              (attr.name.namespace.name === "use" ||
                attr.name.namespace.name === "prop")) ||
            (is.JSXExpressionContainer(attr.value) &&
              !(
                is.StringLiteral(attr.value.expression) ||
                is.NumericLiteral(attr.value.expression)
              )),
        )
      )
        return true;
      const nextChildren = filterChildren(child.children);
      if (
        nextChildren.length &&
        detectExpressions(ctx, nextChildren, 0, config)
      )
        return true;
    }
  }
  return false;
}

function findLastElement(
  ctx: TransformContext,
  children: Node[],
  hydratable?: boolean,
): number {
  let lastElement = -1;
  let tagName: string | undefined;
  for (let i = children.length - 1; i >= 0; i--) {
    const node = children[i];
    if (
      hydratable ||
      is.JSXText(node) ||
      getStaticExpression(ctx, node, null) !== false ||
      (is.JSXElement(node) &&
        (tagName = getTagName(node)) &&
        !isComponent(tagName))
    ) {
      lastElement = i;
      break;
    }
  }
  return lastElement;
}
