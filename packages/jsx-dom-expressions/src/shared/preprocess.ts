import type { TransformContext } from "../types";

export default function preprocess(ctx: TransformContext, comments: any[]): boolean {
  const lib = ctx.config.requireImportSource;
  if (lib) {
    let process = false;
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      const pieces = comment.value.split("@jsxImportSource");
      if (pieces.length === 2 && pieces[1].trim() === lib) {
        process = true;
        break;
      }
    }
    if (!process) {
      return false;
    }
  }
  return true;
}
