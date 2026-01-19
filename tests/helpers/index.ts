import { expect, it } from "bun:test";

import { resolve } from "node:path";
import { build } from "rolldown";
import solidPlugin from "../../dist/index.mjs";

const testDir = resolve(import.meta.dir, "../fixtures");

interface FixtureOptions {
  platform?: "browser" | "node";
  plugin?: Parameters<typeof solidPlugin>[0];
}

export function createFixtureTest(
  name: string,
  fixture: string,
  options?: FixtureOptions,
) {
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
}
