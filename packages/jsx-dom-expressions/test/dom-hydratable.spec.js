import { runFixtures } from "./helpers.mjs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

runFixtures("Convert JSX", join(__dirname, "__dom_hydratable_fixtures__"), {
  moduleName: "r-dom",
  builtIns: ["For", "Show"],
  generate: "dom",
  hydratable: true,
  contextToCustomElements: true,
  staticMarker: "@once",
});
