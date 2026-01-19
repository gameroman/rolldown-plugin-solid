import { describe } from "bun:test";
import { createFixtureTest } from "./helpers";

describe("rolldown-plugin-solid", () => {
  createFixtureTest("component with createStore", "create-store.tsx");
});
