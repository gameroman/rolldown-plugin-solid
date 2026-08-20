import { runFixtures } from "./helpers.mjs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

runFixtures("Convert JSX omitAttributeSpacing: false", join(__dirname, "__dom_omit_attribute_spacing_no_omit_fixtures__"), {
  moduleName: "r-dom",
  builtIns: ["For", "Show"],
  generate: "dom",
  wrapConditionals: true,
  contextToCustomElements: true,
  staticMarker: "@once",
  requireImportSource: false,
  omitLastClosingTag: false,
  omitQuotes: false,
  omitAttributeSpacing: false,
});
