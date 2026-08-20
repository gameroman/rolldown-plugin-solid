import { parse } from "node:path";
import { transformAsync } from "@babel/core";
import type { RolldownPlugin } from "rolldown";
import jsxTransform from "./babel-plugin-jsx-dom-expressions";
import typescriptPreset, {
  type PresetTypescriptOptions,
} from "./preset-typescript";

function solidPreset(_context: unknown, options = {}) {
  const plugins = [
    [
      jsxTransform,
      Object.assign(
        {
          moduleName: "solid-js/web",
          builtIns: [
            "For",
            "Show",
            "Switch",
            "Match",
            "Suspense",
            "SuspenseList",
            "Portal",
            "Index",
            "Dynamic",
            "ErrorBoundary",
          ],
          contextToCustomElements: true,
          wrapConditionals: true,
          generate: "dom",
        },
        options,
      ),
    ],
  ];

  return { plugins };
}

/** Configuration options */
export interface Options {
  /** The options to use for @babel/preset-typescript @default {} */
  typescript?: PresetTypescriptOptions;

  /**
   * Pass any additional [babel-plugin-jsx-dom-expressions](https://github.com/ryansolid/dom-expressions/tree/main/packages/babel-plugin-jsx-dom-expressions#plugin-options).
   * They will be merged with the defaults sets by [babel-preset-solid](https://github.com/solidjs/solid/blob/main/packages/babel-preset-solid/index.js#L8-L25).
   *
   * @default {}
   */
  solid?: {
    /**
     * The name of the runtime module to import the methods from.
     *
     * @default "solid-js/web"
     */
    moduleName?: string;

    /**
     * The output mode of the compiler.
     * Can be:
     * - "dom" is standard output
     * - "ssr" is for server side rendering of strings.
     * - "universal" is for using custom renderers from solid-js/universal
     *
     * @default "dom"
     */
    generate?: "ssr" | "dom" | "universal";

    /**
     * Indicate whether the output should contain hydratable markers.
     *
     * @default false
     */
    hydratable?: boolean;

    /**
     * Boolean to indicate whether to enable automatic event delegation on camelCase.
     *
     * @default true
     */
    delegateEvents?: boolean;

    /**
     * Boolean indicates whether smart conditional detection should be used.
     * This optimizes simple boolean expressions and ternaries in JSX.
     *
     * @default true
     */
    wrapConditionals?: boolean;

    /**
     * Boolean indicates whether to set current render context on Custom Elements and slots.
     * Useful for seemless Context API with Web Components.
     *
     * @default true
     */
    contextToCustomElements?: boolean;

    /**
     * Array of Component exports from module, that aren't included by default with the library.
     * This plugin will automatically import them if it comes across them in the JSX.
     *
     * @default ["For","Show","Switch","Match","Suspense","SuspenseList","Portal","Index","Dynamic","ErrorBoundary"]
     */
    builtIns?: string[];
  };
}

const rolldownPluginSolid = (options?: Options): RolldownPlugin => {
  // Validate universal mode configuration
  if (options?.solid?.generate === "universal") {
    if (!options?.solid?.moduleName) {
      throw new Error(
        `Universal mode requires a 'moduleName' option pointing to your custom renderer.\n\n` +
          `Please provide a moduleName that exports the required universal renderer functions:\n` +
          `- createElement\n` +
          `- createTextNode\n` +
          `- insertNode\n` +
          `- setProp\n` +
          `- insert\n` +
          `- spread\n` +
          `- mergeProps\n` +
          `- effect\n` +
          `- memo\n` +
          `- use\n\n` +
          `Example configuration:\n` +
          `{ solid: { generate: "universal", moduleName: "my-custom-renderer" } }\n\n` +
          `Your custom renderer should be created using 'createRenderer' from 'solid-js/universal'.`,
      );
    }
  }

  return {
    name: "rolldown-plugin-solid",
    transform: {
      filter: {
        id: /\.(t|j)sx$/,
      },
      async handler(code: string, id: string) {
        const { name, ext } = parse(id);
        const filename = name + ext;

        const result = await transformAsync(code, {
          presets: [
            [solidPreset, options?.solid ?? {}],
            [typescriptPreset, options?.typescript ?? {}],
          ],
          filename,
          sourceMaps: "inline",
        });

        if (result?.code === undefined || result.code === null) {
          throw new Error("No result was provided from Babel");
        }

        return result.code;
      },
    },
  };
};

export default rolldownPluginSolid;
