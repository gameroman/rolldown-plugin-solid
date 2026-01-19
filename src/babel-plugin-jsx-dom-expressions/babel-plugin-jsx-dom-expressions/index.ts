import type { Visitor } from "@babel/core";
import SyntaxJSX from "../../syntax-jsx";
import postprocess from "./shared/postprocess";
import preprocess from "./shared/preprocess";
import { transformJSX } from "./shared/transform";

export default (): {
  name: string;
  inherits: any;
  visitor: Visitor<{ opts: any }>;
} => {
  return {
    name: "JSX DOM Expressions",
    inherits: SyntaxJSX.default,
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
