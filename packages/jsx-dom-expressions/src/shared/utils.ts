import { is, b } from "yuku-ast";

import type {
  TransformContext,
  PluginConfig,
  Expression,
  Node,
  Identifier,
  ConditionalExpression,
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  JSXElement,
} from "../types";

export const reservedNameSpaces = new Set([
  "class",
  "on",
  "oncapture",
  "style",
  "use",
  "prop",
  "attr",
  "bool",
]);

export const nonSpreadNameSpaces = new Set([
  "class",
  "style",
  "use",
  "prop",
  "attr",
  "bool",
]);

export function getConfig(ctx: TransformContext): PluginConfig {
  return ctx.config;
}

export function getRendererConfig(
  ctx: TransformContext,
  renderer: string,
): PluginConfig {
  return ctx.config?.renderers?.find((r) => r.name === renderer) ?? ctx.config;
}

export function registerImportMethod(
  ctx: TransformContext,
  name: string,
  moduleName?: string,
): Identifier {
  moduleName = moduleName || ctx.config.moduleName;
  const key = `${moduleName}:${name}`;
  if (!ctx.imports.has(key)) {
    const localName = `_$${name}`;
    ctx.imports.set(key, { localName, importedName: name, moduleName });
  }
  return b.Identifier({ name: ctx.imports.get(key)!.localName });
}

function jsxElementNameToString(
  node: JSXIdentifier | JSXMemberExpression | JSXNamespacedName,
): string {
  if (is.JSXMemberExpression(node)) {
    return `${jsxElementNameToString(node.object)}.${node.property.name}`;
  }
  if (is.JSXIdentifier(node)) {
    return node.name;
  }
  if (is.JSXNamespacedName(node)) {
    return `${node.namespace.name}:${node.name.name}`;
  }
  return "";
}

export function tagNameToIdentifier(name: string): Expression {
  const parts = name.split(".");
  if (parts.length === 1) return b.Identifier({ name });
  let part: string | undefined;
  let base: Expression = b.Identifier({ name: parts.shift()! });
  while ((part = parts.shift())) {
    base = b.MemberExpression({
      object: base,
      property: b.Identifier({ name: part }),
      computed: false,
      optional: false,
    });
  }
  return base;
}

export function getTagName(tag: JSXElement): string {
  const jsxName = tag.openingElement.name;
  return jsxElementNameToString(jsxName);
}

export function isComponent(tagName: string): boolean {
  return (
    (tagName[0] && tagName[0].toLowerCase() !== tagName[0]) ||
    tagName.includes(".") ||
    /[^a-zA-Z]/.test(tagName[0])
  );
}

export function hasStaticMarker(object: any, ctx: TransformContext): boolean {
  if (!object) return false;
  if (
    object.leadingComments &&
    object.leadingComments[0] &&
    object.leadingComments[0].value.trim() === getConfig(ctx).staticMarker
  )
    return true;
  if (object.expression) return hasStaticMarker(object.expression, ctx);
  return false;
}

