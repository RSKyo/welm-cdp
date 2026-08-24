export * from "./is-base.js";

// HTML Element
export function isHtmlElement(value) {
  return value != null && value instanceof HTMLElement;
}

// Element Node
export function isElementNode(value) {
  return (
    value != null && value.nodeType === 1 && typeof value.nodeName === "string"
  );
}
