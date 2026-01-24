import { createFixtureTest } from "./helpers";

createFixtureTest("templates and event delegation", "templates.tsx");

createFixtureTest("templates with SSR", "templates.tsx", {
  platform: "node",
  plugin: { solid: { generate: "ssr" } },
});

createFixtureTest("templates with universal", "templates.tsx", {
  plugin: {
    solid: { generate: "universal", moduleName: "#universal-mode-renderer" },
  },
});

createFixtureTest("templates with universal and hydratable", "templates.tsx", {
  plugin: {
    solid: {
      generate: "universal",
      moduleName: "#universal-mode-renderer",
      hydratable: true,
    },
  },
});

createFixtureTest("templates with disabled delegation", "templates.tsx", {
  plugin: { solid: { delegateEvents: false } },
});

createFixtureTest("templates with hydratable SSR", "templates.tsx", {
  platform: "node",
  plugin: { solid: { generate: "ssr", hydratable: true } },
});
