import type { PluginPass } from "@babel/core";
// @ts-expect-error: Babel types are not installed
import { declare } from "@babel/helper-plugin-utils";
import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

const pluginRewriteTSImports = declare(({ types: t, template }) => {
  function maybeReplace(
    source: t.ArgumentPlaceholder | t.Expression,
    path: NodePath,
    state: PluginPass,
  ) {
    if (!source) return;
    // todo: if we want to support `preserveJsx`, we can register a global flag via file.set from transform-react-jsx, and read it here.
    const preserveJsx = false;
    if (t.isStringLiteral(source)) {
      if (/^\.\.?\//.test(source.value)) {
        // @see packages/babel-helpers/src/helpers/tsRewriteRelativeImportExtensions.ts
        source.value = source.value.replace(
          /\.(tsx)$|((?:\.d)?)((?:\.[^./]+)?)\.([cm]?)ts$/i,
          (m, tsx, d, ext, cm) =>
            tsx
              ? preserveJsx
                ? ".jsx"
                : ".js"
              : d && (!ext || !cm)
                ? m
                : d + ext + "." + cm.toLowerCase() + "js",
        );
      }
      return;
    }

    if (state.availableHelper("tsRewriteRelativeImportExtensions")) {
      path.replaceWith(
        t.callExpression(
          state.addHelper("tsRewriteRelativeImportExtensions"),
          preserveJsx ? [source, t.booleanLiteral(true)] : [source],
        ),
      );
    } else {
      path.replaceWith(
        template.expression
          .ast`(${source} + "").replace(/([\\/].*\.[mc]?)tsx?$/, "$1js")`,
      );
    }
  }

  return {
    name: "preset-typescript/plugin-rewrite-ts-imports",
    visitor: {
      "ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration"(
        path: NodePath<
          | t.ImportDeclaration
          | t.ExportAllDeclaration
          | t.ExportNamedDeclaration
        >,
        state,
      ) {
        const node = path.node;
        const kind = t.isImportDeclaration(node)
          ? node.importKind
          : node.exportKind;
        if (kind === "value") {
          maybeReplace(node.source, path.get("source"), state);
        }
      },
      CallExpression(path, state) {
        if (true && t.isImport(path.node.callee)) {
          maybeReplace(
            // The argument of import must not be a spread element
            path.node.arguments[0] as t.ArgumentPlaceholder | t.Expression,
            path.get("arguments.0"),
            state,
          );
        }
      },
      ImportExpression(path, state) {
        maybeReplace(path.node.source, path.get("source"), state);
      },
    },
  };
});
export default pluginRewriteTSImports;
