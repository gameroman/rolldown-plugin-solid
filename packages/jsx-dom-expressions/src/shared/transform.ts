import { is, b } from "yuku-ast";

import { transformElement as transformElementDOM } from "../dom/element";
import { createTemplate as createTemplateDOM } from "../dom/template";
import { transformElement as transformElementSSR } from "../ssr/element";
import { createTemplate as createTemplateSSR } from "../ssr/template";
import type {
  TransformContext,
  TransformResult,
  WrappingInfo,
  Expression,
  Node,
  JSXElement,
  JSXFragment,
  Statement,
} from "../types";
import { transformElement as transformElementUniversal } from "../universal/element";
import { createTemplate as createTemplateUniversal } from "../universal/template";
import transformComponent from "./component";
import transformFragmentChildren from "./fragment";
import {
  getTagName,
  isComponent,
  isDynamic,
  trimWhitespace,
  transformCondition,
  getStaticExpression,
  escapeHTML,
  getConfig,
  generateUid,
} from "./utils";

export function transformJSX(
  ctx: TransformContext,
  node: JSXElement | JSXFragment,
): Expression {
  const config = getConfig(ctx);
  const result = transformNode(
    ctx,
    node,
    is.JSXFragment(node) ? {} : { topLevel: true, lastElement: true },
  );
  const templateFn = getCreateTemplate(config, result);
  return templateFn(ctx, result, false);
}

export function getCreateTemplate(
  config: TransformContext["config"],
  result: TransformResult,
) {
  if (
    (result.tagName && result.renderer === "dom") ||
    config.generate === "dom"
  ) {
    return createTemplateDOM;
  }
  if (result.renderer === "ssr" || config.generate === "ssr") {
    return createTemplateSSR;
  }
  return createTemplateUniversal;
}

export function transformNode(
  ctx: TransformContext,
  node: Node,
  info: WrappingInfo = {},
): TransformResult | null {
  const config = getConfig(ctx);
  let staticValue: string | number | false;

  if (is.JSXElement(node)) {
    return transformElement(ctx, node, info);
  } else if (is.JSXFragment(node)) {
    let results: TransformResult = {
      template: "",
      declarations: [],
      exprs: [],
      dynamics: [],
      postExprs: [],
    };
    transformFragmentChildren(ctx, node.children, results, config);
    return results;
  } else if (
    is.JSXText(node) ||
    (staticValue = getStaticExpression(ctx, node, info.parent || null)) !==
      false
  ) {
    const text =
      staticValue !== undefined
        ? info.doNotEscape
          ? staticValue.toString()
          : escapeHTML(staticValue.toString())
        : trimWhitespace(node.raw);
    if (!text.length) return null;
    const results: TransformResult = {
      template: text,
      declarations: [],
      exprs: [],
      dynamics: [],
      postExprs: [],
      text: true,
    };
    if (!info.skipId && config.generate !== "ssr") {
      results.id = b.Identifier({ name: generateUid(ctx, "el$") });
    }
    return results;
  } else if (is.JSXExpressionContainer(node)) {
    const container = node;
    if (is.JSXEmptyExpression(container.expression)) return null;
    if (
      !isDynamic(ctx, container.expression, {
        checkMember: true,
        checkTags: !!info.componentChild,
        native: !info.componentChild,
      })
    ) {
      return {
        exprs: [b.ExpressionStatement({ expression: container.expression })],
        template: "",
        dynamics: [],
        postExprs: [],
        declarations: [],
      };
    }
    const expr: Expression =
      config.wrapConditionals &&
      config.generate !== "ssr" &&
      (is.LogicalExpression(container.expression) ||
        is.ConditionalExpression(container.expression))
        ? transformCondition(
            ctx,
            container.expression,
            info.componentChild || info.fragmentChild || false,
          )
        : info.componentChild || info.fragmentChild
          ? container.expression
          : !info.componentChild &&
              (config.generate !== "ssr" || info.fragmentChild) &&
              is.CallExpression(container.expression) &&
              !container.expression.callee &&
              !is.MemberExpression(container.expression.callee) &&
              container.expression.arguments.length === 0
            ? container.expression.callee
            : b.ArrowFunctionExpression({
                params: [],
                body: container.expression,
              });

    let exprs: Statement[];
    exprs = [b.ExpressionStatement({ expression: expr })];

    return {
      exprs,
      template: "",
      dynamics: [],
      postExprs: [],
      declarations: [],
      dynamic: true,
    };
  } else if (is.JSXSpreadChild(node)) {
    const spreadChild = node;
    if (
      !isDynamic(ctx, spreadChild.expression, {
        checkMember: true,
        native: !info.componentChild,
      })
    ) {
      return {
        exprs: [b.ExpressionStatement({ expression: spreadChild.expression })],
        template: "",
        dynamics: [],
        postExprs: [],
        declarations: [],
      };
    }
    const expr = b.ArrowFunctionExpression({
      params: [],
      body: spreadChild.expression,
    });
    return {
      exprs: [b.ExpressionStatement({ expression: expr })],
      template: "",
      dynamics: [],
      postExprs: [],
      declarations: [],
      dynamic: true,
    };
  }

  return null;
}

function transformElement(
  ctx: TransformContext,
  node: JSXElement,
  info: WrappingInfo = {},
): TransformResult {
  const tagName = getTagName(node);
  if (isComponent(tagName)) return transformComponent(ctx, node);

  const config = getConfig(ctx);
  const tagRenderer = (config.renderers ?? []).find((renderer) =>
    renderer.elements.includes(tagName),
  );

  if (tagRenderer?.name === "dom" || config.generate === "dom") {
    return transformElementDOM(ctx, node, info);
  }
  if (config.generate === "ssr") {
    return transformElementSSR(ctx, node, info);
  }
  return transformElementUniversal(ctx, node, info);
}

export { transformElement };
