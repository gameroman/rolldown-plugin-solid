import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { build } from "rolldown";
import solidPlugin from "../dist/index.mjs";

describe("rolldown-plugin-solid", () => {
  const testDir = resolve(import.meta.dir, "fixtures");

  interface FixtureOptions {
    platform?: "browser" | "node";
    plugin?: Parameters<typeof solidPlugin>[0];
  }

  const createFixtureTest = (
    name: string,
    fixture: string,
    options?: FixtureOptions,
  ) => {
    it(`should transform ${name}`, async () => {
      const result = await build({
        platform: options?.platform ?? "browser",
        input: resolve(testDir, fixture),
        plugins: options?.plugin
          ? [solidPlugin(options.plugin)]
          : [solidPlugin()],
        output: {
          format: "esm",
        },
        write: false,
      });

      const code = result.output[0].code;
      expect(code).toMatchSnapshot();
    });
  };

  createFixtureTest("basic SolidJS component", "basic.tsx");

  createFixtureTest("SSR component", "ssr.tsx", {
    platform: "node",
    plugin: { solid: { generate: "ssr" } },
  });

  createFixtureTest("component with hydratable option", "basic.tsx", {
    plugin: { solid: { hydratable: true } },
  });

  createFixtureTest("SSR with hydratable option", "ssr.tsx", {
    platform: "node",
    plugin: { solid: { generate: "ssr", hydratable: true } },
  });

  createFixtureTest("standalone component", "component.tsx");
  createFixtureTest("component with props", "props.tsx");
  createFixtureTest("component with children", "children.tsx");
  createFixtureTest("component with effects", "effects.tsx");
  createFixtureTest("component with conditional rendering", "conditional.tsx");
  createFixtureTest("component with list rendering", "list.tsx");
  createFixtureTest("component with Suspense", "suspense.tsx");
  createFixtureTest("component with ErrorBoundary", "error-boundary.tsx");
  createFixtureTest("component with Context", "context.tsx");
  createFixtureTest("component with Resource", "resource.tsx");
  createFixtureTest("component with Memo", "memo.tsx");
  createFixtureTest("component with createRoot", "create-root.tsx");
  createFixtureTest("component with Portal", "portal.tsx");
  createFixtureTest("component with Dynamic", "dynamic.tsx");
  createFixtureTest("component with batch", "batch.tsx");
  createFixtureTest("component with onMount", "onmount.tsx");
});
