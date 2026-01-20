import { describe } from "bun:test";
import { createFixtureTest } from "./helpers";

describe("plugin-rewrite-ts-imports", () => {
  createFixtureTest(
    "rewrites TypeScript import extensions to JavaScript",
    "typescript-imports/index.ts",
    { plugin: { typescript: { rewriteImportExtensions: true } } },
  );
});
