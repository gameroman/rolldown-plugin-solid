import { describe, expect, it } from "bun:test";
import solidPlugin from "../src";

describe("Universal Mode Validation", () => {
  it("should throw error when generate='universal' without moduleName", () => {
    expect(() => {
      solidPlugin({
        solid: {
          generate: "universal",
        },
      });
    }).toThrow(
      "Universal mode requires a 'moduleName' option pointing to your custom renderer",
    );
  });

  it("should not throw error when generate='universal' with moduleName", () => {
    expect(() => {
      solidPlugin({
        solid: {
          generate: "universal",
          moduleName: "my-custom-renderer",
        },
      });
    }).not.toThrow();
  });

  it("should not throw error for DOM mode without moduleName", () => {
    expect(() => {
      solidPlugin({
        solid: {
          generate: "dom",
        },
      });
    }).not.toThrow();
  });

  it("should not throw error for SSR mode without moduleName", () => {
    expect(() => {
      solidPlugin({
        solid: {
          generate: "ssr",
        },
      });
    }).not.toThrow();
  });

  it("should work with empty options object", () => {
    expect(() => {
      solidPlugin();
    }).not.toThrow();
  });
});
