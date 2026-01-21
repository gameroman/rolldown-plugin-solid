import type { PluginItem } from "@babel/core";
// @ts-expect-error: Babel types are not installed
import { declarePreset } from "@babel/helper-plugin-utils";
import transformModulesCommonJS from "../plugin-transform-modules-commonjs";
import transformTypeScript from "../plugin-transform-typescript";
import type { Options } from "./normalize-options";
import normalizeOptions from "./normalize-options";
import pluginRewriteTSImports from "./plugin-rewrite-ts-imports";

export type { Options as PresetTypescriptOptions };

const presetTypescript: unknown = declarePreset((api, opts: Options) => {
  const {
    allExtensions,
    ignoreExtensions,
    allowNamespaces,
    disallowAmbiguousJSXLike,
    isTSX,
    jsxPragma,
    jsxPragmaFrag,
    onlyRemoveTypeImports,
    optimizeConstEnums,
    rewriteImportExtensions,
  } = normalizeOptions(opts);

  const pluginOptions = (disallowAmbiguousJSXLike: boolean) => ({
    allowDeclareFields: opts.allowDeclareFields,
    allowNamespaces,
    disallowAmbiguousJSXLike,
    jsxPragma,
    jsxPragmaFrag,
    onlyRemoveTypeImports,
    optimizeConstEnums,
  });

  const getPlugins = (isTSX: boolean, disallowAmbiguousJSXLike: boolean) => {
    return [
      [
        transformTypeScript,
        { isTSX, ...pluginOptions(disallowAmbiguousJSXLike) },
      ] satisfies PluginItem,
    ];
  };

  const disableExtensionDetect = allExtensions || ignoreExtensions;

  return {
    plugins: rewriteImportExtensions ? [pluginRewriteTSImports] : [],
    overrides: disableExtensionDetect
      ? [{ plugins: getPlugins(isTSX, disallowAmbiguousJSXLike) }]
      : // Only set 'test' if explicitly requested, since it requires that
        // Babel is being called with a filename.
        [
          {
            test: /\.ts$/,
            plugins: getPlugins(false, false),
          },
          {
            test: /\.mts$/,
            sourceType: "module",
            plugins: getPlugins(false, true),
          },
          {
            test: /\.cts$/,
            sourceType: "unambiguous",
            plugins: [
              [transformModulesCommonJS, { allowTopLevelThis: true }],
              [transformTypeScript, pluginOptions(true)],
            ],
          },
          {
            test: /\.tsx$/,
            // disallowAmbiguousJSXLike is a no-op when parsing TSX, since it's
            // always disallowed.
            plugins: getPlugins(true, false),
          },
        ],
  };
});
export default presetTypescript;
