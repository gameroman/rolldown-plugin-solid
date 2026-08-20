import type { Node, Program, Expression, JSXElement, JSXFragment, JSXAttribute, JSXSpreadAttribute, JSXIdentifier, JSXMemberExpression, JSXNamespacedName, JSXOpeningElement, JSXClosingElement, JSXChild, JSXText, JSXExpressionContainer, JSXSpreadChild, JSXEmptyExpression, CallExpression, ArrowFunctionExpression, BlockStatement, VariableDeclaration, VariableDeclarator, ExpressionStatement, ReturnStatement, ObjectExpression, ObjectProperty, SpreadElement, TemplateLiteral, TemplateElement, Identifier, StringLiteral, BooleanLiteral, NumericLiteral, AssignmentExpression, ConditionalExpression, LogicalExpression, BinaryExpression, UnaryExpression, MemberExpression, ArrayExpression, ThisExpression, Function, Statement, ImportDeclaration, ImportSpecifier, ImportDefaultSpecifier, ImportNamespaceSpecifier } from "yuku-parser";

export type {
  Node, Program, Expression, JSXElement, JSXFragment, JSXAttribute, JSXSpreadAttribute,
  JSXIdentifier, JSXMemberExpression, JSXNamespacedName, JSXOpeningElement, JSXClosingElement,
  JSXChild, JSXText, JSXExpressionContainer, JSXSpreadChild, JSXEmptyExpression,
  CallExpression, ArrowFunctionExpression, BlockStatement, VariableDeclaration, VariableDeclarator,
  ExpressionStatement, ReturnStatement, ObjectExpression, ObjectProperty, SpreadElement,
  TemplateLiteral, TemplateElement, Identifier, StringLiteral, BooleanLiteral, NumericLiteral,
  AssignmentExpression, ConditionalExpression, LogicalExpression, BinaryExpression, UnaryExpression,
  MemberExpression, ArrayExpression, ThisExpression, Function, Statement, ImportDeclaration,
  ImportSpecifier, ImportDefaultSpecifier, ImportNamespaceSpecifier
};

export type SourceLang = "js" | "jsx" | "ts" | "tsx" | "dts";

export interface PluginConfig {
  moduleName: string;
  generate: "dom" | "ssr" | "universal";
  hydratable: boolean;
  delegateEvents: boolean;
  delegatedEvents: string[];
  builtIns: string[];
  requireImportSource: string | false;
  wrapConditionals: boolean;
  omitNestedClosingTags: boolean;
  omitLastClosingTag: boolean;
  omitQuotes: boolean;
  omitAttributeSpacing: boolean;
  contextToCustomElements: boolean;
  omitServerOnlyTemplates: boolean;
  staticMarker: string;
  effectWrapper: string;
  memoWrapper: string;
  validate: boolean;
  inlineStyles: boolean;
  renderers?: RendererConfig[];
}

export interface RendererConfig {
  name: string;
  moduleName: string;
  elements: string[];
}

export interface ImportDescriptor {
  localName: string;
  importedName: string;
  moduleName: string;
}

export interface TemplateDescriptor {
  id: string;
  template: string;
  templateWithClosingTags?: string;
  isSVG: boolean;
  isCE: boolean;
  isImportNode: boolean;
  renderer: "dom" | "ssr";
}

export interface DynamicBinding {
  elem: Expression;
  key: string;
  value: Expression;
  isSVG: boolean;
  isCE: boolean;
  tagName: string;
}

export interface TransformContext {
  config: PluginConfig;
  out: Program;
  imports: Map<string, ImportDescriptor>;
  templates: TemplateDescriptor[];
  events: Set<string>;
  uidCounters: Map<string, number>;
  filename?: string;
  comments: any[];
}

export interface TransformResult {
  id: Expression | null;
  template: string | string[];
  templateWithClosingTags?: string;
  declarations: VariableDeclarator[];
  exprs: Statement[];
  dynamics: DynamicBinding[];
  postExprs: Statement[];
  isSVG?: boolean;
  hasCustomElement?: boolean;
  isImportNode?: boolean;
  tagName?: string;
  renderer?: string;
  skipTemplate?: boolean;
  text?: boolean;
  dynamic?: boolean;
  component?: boolean;
  hasHydratableEvent?: boolean;
  toBeClosed?: Set<string>;
  decl?: VariableDeclaration;
  wontEscape?: boolean;
  templateValues?: Expression[];
  spreadElement?: boolean;
}

export interface WrappingInfo {
  topLevel?: boolean;
  lastElement?: boolean;
  skipId?: boolean;
  componentChild?: boolean;
  fragmentChild?: boolean;
  toBeClosed?: Set<string>;
  doNotEscape?: boolean;
}