export function isDynamic(
  ctx: TransformContext,
  node: Node,
  opts: {
    checkMember?: boolean;
    checkTags?: boolean;
    checkCallExpressions?: boolean;
    native?: boolean;
  } = {},
): boolean {
  const config = getConfig(ctx);
  const {
    checkMember = false,
    checkTags = false,
    checkCallExpressions = true,
    native,
  } = opts;
  let effectiveCheckMember = checkMember;
  let effectiveCheckCallExpressions = checkCallExpressions;

  if (config.generate === "ssr" && native) {
    effectiveCheckMember = false;
    effectiveCheckCallExpressions = false;
  }

  if (is.Function(node)) return false;

  if (
    node.leadingComments &&
    node.leadingComments[0] &&
    node.leadingComments[0].value.trim() === config.staticMarker
  ) {
    return false;
  }

  if (
    effectiveCheckCallExpressions &&
    (is.CallExpression(node) || is.TaggedTemplateExpression(node))
  ) {
    return true;
  }

  if (effectiveCheckMember && is.StaticMemberExpression(node)) {
    if (is.Identifier(node.object)) {
      return true;
    }
    return true;
  }

  if (
    effectiveCheckMember &&
    (is.SpreadElement(node) ||
      (is.BinaryExpression(node) && node.operator === "in"))
  ) {
    return true;
  }

  if (
    checkTags &&
    (is.JSXElement(node) || (is.JSXFragment(node) && node.children.length))
  ) {
    return true;
  }

  let dynamic = false;

  function walkAndCheck(n: Node): void {
    if (dynamic) return;
    if (is.Function(n)) {
      if (is.Property(n) && n.computed) {
        walkAndCheck(n.key);
      }
      return;
    }
    if (is.CallExpression(n) || is.TaggedTemplateExpression(n)) {
      if (effectiveCheckCallExpressions) {
        dynamic = true;
      }
      return;
    }
    if (is.ConditionalExpression(n)) {
      walkAndCheck(n.test);
      walkAndCheck(n.consequent);
      walkAndCheck(n.alternate);
      return;
    }
    if (is.LogicalExpression(n)) {
      walkAndCheck(n.left);
      walkAndCheck(n.right);
      return;
    }
    if (is.StaticMemberExpression(n) || is.ComputedMemberExpression(n)) {
      if (effectiveCheckMember) {
        dynamic = true;
      }
      return;
    }
    if (is.SpreadElement(n)) {
      if (effectiveCheckMember) {
        dynamic = true;
      }
      return;
    }
    if (is.BinaryExpression(n) && n.operator === "in") {
      if (effectiveCheckMember) {
        dynamic = true;
      }
      return;
    }
    if (is.JSXElement(n)) {
      if (checkTags) {
        dynamic = true;
      }
      return;
    }
    if (is.JSXFragment(n)) {
      if (checkTags && n.children.length) {
        dynamic = true;
      }
      return;
    }
  }

  walkAndCheck(node);
  return dynamic;
}

export function getStaticExpression(
  ctx: TransformContext,
  node: Node,
  parent: Node | null,
): string | number | false {
  if (
    is.JSXExpressionContainer(node) &&
    parent &&
    is.JSXElement(parent) &&
    !isComponent(getTagName(parent))
  ) {
    const expr = node.expression;
    if (is.SequenceExpression(expr)) return false;
    if (is.StringLiteral(expr)) return expr.value;
    if (is.NumericLiteral(expr)) return expr.value;
    if (is.Identifier(expr) && expr.name === "undefined") return false;
    return false;
  }
  return false;
}

export function filterChildren(children: Node[]): Node[] {
  return children.filter((child) => {
    if (
      is.JSXExpressionContainer(child) &&
      is.JSXEmptyExpression(child.expression)
    ) {
      return false;
    }
    if (is.JSXText(child)) {
      return !/^[\r\n]\s*$/.test(child.raw);
    }
    return true;
  });
}

export function checkLength(children: Node[]): boolean {
  let i = 0;
  children.forEach((child) => {
    if (
      is.JSXExpressionContainer(child) &&
      is.JSXEmptyExpression(child.expression)
    ) {
      return;
    }
    if (is.JSXText(child)) {
      const raw = child.raw;
      if (/^\s*$/.test(raw) || /^ *$/.test(raw)) return;
    }
    i++;
  });
  return i > 1;
}

export function trimWhitespace(text: string): string {
  text = text.replace(/\r/g, "");
  if (/\n/g.test(text)) {
    text = text
      .split("\n")
      .map((t, i) => (i ? t.replace(/^\s*/g, "") : t))
      .filter((s) => !/^\s*$/.test(s))
      .join(" ");
  }
  return text.replace(/\s+/g, " ");
}

export function toEventName(name: string): string {
  return name.slice(2).toLowerCase();
}

export function toAttributeName(name: string): string {
  return name.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
}

export function toPropertyName(name: string): string {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}

export function wrappedByText(list: any[], startIndex: number): boolean {
  let index = startIndex,
    wrapped: boolean | undefined;
  while (--index >= 0) {
    const node = list[index];
    if (!node) continue;
    if (node.text) {
      wrapped = true;
      break;
    }
    if (node.id) return false;
  }
  if (!wrapped) return false;
  index = startIndex;
  while (++index < list.length) {
    const node = list[index];
    if (!node) continue;
    if (node.text) return true;
    if (node.id) return false;
  }
  return false;
}

