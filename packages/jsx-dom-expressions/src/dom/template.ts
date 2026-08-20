import { is, b } from "yuku-ast";

import {
  escapeStringForTemplate,
  getConfig,
  getNumberedId,
  getRendererConfig,
  registerImportMethod,
  generateUid,
} from "../shared/utils";
import type {
  TransformContext,
  TransformResult,
  Expression,
  Statement,
  VariableDeclarator,
  Identifier,
} from "../types";
import { setAttr } from "./element";

export function createTemplate(
  ctx: TransformContext,
  result: TransformResult,
  wrap: boolean,
): Expression {
  const config = getConfig(ctx);
  if (result.id) {
    registerTemplate(ctx, result);
    if (
      !(
        result.exprs.length ||
        result.dynamics.length ||
        result.postExprs.length
      ) &&
      result.decl!.declarations.length === 1
    ) {
      return result.decl!.declarations[0].init;
    } else {
      return b.CallExpression({
        callee: b.ArrowFunctionExpression({
          params: [],
          body: b.BlockStatement({
            body: [
              result.decl!,
              ...result.exprs.concat(
                wrapDynamics(ctx, result) || [],
                result.postExprs || [],
              ),
              b.ReturnStatement({ argument: result.id }),
            ],
          }),
        }),
        arguments: [],
        optional: false,
      });
    }
  }
  if (wrap && result.dynamic && config.memoWrapper) {
    return b.CallExpression({
      callee: registerImportMethod(ctx, config.memoWrapper),
      arguments: [
        result.exprs[0]
          ? result.exprs[0].expression
          : b.Identifier({ name: "undefined" }),
      ],
      optional: false,
    });
  }
  return result.exprs[0]
    ? result.exprs[0].expression
    : b.Identifier({ name: "undefined" });
}

export function appendTemplates(
  ctx: TransformContext,
  templates: TransformResult[],
): void {
  const declarators = templates.map((template) => {
    const tmpl = {
      cooked: template.template,
      raw: escapeStringForTemplate(template.template),
    };

    const shouldUseImportNode =
      template.hasCustomElement || template.isImportNode;
    const isMathML =
      /^<(math|annotation|annotation-xml|maction|math|merror|mfrac|mi|mmultiscripts|mn|mo|mover|mpadded|mphantom|mprescripts|mroot|mrow|ms|mspace|msqrt|mstyle|msub|msubsup|msup|mtable|mtd|mtext|mtr|munder|munderover|semantics|menclose|mfenced)(\s|>)/.test(
        template.template,
      );

    const args: Expression[] = [
      b.TemplateLiteral({
        quasis: [b.TemplateElement({ value: tmpl, tail: true })],
        expressions: [],
      }),
    ];

    if (template.isSVG || shouldUseImportNode || isMathML) {
      args.push(
        b.Literal({ value: !!shouldUseImportNode }),
        b.Literal({ value: !!template.isSVG }),
        b.Literal({ value: isMathML }),
      );
    }

    return b.VariableDeclarator({
      id: b.Identifier({ name: template.id }),
      init: b.CallExpression({
        callee: registerImportMethod(
          ctx,
          "template",
          getRendererConfig(ctx, "dom").moduleName,
        ),
        arguments: args,
        optional: false,
      }),
    });
  });

  ctx.out.body.unshift(
    b.VariableDeclaration({
      kind: "var",
      declarations: declarators,
    }),
  );
}

function registerTemplate(
  ctx: TransformContext,
  results: TransformResult,
): void {
  const { hydratable } = getConfig(ctx);
  let templateId: string | undefined;

  if (results.template.length) {
    if (!results.skipTemplate) {
      const existing = ctx.templates.find(
        (t) => t.template === results.template,
      );
      if (existing) {
        templateId = existing.id;
      } else {
        templateId = generateUid(ctx, "tmpl$");
        ctx.templates.push({
          id: templateId,
          template: results.template,
          templateWithClosingTags: results.templateWithClosingTags,
          isSVG: !!results.isSVG,
          isCE: !!results.hasCustomElement,
          isImportNode: !!results.isImportNode,
          renderer: "dom",
        });
      }
    }

    const decl = b.VariableDeclarator({
      id: results.id!,
      init: hydratable
        ? b.CallExpression({
            callee: registerImportMethod(
              ctx,
              "getNextElement",
              getRendererConfig(ctx, "dom").moduleName,
            ),
            arguments: templateId ? [b.Identifier({ name: templateId })] : [],
            optional: false,
          })
        : b.CallExpression({
            callee: b.Identifier({ name: templateId! }),
            arguments: [],
            optional: false,
          }),
    });

    results.declarations.unshift(decl);
  }

  results.decl = b.VariableDeclaration({
    kind: "var",
    declarations: results.declarations,
  });
}

