import { createFixtureTest } from "./helpers";

createFixtureTest("hydratable html/head/body elements", "hydratable-root.tsx", {
  plugin: { solid: { hydratable: true } },
});
