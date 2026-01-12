import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { build } from "rolldown";
import solidPlugin from "../src";

describe("rolldown-plugin-solid", () => {
  const testDir = resolve(import.meta.dir, "fixtures");

  it("should transform basic SolidJS component", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "basic.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform SSR component", async () => {
    const result = await build({
      platform: "node",
      input: resolve(testDir, "ssr.tsx"),
      plugins: [solidPlugin({ solid: { generate: "ssr" } })],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform with hydratable option", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "basic.tsx"),
      plugins: [solidPlugin({ solid: { hydratable: true } })],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform SSR with hydratable option", async () => {
    const result = await build({
      platform: "node",
      input: resolve(testDir, "ssr.tsx"),
      plugins: [solidPlugin({ solid: { generate: "ssr", hydratable: true } })],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform standalone component", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "component.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });
});
