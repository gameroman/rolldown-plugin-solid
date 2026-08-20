import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

import { transform } from "../src/index.ts";

export function runFixtures(name, fixturesDir, options) {
  const entries = readdirSync(fixturesDir, { withFileTypes: true });

  describe(name, () => {
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const fixtureDir = join(fixturesDir, entry.name);
      const codePath = join(fixtureDir, "code.js");
      const outputPath = join(fixtureDir, "output.js");

      let code, expectedOutput;
      try {
        code = readFileSync(codePath, "utf-8");
      } catch {
        continue;
      }
      try {
        expectedOutput = readFileSync(outputPath, "utf-8");
      } catch {
        continue;
      }

      test(entry.name, () => {
        const result = transform(code, options);
        const actual = result.code.trimEnd();
        const expected = expectedOutput.trimEnd();
        expect(actual).toBe(expected);
      });
    }
  });
}
