import type { PluginItem } from "@babel/core";
import { declarePreset } from "@babel/helper-plugin-utils";
import transformModulesCommonJS from "@babel/plugin-transform-modules-commonjs";
import transformTypeScript from "../plugin-transform-typescript";
import syntaxJSX from "../syntax-jsx";
import type { Options } from "./normalize-options";
import normalizeOptions from "./normalize-options";
import pluginRewriteTSImports from "./plugin-rewrite-ts-imports";

export default declarePreset((api, opts: Options) => {
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

  const pluginOptions = undefined
    ? (disallowAmbiguousJSXLike: boolean) => ({
        allowNamespaces,
        disallowAmbiguousJSXLike,
        jsxPragma,
        jsxPragmaFrag,
        onlyRemoveTypeImports,
        optimizeConstEnums,
      })
    : (disallowAmbiguousJSXLike: boolean) => ({
        allowDeclareFields: opts.allowDeclareFields,
        allowNamespaces,
        disallowAmbiguousJSXLike,
        jsxPragma,
        jsxPragmaFrag,
        onlyRemoveTypeImports,
        optimizeConstEnums,
      });

  const getPlugins = (isTSX: boolean, disallowAmbiguousJSXLike: boolean) => {
    if (undefined) {
      const tsPlugin: PluginItem = [
        transformTypeScript,
        pluginOptions(disallowAmbiguousJSXLike),
      ];
      return isTSX ? [tsPlugin, syntaxJSX] : [tsPlugin];
    } else {
      return [
        [
          transformTypeScript,
          { isTSX, ...pluginOptions(disallowAmbiguousJSXLike) },
        ] satisfies PluginItem,
      ];
    }
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
            test: !undefined
              ? /\.ts$/
              : (filename) => filename == null || filename.endsWith(".ts"),
            plugins: getPlugins(false, false),
          },
          {
            test: !undefined
              ? /\.mts$/
              : (filename) => filename?.endsWith(".mts"),
            sourceType: "module",
            plugins: getPlugins(false, true),
          },
          {
            test: !undefined
              ? /\.cts$/
              : (filename) => filename?.endsWith(".cts"),
            sourceType: "unambiguous",
            plugins: [
              [transformModulesCommonJS, { allowTopLevelThis: true }],
              [transformTypeScript, pluginOptions(true)],
            ],
          },
          {
            test: !undefined
              ? /\.tsx$/
              : (filename) => filename?.endsWith(".tsx"),
            // disallowAmbiguousJSXLike is a no-op when parsing TSX, since it's
            // always disallowed.
            plugins: getPlugins(true, false),
          },
        ],
  };
});
