import { describe, expect, it } from "bun:test";

import { resolve } from "node:path";
import { build } from "rolldown";

import solidPluginDist from "../../dist/index.mjs";
import solidPluginSrc from "../../src";

const testDir = resolve(import.meta.dir, "../fixtures");

interface FixtureOptions {
  platform?: "browser" | "node";
  plugin?: Parameters<typeof solidPluginSrc>[0];
}

export function createFixtureTest(
  name: string,
  fixture: string,
  options?: FixtureOptions,
) {
  describe("rolldown-plugin-solid", async () => {
    const srcResult = await build({
      platform: options?.platform ?? "browser",
      input: resolve(testDir, fixture),
      plugins: [solidPluginSrc(options?.plugin)],
      output: { format: "esm" },
      write: false,
    });
    const srcCode = srcResult.output[0].code;

    const distResult = await build({
      platform: options?.platform ?? "browser",
      input: resolve(testDir, fixture),
      plugins: [solidPluginDist(options?.plugin)],
      output: { format: "esm" },
      write: false,
    });

    const distCode = distResult.output[0].code;

    describe("src", () => {
      it(`should transform ${name}`, async () => {
        expect(srcCode).toMatchSnapshot();
      });
    });

    describe("dist", () => {
      it(`should transform ${name}`, async () => {
        expect(distCode).toMatchSnapshot();
      });
    });

    it(`have same results when transforming ${name} for src and dist `, async () => {
      expect(srcCode).toBe(distCode);
    });
  });
}
