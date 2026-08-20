import { parse } from "yuku-parser";
import { generate } from "yuku-codegen";
import { is as t, walk, WalkContext } from "yuku-ast";
import { transformJSX } from "./shared/transform";
import postprocess from "./shared/postprocess";
import preprocess from "./shared/preprocess";
import { createTransformContext } from "./shared/utils";
import type { PluginConfig, TransformContext, SourceLang } from "./types";
import type { JSXElement, JSXFragment } from "./types";

export type { PluginConfig, TransformContext };

export interface TransformOptions extends Partial<PluginConfig> {
  filename?: string;
}

export interface TransformResult {
  code: string;
  map: string | null;
}

export function transform(source: string, options: TransformOptions = {}): TransformResult {
  const lang: SourceLang = options.filename
    ? options.filename.endsWith(".tsx")
      ? "tsx"
      : options.filename.endsWith(".jsx")
        ? "jsx"
        : options.filename.endsWith(".ts")
          ? "ts"
          : "js"
    : "jsx";

  const config: PluginConfig = {
    moduleName: "solid-js/web",
    generate: "dom",
    hydratable: false,
    delegateEvents: true,
    delegatedEvents: [],
    builtIns: [],
    requireImportSource: false,
    wrapConditionals: true,
    omitNestedClosingTags: false,
    omitLastClosingTag: false,
    omitQuotes: false,
    omitAttributeSpacing: false,
    contextToCustomElements: false,
    omitServerOnlyTemplates: false,
    staticMarker: "@once",
    effectWrapper: "effect",
    memoWrapper: "memo",
    validate: false,
    inlineStyles: false,
    ...options,
  };

  const { program, comments } = parse(source, { lang: lang === "ts" || lang === "tsx" ? "tsx" : "jsx" });

  const shouldProcess = preprocess(
    { config } as TransformContext,
    comments.map(c => ({ value: c.value }))
  );
  if (!shouldProcess) {
    const { code } = generate(program, { sourceFileName: options.filename ?? "input.tsx" });
    return { code, map: null };
  }

  const ctx = createTransformContext(config, options.filename, comments);

  walk(program, {
    JSXElement(node: JSXElement, wctx: WalkContext) {
      const expr = transformJSX(ctx, node);
      wctx.replace({ type: "ExpressionStatement", expression: expr } );
    },
    JSXFragment(node: JSXFragment, wctx: WalkContext) {
      const expr = transformJSX(ctx, node);
      wctx.replace({ type: "ExpressionStatement", expression: expr } );
    },
  });

  postprocess(ctx);

  const { code, map } = generate(program, {
    sourceFileName: options.filename ?? "input.tsx",
  });

  return { code, map: map ?? null };
}

export default transform;
