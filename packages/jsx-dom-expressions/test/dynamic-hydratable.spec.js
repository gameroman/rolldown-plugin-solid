import { runFixtures } from "./helpers.mjs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

runFixtures("Convert JSX", join(__dirname, "__dom_hydratable_fixtures__"), {
  moduleName: "r-dom",
  builtIns: ["For", "Show"],
  generate: "dynamic",
  renderers: [
    {
      name: "dom",
      elements: [
        "table", "tbody", "div", "h1", "span", "header", "footer", "slot",
        "my-el", "my-element", "module", "input", "img", "iframe", "button",
        "a", "svg", "rect", "x", "y", "linearGradient", "stop", "style",
        "li", "ul", "label", "text", "namespace:tag", "html", "head", "body",
        "title", "meta", "link", "footer", "script", "noscript", "select",
        "video", "option",
      ],
      moduleName: "r-dom",
    },
  ],
  hydratable: true,
  contextToCustomElements: true,
  staticMarker: "@once",
});
