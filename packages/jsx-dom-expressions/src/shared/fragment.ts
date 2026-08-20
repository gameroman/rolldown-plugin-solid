import { decode } from "html-entities";
import { is, b } from "yuku-ast";

import type {
  TransformContext,
  TransformResult,
  PluginConfig,
  Node,
} from "../types";
import { transformNode, getCreateTemplate } from "./transform";
import { filterChildren, trimWhitespace } from "./utils";

export default function transformFragmentChildren(
  ctx: TransformContext,
  children: Node[],
  results: TransformResult,
  config: PluginConfig,
): void {
  const filteredChildren = filterChildren(children);
  const childNodes = filteredChildren.reduce((memo, child) => {
    if (is.JSXText(child)) {
      const v = decode(trimWhitespace(child.raw));
      if (v.length) memo.push(b.Literal({ value: v }));
    } else {
      const childResult = transformNode(ctx, child, {
        topLevel: true,
        fragmentChild: true,
        lastElement: true,
      });
      if (childResult) {
        const templateFn = getCreateTemplate(config, childResult);
        memo.push(templateFn(ctx, childResult, true));
      }
    }
    return memo;
  }, []);

  results.exprs.push(
    b.ExpressionStatement({
      expression:
        childNodes.length === 1
          ? childNodes[0]
          : b.ArrayExpression({ elements: childNodes }),
    }),
  );
}
