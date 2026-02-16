import { declare } from "@babel/helper-plugin-utils";

const removePlugin = function (plugins: any[], name: string) {
  const indices: number[] = [];
  plugins.forEach((plugin, i) => {
    const n = Array.isArray(plugin) ? plugin[0] : plugin;

    if (n === name) {
      indices.unshift(i);
    }
  });

  for (const i of indices) {
    plugins.splice(i, 1);
  }
};

export interface Options {
  disallowAmbiguousJSXLike?: boolean;
  dts?: boolean;
  isTSX?: boolean;
}

const syntaxTypeScript = declare((api, opts: Options) => {
  const { disallowAmbiguousJSXLike, dts } = opts;

  // eslint-disable-next-line no-var
  var { isTSX } = opts;

  return {
    name: "syntax-typescript",

    manipulateOptions(opts, parserOpts) {
      const { plugins } = parserOpts;
      // If the Flow syntax plugin already ran, remove it since Typescript
      // takes priority.
      removePlugin(plugins, "flow");

      // If the JSX syntax plugin already ran, remove it because JSX handling
      // in TS depends on the extensions, and is purely dependent on 'isTSX'.
      removePlugin(plugins, "jsx");

      if (isTSX) {
        plugins.push("jsx");
      }

      parserOpts.plugins.push([
        "typescript",
        { disallowAmbiguousJSXLike, dts },
      ]);
    },
  };
});
export default syntaxTypeScript;
