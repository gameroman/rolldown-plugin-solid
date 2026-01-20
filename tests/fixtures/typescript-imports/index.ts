import { Component } from "./component.ts";
import value from "./cts.cts";
import * as module from "./module.mts";
import type { MyType } from "./types.d.ts";
import { helper } from "./utils/helper.tsx";

// Dynamic import
const dynamic = await import("./dynamic.ts");

// Import() call
const dynamicImport = import("./another.tsx");

export { default } from "./default.ts";
export { something } from "./export.ts";
export * from "./export-all.tsx";
