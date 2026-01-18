import { describe, expect, it } from "bun:test";
import { build } from "rolldown";
import solidPlugin from "../src";

describe("Rolldown Build Integration", () => {
  it("should build basic component without errors", async () => {
    const result = await build({
      input: "./tests/fixtures/basic.tsx",
      plugins: [solidPlugin()],
      output: {
        dir: "./dist-test",
        format: "esm",
      },
      write: false,
    });

    expect(result.output).toHaveLength(1);
    expect(result.output[0].type).toBe("chunk");
  });

  it("should build SSR component without errors", async () => {
    const result = await build({
      input: "./tests/fixtures/ssr.tsx",
      plugins: [solidPlugin({ solid: { generate: "ssr" } })],
      output: {
        dir: "./dist-test",
        format: "esm",
      },
      write: false,
    });

    expect(result.output).toHaveLength(1);
    expect(result.output[0].type).toBe("chunk");
  });
});