export function transformCondition(
  ctx: TransformContext,
  expr: Expression,
  inline: boolean,
): Expression {
  const config = getConfig(ctx);
  const memo = registerImportMethod(ctx, config.memoWrapper);

  let dTest = false;
  let cond: Expression | undefined;
  let id: Expression | undefined;

  if (is.ConditionalExpression(expr)) {
    const ce = expr;
    if (
      isDynamic(ctx, ce.consequent, { checkTags: true, checkMember: true }) ||
      isDynamic(ctx, ce.alternate, { checkTags: true, checkMember: true })
    ) {
      dTest = isDynamic(ctx, ce.test, { checkMember: true });
      if (dTest) {
        cond = ce.test;
        if (!is.BinaryExpression(cond)) {
          cond = b.UnaryExpression({
            operator: "!",
            argument: b.UnaryExpression({
              operator: "!",
              argument: cond,
              prefix: true,
            }),
            prefix: true,
          });
        }
        if (inline) {
          id = b.CallExpression({
            callee: memo,
            arguments: [b.ArrowFunctionExpression({ params: [], body: cond })],
            optional: false,
          });
        } else {
          id = b.Identifier({ name: generateUid(ctx, "_c$") });
        }
        ce.test = b.CallExpression({
          callee: id!,
          arguments: [],
          optional: false,
        });
        if (
          is.ConditionalExpression(ce.consequent) ||
          is.LogicalExpression(ce.consequent)
        ) {
          ce.consequent = transformCondition(ctx, ce.consequent, true);
        }
        if (
          is.ConditionalExpression(ce.alternate) ||
          is.LogicalExpression(ce.alternate)
        ) {
          ce.alternate = transformCondition(ctx, ce.alternate, true);
        }
      }
    }
  } else if (is.LogicalExpression(expr)) {
    const le = expr;
    let operator = le.operator;
    let leftNode: Expression = le.left;

    // handle top-level or, ie cond && <A/> || <B/>
    while (operator !== "&&" && is.LogicalExpression(leftNode)) {
      const inner = leftNode;
      operator = inner.operator;
      leftNode = inner.left;
    }

    if (operator === "&&" && is.LogicalExpression(le)) {
      if (isDynamic(ctx, le.right, { checkTags: true, checkMember: true })) {
        dTest = isDynamic(ctx, leftNode, { checkMember: true });
      }
    }

    if (dTest) {
      cond = leftNode;
      if (!is.BinaryExpression(cond)) {
        cond = b.UnaryExpression({
          operator: "!",
          argument: b.UnaryExpression({
            operator: "!",
            argument: cond,
            prefix: true,
          }),
          prefix: true,
        });
      }
      if (inline) {
        id = b.CallExpression({
          callee: memo,
          arguments: [b.ArrowFunctionExpression({ params: [], body: cond })],
          optional: false,
        });
      } else {
        id = b.Identifier({ name: generateUid(ctx, "_c$") });
      }
      if (is.LogicalExpression(le)) {
        le.left = b.CallExpression({
          callee: id!,
          arguments: [],
          optional: false,
        });
      }
    }
  }

  if (dTest && !inline) {
    const decl = b.VariableDeclaration({
      kind: "var",
      declarations: [
        b.VariableDeclarator({
          id: id,
          init: config.memoWrapper
            ? b.CallExpression({
                callee: memo,
                arguments: [
                  b.ArrowFunctionExpression({ params: [], body: cond }),
                ],
                optional: false,
              })
            : b.ArrowFunctionExpression({ params: [], body: cond }),
        }),
      ],
    });
    const arrow = b.ArrowFunctionExpression({ params: [], body: expr });
    return b.CallExpression({
      callee: b.ArrowFunctionExpression({
        params: [],
        body: b.BlockStatement({
          body: [decl, b.ReturnStatement({ argument: arrow })],
        }),
      }),
      arguments: [],
      optional: false,
    });
  }
  return b.ArrowFunctionExpression({ params: [], body: expr });
}

