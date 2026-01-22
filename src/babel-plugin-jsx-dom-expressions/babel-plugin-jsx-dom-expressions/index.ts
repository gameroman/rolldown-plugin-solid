// @ts-expect-error: Babel types are not installed
import { declare } from "@babel/helper-plugin-utils";
import type { Visitor } from "@babel/traverse";
import postprocess from "./shared/postprocess";
import preprocess from "./shared/preprocess";
import { transformJSX } from "./shared/transform";

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

const jsxTransform = (): {
  name: string;
  inherits: any;
  visitor: Visitor<{ opts: any }>;
} => {
  return {
    name: "JSX DOM Expressions",
    inherits: syntaxJSX,
    visitor: {
      JSXElement: transformJSX,
      JSXFragment: transformJSX,
      Program: {
        enter: preprocess,
        exit: postprocess,
      },
    },
  };
};

export default jsxTransform;
