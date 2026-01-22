import type { File, NodePath } from "@babel/core";
import { template } from "@babel/core";
import { buildDynamicImport } from "@babel/helper-module-transforms";
import * as t from "@babel/types";

const requireNoInterop = (source: t.Expression) =>
  template.expression.ast`require(${source})`;

const requireInterop = (source: t.Expression, file: File) =>
  t.callExpression(file.addHelper("interopRequireWildcard"), [
    requireNoInterop(source),
  ]);

export function transformDynamicImport(
  path: NodePath<t.CallExpression | t.ImportExpression>,
  noInterop: boolean,
  file: File,
) {
  const buildRequire = noInterop ? requireNoInterop : requireInterop;

  path.replaceWith(
    buildDynamicImport(path.node, true, false, (specifier) =>
      buildRequire(specifier, file),
    ),
  );
}
