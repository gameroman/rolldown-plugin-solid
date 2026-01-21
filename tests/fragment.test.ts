import { createFixtureTest } from "./helpers";

createFixtureTest("SolidJS component with fragments", "basic.tsx");

createFixtureTest(
  "SolidJS component with fragments and hydratable option",
  "fragment.tsx",
  { plugin: { solid: { hydratable: true } } },
);

createFixtureTest(
  "SolidJS component with fragments and SSR option",
  "fragment.tsx",
  { plugin: { solid: { generate: "ssr" } } },
);
