import { describe } from "bun:test";
import { createFixtureTest } from "./helpers";

describe("rolldown-plugin-solid", () => {
  createFixtureTest("SSR component", "ssr.tsx", {
    platform: "node",
    plugin: { solid: { generate: "ssr" } },
  });

  createFixtureTest("SSR with hydratable option", "ssr.tsx", {
    platform: "node",
    plugin: { solid: { generate: "ssr", hydratable: true } },
  });
});
