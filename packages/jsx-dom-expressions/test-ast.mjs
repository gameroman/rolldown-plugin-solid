import { is } from "yuku-ast";
import { parse } from "yuku-parser";

const code = `const x = state.count;`;
const ast = parse(code, { sourceType: "module" });

const decl = ast.program.body[0].declarations[0];
const memberExpr = decl.init;

console.log("type:", memberExpr.type);
console.log("is.MemberExpression:", is.MemberExpression(memberExpr));
console.log(
  "is.StaticMemberExpression:",
  is.StaticMemberExpression(memberExpr),
);
console.log(
  "is.ComputedMemberExpression:",
  is.ComputedMemberExpression(memberExpr),
);

// Also test Literal
const code2 = `"hello"`;
const ast2 = parse(code2, { sourceType: "module" });
// Check what is.Literal, is.StringLiteral, is.NumericLiteral do
const lit = { type: "Literal", value: "hello" };
console.log("\nis.Literal(lit):", is.Literal(lit));
console.log("is.StringLiteral(lit):", is.StringLiteral(lit));
const numLit = { type: "Literal", value: 42 };
console.log("is.NumericLiteral(numLit):", is.NumericLiteral(numLit));
console.log("is.Literal(numLit):", is.Literal(numLit));
