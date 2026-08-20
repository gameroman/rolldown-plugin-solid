import { runFixtures } from "./helpers.mjs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

runFixtures("Convert JSX", join(__dirname, "__dynamic_fixtures__"), {
  moduleName: "r-custom",
  builtIns: ["For", "Show"],
  generate: "dynamic",
  staticMarker: "@once",
  renderers: [
    {
      name: "dom",
      elements: [
        "table", "tbody", "div", "h1", "span", "header", "footer", "slot",
        "my-el", "my-element", "module", "input", "img", "iframe", "button",
        "a", "svg", "rect", "x", "y", "linearGradient", "stop", "style",
        "li", "ul", "label", "text", "namespace:tag", "path", "noscript",
        "select", "option",
      ],
      moduleName: "r-dom",
    },
  ],
  contextToCustomElements: true,
  wrapConditionals: true,
});
