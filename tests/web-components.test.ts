import { describe } from "bun:test";
import { createFixtureTest } from "./helpers";

describe("Web Components Integration", () => {
  createFixtureTest(
    "web components with contextToCustomElements enabled",
    "web-components.tsx",
    { plugin: { solid: { contextToCustomElements: true } } },
  );

  createFixtureTest(
    "web components with contextToCustomElements disabled",
    "web-components.tsx",
    { plugin: { solid: { contextToCustomElements: false } } },
  );

  createFixtureTest("web components with SSR mode", "web-components.tsx", {
    plugin: {
      solid: { generate: "ssr", hydratable: true, delegateEvents: false },
    },
  });
});
