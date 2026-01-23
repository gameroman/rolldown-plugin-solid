import { createFixtureTest } from "./helpers";

createFixtureTest("complex HTML structures", "validation.tsx");

createFixtureTest("complex HTML with SSR", "validation.tsx", {
  platform: "node",
  plugin: { solid: { generate: "ssr" } },
});

createFixtureTest("complex HTML with universal", "validation.tsx", {
  plugin: {
    solid: { generate: "universal", moduleName: "#universal-mode-renderer" },
  },
});
