import { is, b } from "yuku-ast";

import { registerImportMethod, generateUid } from "../shared/utils";
import type {
  TransformContext,
  TransformResult,
  Expression,
  Statement,
  VariableDeclarator,
} from "../types";

function getTemplateString(template: string | string[]): string {
  return Array.isArray(template) ? template.join("") : template;
}

function getExpression(stmt: Statement): Expression {
  return (stmt as { expression: Expression }).expression;
}

export function createTemplate(
  ctx: TransformContext,
  result: TransformResult,
): Expression {
  if (!result.template) {
    return result.exprs[0]
      ? getExpression(result.exprs[0])
      : b.Identifier({ name: "undefined" });
  }

  let template: Expression;

  if (!Array.isArray(result.template)) {
    template = b.Literal({ value: result.template });
  } else if (result.template.length === 1) {
    template = b.Literal({ value: result.template[0] });
  } else {
    const strings = result.template.map((tmpl) => b.Literal({ value: tmpl }));
    template = b.ArrayExpression({ elements: strings });
  }

  const found = ctx.templates.find(
    (tmp) => tmp.template === getTemplateString(result.template),
  );

  let id: string;
  if (!found) {
    id = generateUid(ctx, "tmpl$");
    ctx.templates.push({
      id,
      template: getTemplateString(result.template),
      isSVG: false,
      isCE: false,
      isImportNode: false,
      renderer: "ssr",
    });
  } else {
    id = found.id;
  }

  const idNode = b.Identifier({ name: id });

  if (result.wontEscape) {
    if (!Array.isArray(result.template) || result.template.length === 1) {
      return idNode;
    } else if (
      result.template.length === 2 &&
      result.templateValues &&
      is.CallExpression(result.templateValues[0]) &&
      result.templateValues[0].callee?.name === "_$ssrHydrationKey"
    ) {
      return b.BinaryExpression({
        operator: "+",
        left: b.BinaryExpression({
          operator: "+",
          left: b.MemberExpression({
            object: idNode,
            property: b.Literal({ value: 0 }),
            computed: true,
            optional: false,
          }),
          right: result.templateValues[0],
          optional: false,
        }),
        right: b.MemberExpression({
          object: idNode,
          property: b.Literal({ value: 1 }),
          computed: true,
          optional: false,
        }),
        optional: false,
      });
    }
  }

  const templateValues: Expression[] = result.templateValues || [];
  const args: Expression[] =
    Array.isArray(result.template) && result.template.length > 1
      ? [idNode, ...templateValues]
      : [idNode];

  return b.CallExpression({
    callee: registerImportMethod(ctx, "ssr"),
    arguments: args,
    optional: false,
  });
}

export function appendTemplates(
  ctx: TransformContext,
  templates: TransformResult[],
): void {
  const declarators: VariableDeclarator[] = templates.map((template) => {
    let init: Expression;
    if (Array.isArray(template.template) && template.template.length > 1) {
      init = b.ArrayExpression({
        elements: template.template.map((s) => b.Literal({ value: s })),
      });
    } else {
      init = b.Literal({ value: getTemplateString(template.template) });
    }
    return b.VariableDeclarator({
      id: b.Identifier({ name: template.id! }),
      init,
    });
  });

  ctx.out.body.unshift(
    b.VariableDeclaration({
      kind: "var",
      declarations: declarators,
    }),
  );
}
