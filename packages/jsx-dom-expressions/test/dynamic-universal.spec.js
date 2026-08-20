import { join } from "path";
import { fileURLToPath } from "url";

import { runFixtures } from "./helpers.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

runFixtures("Convert JSX", join(__dirname, "__universal_fixtures__"), {
  moduleName: "r-custom",
  builtIns: ["For", "Show"],
  generate: "dynamic",
  staticMarker: "@once",
});
