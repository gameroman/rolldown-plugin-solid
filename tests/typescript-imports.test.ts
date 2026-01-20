import { createFixtureTest } from "./helpers";

createFixtureTest(
  "rewrites TypeScript import extensions to JavaScript",
  "typescript-imports/index.ts",
  { plugin: { typescript: { rewriteImportExtensions: true } } },
);
