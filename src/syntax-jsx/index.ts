// @ts-expect-error: Babel types are not installed
import { declare } from "@babel/helper-plugin-utils";

const syntaxJSX = declare(() => {
  return {
    name: "syntax-jsx",

    manipulateOptions(opts, parserOpts) {
      // If the Typescript plugin already ran, it will have decided whether
      // or not this is a TSX file.
      if (
        parserOpts.plugins.some(
          (p) => (Array.isArray(p) ? p[0] : p) === "typescript",
        )
      ) {
        return;
      }

      parserOpts.plugins.push("jsx");
    },
  };
});

export default syntaxJSX;
