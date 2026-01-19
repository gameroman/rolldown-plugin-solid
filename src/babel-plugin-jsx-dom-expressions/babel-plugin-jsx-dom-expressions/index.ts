import type { Visitor } from "@babel/core";
import SyntaxJSX from "../../syntax-jsx";
import postprocess from "./shared/postprocess";
import preprocess from "./shared/preprocess";
import { transformJSX } from "./shared/transform";

const jsxTransform = (): {
  name: string;
  inherits: any;
  visitor: Visitor<{ opts: any }>;
} => {
  return {
    name: "JSX DOM Expressions",
    inherits: SyntaxJSX,
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
