import { describe } from "bun:test";
import { createFixtureTest } from "./helpers";

describe("rolldown-plugin-solid", () => {
  createFixtureTest("basic SolidJS component", "basic.tsx");

  createFixtureTest("component with hydratable option", "basic.tsx", {
    plugin: { solid: { hydratable: true } },
  });
});
