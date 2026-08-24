import * as is from "./is-web.js";
export * from "./is-web.js";
import { assertNonBlankString } from "./assert-base.js";
export * from "./assert-base.js";

// Assertions related to HTML elements
export function assertHtmlElement(value, fieldName = "value") {
  if (!is.isHtmlElement(value)) {
    throw new Error(`${fieldName} must be an HTML element`);
  }
}

// Assertions related to iframe and DOM element nodes
export function assertElementNode(value, fieldName = "value") {
  if (!is.isElementNode(value)) {
    throw new Error(`${fieldName} must be an element node`);
  }
}

// Assertions related to selectors and HTML elements
export function assertSelectorOrHtmlElement(value, fieldName = "value") {
  if (!is.isNonBlankString(value) && !is.isHtmlElement(value)) {
    throw new Error(
      `${fieldName} must be a non-blank selector string or an HTML element`,
    );
  }
}

// Assertions related to selectors and element nodes
export function assertSelectorOrElementNode(value, fieldName = "value") {
  if (!is.isNonBlankString(value) && !is.isElementNode(value)) {
    throw new Error(
      `${fieldName} must be a non-blank selector string or an element node`,
    );
  }
}

// Assertions related to element matching and containment
export function assertElementMatches(element, selector, fieldName = "element") {
  assertHtmlElement(element, fieldName);
  assertNonBlankString(selector, "selector");

  if (!element.matches(selector)) {
    throw new Error(`${fieldName} does not match the selector: ${selector}`);
  }
}

// Assertions related to element containment
export function assertElementContains(
  element,
  selector,
  fieldName = "element",
) {
  assertHtmlElement(element, fieldName);
  assertNonBlankString(selector, "selector");

  if (!element.querySelector(selector)) {
    throw new Error(
      `${fieldName} does not contain an element matching the selector: ${selector}`,
    );
  }
}
