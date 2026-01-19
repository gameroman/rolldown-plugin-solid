import { OptionValidator } from "@babel/helper-validator-option";

const v = new OptionValidator("@babel/preset-typescript");

export interface Options {
  ignoreExtensions?: boolean;
  allowDeclareFields?: boolean;
  allowNamespaces?: boolean;
  disallowAmbiguousJSXLike?: boolean;
  jsxPragma?: string;
  jsxPragmaFrag?: string;
  onlyRemoveTypeImports?: boolean;
  optimizeConstEnums?: boolean;
  rewriteImportExtensions?: boolean;

  // TODO: Remove in Babel 8
  allExtensions?: boolean;
  isTSX?: boolean;
}

export default function normalizeOptions(options: Options = {}) {
  let { allowNamespaces = true, jsxPragma, onlyRemoveTypeImports } = options;

  const TopLevelOptions: {
    [Key in keyof Omit<Options, "allowDeclareFields">]-?: Key;
  } = {
    ignoreExtensions: "ignoreExtensions",
    allowNamespaces: "allowNamespaces",
    disallowAmbiguousJSXLike: "disallowAmbiguousJSXLike",
    jsxPragma: "jsxPragma",
    jsxPragmaFrag: "jsxPragmaFrag",
    onlyRemoveTypeImports: "onlyRemoveTypeImports",
    optimizeConstEnums: "optimizeConstEnums",
    rewriteImportExtensions: "rewriteImportExtensions",

    // TODO: Remove in Babel 8
    allExtensions: "allExtensions",
    isTSX: "isTSX",
  };

  const jsxPragmaFrag = v.validateStringOption(
    TopLevelOptions.jsxPragmaFrag,
    options.jsxPragmaFrag,
    "React.Fragment",
  );

  // eslint-disable-next-line no-var
  var allExtensions = v.validateBooleanOption(
    TopLevelOptions.allExtensions,
    options.allExtensions,
    false,
  );

  // eslint-disable-next-line no-var
  var isTSX = v.validateBooleanOption(
    TopLevelOptions.isTSX,
    options.isTSX,
    false,
  );
  if (isTSX) {
    v.invariant(allExtensions, "isTSX:true requires allExtensions:true");
  }

  const ignoreExtensions = v.validateBooleanOption(
    TopLevelOptions.ignoreExtensions,
    options.ignoreExtensions,
    false,
  );

  const disallowAmbiguousJSXLike = v.validateBooleanOption(
    TopLevelOptions.disallowAmbiguousJSXLike,
    options.disallowAmbiguousJSXLike,
    false,
  );
  if (disallowAmbiguousJSXLike) {
    v.invariant(
      allExtensions,
      "disallowAmbiguousJSXLike:true requires allExtensions:true",
    );
  }

  const optimizeConstEnums = v.validateBooleanOption(
    TopLevelOptions.optimizeConstEnums,
    options.optimizeConstEnums,
    false,
  );

  const rewriteImportExtensions = v.validateBooleanOption(
    TopLevelOptions.rewriteImportExtensions,
    options.rewriteImportExtensions,
    false,
  );

  const normalized: Options = {
    ignoreExtensions,
    allowNamespaces,
    disallowAmbiguousJSXLike,
    jsxPragma,
    jsxPragmaFrag,
    onlyRemoveTypeImports,
    optimizeConstEnums,
    rewriteImportExtensions,
  };
  if (true) {
    normalized.allExtensions = allExtensions;
    normalized.isTSX = isTSX;
  }
  return normalized;
}
