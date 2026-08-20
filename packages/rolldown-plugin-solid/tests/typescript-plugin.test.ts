import { createFixtureTest } from "./helpers";

createFixtureTest(
  "typescript code with default options",
  "typescript-plugin.tsx",
);

createFixtureTest(
  "typescript code with {onlyRemoveTypeImports: true}",
  "typescript-plugin.tsx",
  { plugin: { typescript: { onlyRemoveTypeImports: true } } },
);

createFixtureTest(
  "typescript code with {optimizeConstEnums: true}",
  "typescript-plugin.tsx",
  { plugin: { typescript: { optimizeConstEnums: true } } },
);
