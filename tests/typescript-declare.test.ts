import { createFixtureTest } from "./helpers";

createFixtureTest("with typescript declare", "typescript-declare.tsx", {
  plugin: { typescript: { allowDeclareFields: true } },
});
