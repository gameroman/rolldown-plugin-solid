import { is as t, b } from "yuku-ast";
import type { TransformContext, TransformResult, Expression, Statement, VariableDeclarator, Identifier } from "../types";
import { getConfig, getNumberedId, registerImportMethod, generateUid } from "../shared/utils";
import { setAttr } from "./element";

export function createTemplate(ctx: TransformContext, result: TransformResult, wrap: boolean): Expression {
  const config = getConfig(ctx);
  if (result.id) {
    result.decl = b.VariableDeclaration({
      kind: "var",
      declarations: result.declarations
    });
    if (
      !(result.exprs.length || result.dynamics.length || result.postExprs.length) &&
      result.decl!.declarations.length === 1
    ) {
      return (result.decl!.declarations[0] ).init;
    } else {
      return b.CallExpression({
        callee: b.ArrowFunctionExpression({
          params: [],
          body: b.BlockStatement({
            body: [
              result.decl!,
              ...result.exprs.concat(
                wrapDynamics(ctx, result) || [],
                result.postExprs || []
              ),
              b.ReturnStatement({ argument: result.id })
            ]
          })
        }),
        arguments: [],
        optional: false
      });
    }
  }
  if (wrap && result.dynamic && config.memoWrapper) {
    return b.CallExpression({
      callee: registerImportMethod(ctx, config.memoWrapper),
      arguments: [result.exprs[0] ? (result.exprs[0] ).expression : b.Identifier({ name: "undefined" })],
      optional: false
    });
  }
  return result.exprs[0] ? (result.exprs[0] ).expression : b.Identifier({ name: "undefined" });
}

function wrapDynamics(ctx: TransformContext, result: TransformResult): Statement | undefined {
  if (!result.dynamics.length) return undefined;
  const config = getConfig(ctx);

  const effectWrapperId = registerImportMethod(ctx, config.effectWrapper);

  if (result.dynamics.length === 1) {
    const prevValue = b.Identifier({ name: "_$p" });

    return b.ExpressionStatement({
      expression: b.CallExpression({
        callee: effectWrapperId,
        arguments: [
          b.ArrowFunctionExpression({
            params: [prevValue],
            body: setAttr(ctx, result.dynamics[0].elem, result.dynamics[0].key, result.dynamics[0].value, {
              dynamic: true,
              prevId: prevValue
            })
          })
        ],
        optional: false
      })
    });
  }

  const prevId = b.Identifier({ name: "_p$" });
  const declarations: VariableDeclarator[] = [];
  const statements: Statement[] = [];
  const properties: Identifier[] = [];

  result.dynamics.forEach(({ elem, key, value }, index) => {
    const varIdent = b.Identifier({ name: generateUid(ctx, "v$") });
    const propIdent = b.Identifier({ name: getNumberedId(index) });
    const propMember = b.MemberExpression({
      object: prevId,
      property: propIdent,
      computed: true,
      optional: false
    });

    properties.push(propIdent);
    declarations.push(b.VariableDeclarator({ id: varIdent, init: value }));

    statements.push(
      b.ExpressionStatement({
        expression: b.LogicalExpression({
          operator: "&&",
          left: b.BinaryExpression({
            operator: "!==",
            left: varIdent,
            right: propMember,
            optional: false
          }),
          right: b.AssignmentExpression({
            operator: "=",
            left: propMember,
            right: setAttr(ctx, elem, key, varIdent, { dynamic: true, prevId: propMember })
          }),
          optional: false
        })
      })
    );
  });

  return b.ExpressionStatement({
    expression: b.CallExpression({
      callee: effectWrapperId,
      arguments: [
        b.ArrowFunctionExpression({
          params: [prevId],
          body: b.BlockStatement({
            body: [
              b.VariableDeclaration({ kind: "var", declarations }),
              ...statements,
              b.ReturnStatement({ argument: prevId })
            ]
          })
        }),
        b.ObjectExpression({
          properties: properties.map(id => b.Property({
            key: id,
            value: b.Identifier({ name: "undefined" }),
            kind: "init",
            method: false,
            shorthand: false,
            computed: false
          }))
        })
      ],
      optional: false
    })
  });
}
