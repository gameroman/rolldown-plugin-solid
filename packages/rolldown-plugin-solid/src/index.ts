import { parse } from "node:path";

import transform from "@sozig/jsx-dom-expressions";
import type { PluginConfig } from "@sozig/jsx-dom-expressions";
import type { RolldownPlugin } from "rolldown";

/** Configuration options */
export interface Options {
  /**
   * Pass any additional [babel-plugin-jsx-dom-expressions](https://github.com/ryansolid/dom-expressions/tree/main/packages/babel-plugin-jsx-dom-expressions#plugin-options).
   * They will be merged with the defaults sets by [babel-preset-solid](https://github.com/solidjs/solid/blob/main/packages/babel-preset-solid/index.js#L8-L25).
   *
   * @default {}
   */
  solid?: {
    moduleName?: string;
    generate?: "ssr" | "dom" | "universal";
    hydratable?: boolean;
    delegateEvents?: boolean;
    wrapConditionals?: boolean;
    contextToCustomElements?: boolean;
    builtIns?: string[];
  } & Partial<PluginConfig>;
}

const defaultOptions: Partial<PluginConfig> = {
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
};

const rolldownPluginSolid = (options?: Options): RolldownPlugin => {
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

        const result = transform(code, {
          ...defaultOptions,
          ...options?.solid,
          filename,
        });

        return result.code;
      },
    },
  };
};

export default rolldownPluginSolid;
