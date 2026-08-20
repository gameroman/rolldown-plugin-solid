import { createFixtureTest } from "./helpers";

createFixtureTest("custom builtIns configuration", "config-test.tsx", {
  plugin: { solid: { builtIns: ["createResource", "createSignal"] } },
});

// TODO(bad test): Output changes when updating seroval
createFixtureTest("SSR generate mode", "config-test.tsx", {
  platform: "node",
  plugin: { solid: { generate: "ssr" } },
});

createFixtureTest("custom generated with hydratable", "config-test.tsx", {
  plugin: { solid: { generate: "dom", hydratable: true } },
});

createFixtureTest("minimal builtIns", "config-test.tsx", {
  plugin: { solid: { builtIns: ["createSignal"] } },
});
