import { createFixtureTest } from "./helpers";

// TODO(bad test): Output changes when updating seroval
createFixtureTest("SSR component", "ssr.tsx", {
  platform: "node",
  plugin: { solid: { generate: "ssr" } },
});

// TODO(bad test): Output changes when updating seroval
createFixtureTest("SSR with hydratable option", "ssr.tsx", {
  platform: "node",
  plugin: { solid: { generate: "ssr", hydratable: true } },
});
