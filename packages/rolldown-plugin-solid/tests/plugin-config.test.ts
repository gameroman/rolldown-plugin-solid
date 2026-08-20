import { describe, expect, it } from "bun:test";

import solidPlugin from "../src";

describe("Plugin Configuration", () => {
  it("should create plugin with default options", () => {
    expect(solidPlugin()).toBeDefined();
  });

  it("should create plugin with custom options", () => {
    expect(
      solidPlugin({ solid: { generate: "ssr", hydratable: true } }),
    ).toBeDefined();
  });
});
