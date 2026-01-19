import type { File, NodePath, Scope, Visitor } from "@babel/core";
import { types as t, template } from "@babel/core";
import { visitors } from "@babel/traverse";

const findBareSupers = visitors.environmentVisitor<
  NodePath<t.CallExpression>[]
>({
  Super(path) {
    const { node, parentPath } = path;
    if (parentPath.isCallExpression({ callee: node })) {
      this.push(parentPath);
    }
  },
});

const referenceVisitor: Visitor<{ scope: Scope }> = {
  "TSTypeAnnotation|TypeAnnotation"(
    path: NodePath<t.TSTypeAnnotation | t.TypeAnnotation>,
  ) {
    path.skip();
  },

  ReferencedIdentifier(path: NodePath<t.Identifier>, { scope }) {
    if (scope.hasOwnBinding(path.node.name)) {
      scope.rename(path.node.name);
      path.skip();
    }
  },
};

type HandleClassTDZState = {
  classBinding: Scope.Binding;
  file: File;
};

function handleClassTDZ(
  path: NodePath<t.Identifier>,
  state: HandleClassTDZState,
) {
  if (
    state.classBinding &&
    state.classBinding === path.scope.getBinding(path.node.name)
  ) {
    const classNameTDZError = state.file.addHelper("classNameTDZError");
    const throwNode = t.callExpression(classNameTDZError, [
      t.stringLiteral(path.node.name),
    ]);

    path.replaceWith(t.sequenceExpression([throwNode, path.node]));
    path.skip();
  }
}

interface RenamerState {
  scope: Scope;
}

export function injectInitialization(
  path: NodePath<t.Class>,
  constructor: NodePath<t.ClassMethod> | undefined,
  nodes: t.ExpressionStatement[],
  renamer?: (visitor: Visitor<RenamerState>, state: RenamerState) => void,
  lastReturnsThis?: boolean,
) {
  if (!nodes.length) return;

  const isDerived = !!path.node.superClass;

  if (!constructor) {
    const newConstructor = t.classMethod(
      "constructor",
      t.identifier("constructor"),
      [],
      t.blockStatement([]),
    );

    if (isDerived) {
      newConstructor.params = [t.restElement(t.identifier("args"))];
      newConstructor.body.body.push(template.statement.ast`super(...args)`);
    }

    [constructor] = path
      .get("body")
      .unshiftContainer("body", newConstructor) as NodePath<t.ClassMethod>[];
  }

  if (renamer) {
    renamer(referenceVisitor, { scope: constructor.scope });
  }

  if (isDerived) {
    const bareSupers: NodePath<t.CallExpression>[] = [];
    constructor.traverse(findBareSupers, bareSupers);
    let isFirst = true;
    for (const bareSuper of bareSupers) {
      if (isFirst) {
        isFirst = false;
      } else {
        nodes = nodes.map((n) => t.cloneNode(n));
      }
      if (!bareSuper.parentPath.isExpressionStatement()) {
        const allNodes: t.Expression[] = [
          bareSuper.node,
          ...nodes.map((n) => t.toExpression(n)),
        ];
        if (!lastReturnsThis) allNodes.push(t.thisExpression());
        bareSuper.replaceWith(t.sequenceExpression(allNodes));
      } else {
        bareSuper.insertAfter(nodes);
      }
    }
  } else {
    constructor.get("body").unshiftContainer("body", nodes);
  }
}
