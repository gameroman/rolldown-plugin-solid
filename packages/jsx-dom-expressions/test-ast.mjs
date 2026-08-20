import { is } from "yuku-ast";

// Check what type guards exist
const checks = [
  "ChainExpression",
  "BinaryExpression",
  "UnaryExpression",
  "OptionalMemberExpression",
  "OptionalCallExpression",
  "UpdateExpression",
  "AssignmentExpression",
  "StaticMemberExpression",
  "ComputedMemberExpression",
  "MemberExpression",
];
for (const name of checks) {
  console.log(`is.${name}: ${typeof is[name]}`);
}
