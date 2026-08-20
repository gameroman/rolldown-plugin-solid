import { b, walk, WalkContext } from "yuku-ast";
import { generate } from "yuku-codegen";
import { parse } from "yuku-parser";

import postprocess from "./shared/postprocess";
import preprocess from "./shared/preprocess";
import { transformJSX } from "./shared/transform";
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

export function transform(
  source: string,
  options: TransformOptions = {},
): TransformResult {
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

  const { program, comments } = parse(source, {
    lang: lang === "ts" || lang === "tsx" ? "tsx" : "jsx",
  });

  const shouldProcess = preprocess(
    { config } as TransformContext,
    comments.map((c) => ({ value: c.value })),
  );
  if (!shouldProcess) {
    const { code } = generate(program, {
      sourceFileName: options.filename ?? "input.tsx",
    });
    return { code, map: null };
  }

  const ctx = createTransformContext(config, options.filename, comments);

  walk(program, {
    JSXElement(node: JSXElement, wctx: WalkContext) {
      const expr = transformJSX(ctx, node);
      wctx.replace(expr);
    },
    JSXFragment(node: JSXFragment, wctx: WalkContext) {
      const expr = transformJSX(ctx, node);
      wctx.replace(expr);
    },
  });

  postprocess(ctx);

  const imports = Array.from(ctx.imports.values()).map((imp) => {
    const imported =
      imp.importedName === imp.localName
        ? b.Identifier({ name: imp.importedName })
        : b.Identifier({ name: imp.importedName });
    return b.ImportDeclaration({
      specifiers: [
        b.ImportSpecifier({
          local: b.Identifier({ name: imp.localName }),
          imported,
        }),
      ],
      source: b.Literal({ value: imp.moduleName }),
      importKind: "value",
    });
  });

  program.body.unshift(...imports, ...ctx.out.body);

  const { code, map } = generate(program, {
    sourceFileName: options.filename ?? "input.tsx",
  });

  return { code, map: map ?? null };
}

export default transform;