function wrapDynamics(
  ctx: TransformContext,
  result: TransformResult,
): Statement[] {
  if (!result.dynamics.length) return [];
  const config = getConfig(ctx);
  const effectWrapperId = registerImportMethod(ctx, config.effectWrapper);

  if (result.dynamics.length === 1) {
    let dynamicStyle: boolean | undefined;
    const prevValue =
      result.dynamics[0].key === "classList" ||
      result.dynamics[0].key === "style" ||
      (dynamicStyle = result.dynamics[0].key.startsWith("style:"))
        ? b.Identifier({ name: "_$p" })
        : undefined;

    if (dynamicStyle) {
      result.dynamics[0].value = b.AssignmentExpression({
        operator: "=",
        left: prevValue!,
        right: result.dynamics[0].value,
      });
    } else if (
      result.dynamics[0].key.startsWith("class:") &&
      !is.BooleanLiteral(result.dynamics[0].value) &&
      !is.UnaryExpression(result.dynamics[0].value)
    ) {
      result.dynamics[0].value = b.UnaryExpression({
        operator: "!",
        argument: b.UnaryExpression({
          operator: "!",
          argument: result.dynamics[0].value,
          prefix: true,
        }),
        prefix: true,
      });
    }

    return [
      b.ExpressionStatement({
        expression: b.CallExpression({
          callee: effectWrapperId,
          arguments: [
            b.ArrowFunctionExpression({
              params: prevValue ? [prevValue] : [],
              body: setAttr(
                ctx,
                result.dynamics[0].elem,
                result.dynamics[0].key,
                result.dynamics[0].value,
                {
                  isSVG: result.dynamics[0].isSVG,
                  isCE: result.dynamics[0].isCE,
                  tagName: result.dynamics[0].tagName,
                  dynamic: true,
                  prevId: prevValue,
                },
              ),
            }),
          ],
          optional: false,
        }),
      }),
    ];
  }

  const prevId = b.Identifier({ name: "_p$" });
  const declarations: VariableDeclarator[] = [];
  const statements: Statement[] = [];
  const properties: Identifier[] = [];

  result.dynamics.forEach(
    ({ elem, key, value, isSVG, isCE, tagName }, index) => {
      const varIdent = b.Identifier({ name: generateUid(ctx, "v$") });
      const propIdent = b.Identifier({ name: getNumberedId(index) });
      const propMember = b.MemberExpression({
        object: prevId,
        property: propIdent,
        computed: true,
        optional: false,
      });

      if (
        key.startsWith("class:") &&
        !is.BooleanLiteral(value) &&
        !is.UnaryExpression(value)
      ) {
        value = b.UnaryExpression({
          operator: "!",
          argument: b.UnaryExpression({
            operator: "!",
            argument: value,
            prefix: true,
          }),
          prefix: true,
        });
      }

      properties.push(propIdent);
      declarations.push(b.VariableDeclarator({ id: varIdent, init: value }));

      if (key === "classList" || key === "style") {
        statements.push(
          b.ExpressionStatement({
            expression: b.AssignmentExpression({
              operator: "=",
              left: propMember,
              right: setAttr(ctx, elem, key, varIdent, {
                isSVG,
                isCE,
                tagName,
                dynamic: true,
                prevId: propMember,
              }),
            }),
          }),
        );
      } else {
        const prev = key.startsWith("style:") ? varIdent : undefined;
        statements.push(
          b.ExpressionStatement({
            expression: b.LogicalExpression({
              operator: "&&",
              left: b.BinaryExpression({
                operator: "!==",
                left: varIdent,
                right: propMember,
              }),
              right: setAttr(
                ctx,
                elem,
                key,
                b.AssignmentExpression({
                  operator: "=",
                  left: propMember,
                  right: varIdent,
                }),
                {
                  isSVG,
                  isCE,
                  tagName,
                  dynamic: true,
                  prevId: prev,
                },
              ),
            }),
          }),
        );
      }
    },
  );

  return [
    b.ExpressionStatement({
      expression: b.CallExpression({
        callee: effectWrapperId,
        arguments: [
          b.ArrowFunctionExpression({
            params: [prevId],
            body: b.BlockStatement({
              body: [
                b.VariableDeclaration({ kind: "var", declarations }),
                ...statements,
                b.ReturnStatement({ argument: prevId }),
              ],
            }),
          }),
          b.ObjectExpression({
            properties: properties.map((id) =>
              b.Property({
                key: id,
                value: b.Identifier({ name: "undefined" }),
                computed: false,
                shorthand: false,
              }),
            ),
          }),
        ],
        optional: false,
      }),
    }),
  ];
}
