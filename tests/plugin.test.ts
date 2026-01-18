import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { build } from "rolldown";
import solidPlugin from "../dist/index.mjs";

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

  it("should transform component with props", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "props.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with children", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "children.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with effects", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "effects.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with conditional rendering", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "conditional.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with list rendering", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "list.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with Suspense", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "suspense.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with ErrorBoundary", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "error-boundary.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with Context", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "context.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with Resource", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "resource.tsx"),
      plugins: [solidPlugin()],
      output: {
        format: "esm",
      },
      write: false,
    });

    const code = result.output[0].code;
    expect(code).toMatchSnapshot();
  });

  it("should transform component with Memo", async () => {
    const result = await build({
      platform: "browser",
      input: resolve(testDir, "memo.tsx"),
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
