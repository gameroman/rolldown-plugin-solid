import type { File, NodePath, Scope, Visitor } from "@babel/core";
import { types as t, template } from "@babel/core";
import type { HandlerState } from "@babel/helper-member-expression-to-functions";
import { skipTransparentExprWrapperNodes } from "@babel/helper-skip-transparent-expression-wrappers";
import { visitors } from "@babel/traverse";

interface PrivateNameMetadata {
  id: t.Identifier;
  static: boolean;
  method: boolean;
  getId?: t.Identifier;
  setId?: t.Identifier;
  methodId?: t.Identifier;
  initAdded?: boolean;
  getterDeclared?: boolean;
  setterDeclared?: boolean;
}

type PrivateNamesMapGeneric<V> = Map<string, V>;

type PrivateNamesMap = PrivateNamesMapGeneric<PrivateNameMetadata>;

if (!undefined) {
  // eslint-disable-next-line no-var
  var newHelpers = (file: File) => {
    if (!process.env.IS_PUBLISH) {
      const { comments } = file.ast;
      // This is needed for the test in
      // babel-plugin-transform-class-properties/test/fixtures/regression/old-helpers
      if (
        comments?.some((c) => c.value.includes("@force-old-private-helpers"))
      ) {
        return false;
      }
    }
    return file.availableHelper("classPrivateFieldGet2");
  };
}

if (!undefined) {
  // eslint-disable-next-line no-var
  var buildPrivateStaticFieldInitSpecOld = function (
    prop: NodePath<t.ClassPrivateProperty>,
    privateNamesMap: PrivateNamesMap,
  ) {
    const privateName = privateNamesMap.get(prop.node.key.id.name);
    const { id, getId, setId, initAdded } = privateName;
    const isGetterOrSetter = getId || setId;

    if (!prop.isProperty() && (initAdded || !isGetterOrSetter)) return;

    if (isGetterOrSetter) {
      privateNamesMap.set(prop.node.key.id.name, {
        ...privateName,
        initAdded: true,
      });

      return inheritPropComments(
        template.statement.ast`
          var ${t.cloneNode(id)} = {
            // configurable is false by default
            // enumerable is false by default
            // writable is false by default
            get: ${getId ? getId.name : prop.scope.buildUndefinedNode()},
            set: ${setId ? setId.name : prop.scope.buildUndefinedNode()}
          }
        `,
        prop,
      );
    }

    const value = prop.node.value || prop.scope.buildUndefinedNode();
    return inheritPropComments(
      template.statement.ast`
        var ${t.cloneNode(id)} = {
          // configurable is false by default
          // enumerable is false by default
          writable: true,
          value: ${value}
        };
      `,
      prop,
    );
  };
}

type ReplaceThisState = {
  thisRef: t.Identifier;
  needsClassRef?: boolean;
  innerBinding?: t.Identifier | null;
  argumentsPath?: NodePath<t.Identifier>[];
};

type PropNode =
  | t.ClassProperty
  | t.ClassPrivateMethod
  | t.ClassPrivateProperty
  | t.StaticBlock;
type PropPath = NodePath<PropNode>;

/**
 * Inherit comments from class members. This is a reduced version of
 * t.inheritsComments: the trailing comments are not inherited because
 * for most class members except the last one, their trailing comments are
 * the next sibling's leading comments.
 *
 * @template T transformed class member type
 * @param {T} node transformed class member
 * @param {PropPath} prop class member
 * @returns transformed class member type with comments inherited
 */
function inheritPropComments<T extends t.Node>(node: T, prop: PropPath) {
  t.inheritLeadingComments(node, prop.node);
  t.inheritInnerComments(node, prop.node);
  return node;
}
