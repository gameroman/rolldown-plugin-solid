import * as t from "@babel/types";

type TransparentExprWrapper =
  | t.TSAsExpression
  | t.TSSatisfiesExpression
  | t.TSTypeAssertion
  | t.TSNonNullExpression
  | t.TypeCastExpression
  | t.ParenthesizedExpression;

// A transparent expression wrapper is an AST node that most plugins will wish
// to skip, as its presence does not affect the behaviour of the code. This
// includes expressions used for types, and extra parenthesis. For example, in
// (a as any)(), this helper can be used to skip the TSAsExpression when
// determining the callee.
function isTransparentExprWrapper(
  node: t.Node,
): node is TransparentExprWrapper {
  return (
    t.isTSAsExpression(node) ||
    t.isTSSatisfiesExpression(node) ||
    t.isTSTypeAssertion(node) ||
    t.isTSNonNullExpression(node) ||
    t.isTypeCastExpression(node) ||
    t.isParenthesizedExpression(node)
  );
}

export function skipTransparentExprWrapperNodes(
  node: t.Expression | t.Super,
): t.Expression | t.Super {
  while (isTransparentExprWrapper(node)) {
    node = node.expression;
  }
  return node;
}
