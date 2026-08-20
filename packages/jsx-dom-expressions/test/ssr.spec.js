import { runFixtures } from "./helpers.mjs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

runFixtures("Convert JSX", join(__dirname, "__ssr_fixtures__"), {
  moduleName: "r-server",
  builtIns: ["For", "Show"],
  generate: "ssr",
  contextToCustomElements: true,
  staticMarker: "@once",
});
