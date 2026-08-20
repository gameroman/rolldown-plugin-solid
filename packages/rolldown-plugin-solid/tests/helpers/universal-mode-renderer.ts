import { createRenderer } from "solid-js/universal";

export const {
  createComponent,
  createElement,
  createTextNode,
  effect,
  insert,
  insertNode,
  memo,
  mergeProps,
  render,
  setProp,
  spread,
  use,
} = createRenderer({
  createElement() {},
  createTextNode() {},
  getFirstChild() {},
  getNextSibling() {},
  getParentNode() {},
  insertNode() {},
  isTextNode() {
    return true;
  },
  removeNode() {},
  replaceText() {},
  setProperty() {},
});
