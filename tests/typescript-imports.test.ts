import { createFixtureTest } from "./helpers";

createFixtureTest(
  "TypeScript import extensions to JavaScript",
  "typescript-imports/index.ts",
  { plugin: { typescript: { rewriteImportExtensions: true } } },
);

createFixtureTest(
  "TypeScript import extensions to JavaScript (rewriteImportExtensions: false)",
  "typescript-imports/index.ts",
  { plugin: { typescript: { rewriteImportExtensions: false } } },
);
