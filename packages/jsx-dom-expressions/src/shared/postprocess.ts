import { b } from "yuku-ast";
import type { TransformContext } from "../types";
import { getRendererConfig, registerImportMethod } from "./utils";
import { appendTemplates as appendTemplatesDOM } from "../dom/template";
import { appendTemplates as appendTemplatesSSR } from "../ssr/template";
import { isInvalidMarkup } from "./validate";

export default function postprocess(ctx: TransformContext): void {
  if (ctx.events.size > 0) {
    const delegateEvents = registerImportMethod(ctx, "delegateEvents", getRendererConfig(ctx, "dom").moduleName);
    const eventsArray = b.ArrayExpression({
      elements: Array.from(ctx.events).map(e => b.Literal({ value: e }))
    });
    ctx.out.body.push(
      b.ExpressionStatement({
        expression: b.CallExpression({
          callee: delegateEvents,
          arguments: [eventsArray],
          optional: false
        })
      })
    );
  }

  if (ctx.templates.length > 0) {
    if (ctx.config.validate) {
      for (const template of ctx.templates) {
        const html = template.templateWithClosingTags;
        if (typeof html === "string") {
          const result = isInvalidMarkup(html);
          if (result) {
            const message =
              "\nThe HTML provided is malformed and will yield unexpected output when evaluated by a browser.\n";
            console.warn(message);
            console.warn("User HTML:\n", result.html);
            console.warn("Browser HTML:\n", result.browser);
            console.warn("Original HTML:\n", html);
          }
        }
      }
    }
    const domTemplates = ctx.templates.filter(temp => temp.renderer === "dom");
    const ssrTemplates = ctx.templates.filter(temp => temp.renderer === "ssr");
    if (domTemplates.length > 0) appendTemplatesDOM(ctx, domTemplates);
    if (ssrTemplates.length > 0) appendTemplatesSSR(ctx, ssrTemplates);
  }
}
