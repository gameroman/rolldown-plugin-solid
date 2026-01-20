import { describe, expect, it } from "bun:test";

import { resolve } from "node:path";
import { build } from "rolldown";

import solidPluginDist from "../../dist/index.mjs";
import solidPluginSrc from "../../src";

const testDir = resolve(import.meta.dir, "../fixtures");

interface FixtureOptions {
  platform?: "browser" | "node";
  plugin?: Parameters<typeof solidPluginDist>[0];
}

export function createFixtureTest(
  name: string,
  fixture: string,
  options?: FixtureOptions,
) {
  describe("rolldown-plugin-solid", () => {
    describe("src", () => {
      it(`should transform ${name}`, async () => {
        const result = await build({
          platform: options?.platform ?? "browser",
          input: resolve(testDir, fixture),
          plugins: [solidPluginSrc(options?.plugin)],
          output: { format: "esm" },
          write: false,
        });

        const code = result.output[0].code;
        expect(code).toMatchSnapshot();
      });
    });

    describe("dist", () => {
      it(`should transform ${name}`, async () => {
        const result = await build({
          platform: options?.platform ?? "browser",
          input: resolve(testDir, fixture),
          plugins: [solidPluginDist(options?.plugin)],
          output: { format: "esm" },
          write: false,
        });

        const code = result.output[0].code;
        expect(code).toMatchSnapshot();
      });
    });
  });
}
