import { createFixtureTest } from "./helpers";

createFixtureTest("basic SolidJS component", "basic.tsx");

createFixtureTest("component with hydratable option", "basic.tsx", {
  plugin: { solid: { hydratable: true } },
});