export function escapeHTML(s: any, attr?: boolean): any {
  if (typeof s !== "string") return s;
  const delim = attr ? '"' : "<";
  const escDelim = attr ? "&quot;" : "&lt;";
  let iDelim = s.indexOf(delim);
  let iAmp = s.indexOf("&");

  if (iDelim < 0 && iAmp < 0) return s;

  let left = 0,
    out = "";

  while (iDelim >= 0 && iAmp >= 0) {
    if (iDelim < iAmp) {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } else {
      if (left < iAmp) out += s.substring(left, iAmp);
      out += "&amp;";
      left = iAmp + 1;
      iAmp = s.indexOf("&", left);
    }
  }

  if (iDelim >= 0) {
    do {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } while (iDelim >= 0);
  } else {
    while (iAmp >= 0) {
      if (left < iAmp) out += s.substring(left, iAmp);
      out += "&amp;";
      left = iAmp + 1;
      iAmp = s.indexOf("&", left);
    }
  }

  return left < s.length ? out + s.substring(left) : out;
}

export function convertJSXIdentifier(
  node: JSXIdentifier | JSXMemberExpression | JSXNamespacedName,
): Expression {
  if (is.JSXIdentifier(node)) {
    const name = node.name;
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
      return b.Identifier({ name });
    } else {
      return b.Literal({ value: name });
    }
  } else if (is.JSXMemberExpression(node)) {
    const me = node;
    return b.MemberExpression({
      object: convertJSXIdentifier(me.object),
      property: convertJSXIdentifier(me.property),
      computed: false,
      optional: false,
    });
  } else if (is.JSXNamespacedName(node)) {
    const ns = node;
    return b.Literal({ value: `${ns.namespace.name}:${ns.name.name}` });
  }
  return node;
}

export function canNativeSpread(
  key: string,
  opts?: { checkNameSpaces?: boolean },
): boolean {
  if (
    opts?.checkNameSpaces &&
    key.includes(":") &&
    nonSpreadNameSpaces.has(key.split(":")[0])
  )
    return false;
  if (key === "ref") return false;
  return true;
}

const chars = "etaoinshrdlucwmfygpbTAOISWCBvkxjqzPHFMDRELNGUKVYJQZX_$";
const base = chars.length;

export function getNumberedId(num: number): string {
  let out = "";
  do {
    const digit = num % base;
    num = Math.floor(num / base);
    out = chars[digit] + out;
  } while (num !== 0);
  return out;
}

export function escapeStringForTemplate(str: string): string {
  return str.replace(/[{\\`\n\t\b\f\v\r\u2028\u2029]/g, (ch) =>
    templateEscapes.get(ch)!,
  );
}

const templateEscapes = new Map([
  ["{", "\\{"],
  ["`", "\\`"],
  ["\\", "\\\\"],
  ["\n", "\\n"],
  ["\t", "\\t"],
  ["\b", "\\b"],
  ["\f", "\\f"],
  ["\v", "\\v"],
  ["\r", "\\r"],
  ["\u2028", "\\u2028"],
  ["\u2029", "\\u2029"],
]);

export function generateUid(ctx: TransformContext, prefix: string): string {
  const count = (ctx.uidCounters.get(prefix) ?? 0) + 1;
  ctx.uidCounters.set(prefix, count);
  return count === 1 ? `_${prefix}` : `_${prefix}$${count}`;
}

export function inferLang(filename?: string): "js" | "jsx" | "ts" | "tsx" {
  if (!filename) return "jsx";
  if (filename.endsWith(".tsx")) return "tsx";
  if (filename.endsWith(".ts")) return "ts";
  if (filename.endsWith(".jsx")) return "jsx";
  return "js";
}

export function createTransformContext(
  config: PluginConfig,
  filename?: string,
  comments: any[] = [],
): TransformContext {
  return {
    config,
    out: b.Program({ body: [], sourceType: "module", hashbang: null }),
    imports: new Map(),
    templates: [],
    events: new Set(),
    uidCounters: new Map(),
    filename,
    comments,
  };
}
