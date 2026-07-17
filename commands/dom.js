import { assertNonBlankString } from "../common/assert.js";
import {
  focus,
  scrollIntoView,
  hasElement,
  getElementsCount,
  getElementAttribute,
  getElementAttributes,
  getElementInnerText,
  getElementInnerHTML,
  getElementOuterHTML,
  getElementBox,
  getElementCenter,
  waitElementAppear,
  waitElementDisappear,
  waitElementVisible,
  waitElementEditable,
  waitElementClickable,
  waitElementTextIncludes,
  waitElementTextEquals,
  waitElementTextRegex,
  waitElementCountEquals,
  waitElementCountGreater,
  waitElementCountGreaterEquals,
  waitElementCountLess,
  waitElementCountLessEquals,
  waitElementCountNotEquals,
} from "../cdp/dom.js";

const CDP_OPTIONS = "--host --port";
const ELEMENT_OPTIONS = "--nth";
const SCROLL_OPTIONS = "--block --inline --behavior";
const POLL_OPTIONS = "--poll-timeout --poll-interval --match-times";

/**
 * DOM CLI command registry.
 *
 * dom focus
 * dom scroll
 * dom has
 * dom count
 * dom attribute
 * dom attributes
 * dom text
 * dom inner-html
 * dom outer-html
 * dom box
 * dom center
 *
 * dom wait-appear
 * dom wait-disappear
 * dom wait-visible
 * dom wait-editable
 * dom wait-clickable
 * dom wait-text-includes
 * dom wait-text-equals
 * dom wait-text-regex
 * dom wait-count-equals
 * dom wait-count-greater
 * dom wait-count-greater-equals
 * dom wait-count-less
 * dom wait-count-less-equals
 * dom wait-count-not-equals
 */
export const DOM_COMMANDS = {
  "focus": {
    handler: cmd_focus,
    usage: "dom focus <targetId> <selector> [options]",
    description: "Focus an element",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "scroll": {
    handler: cmd_scrollIntoView,
    usage: "dom scroll <targetId> <selector> [options]",
    description: "Scroll an element into view",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${SCROLL_OPTIONS}`,
  },

  "has": {
    handler: cmd_hasElement,
    usage: "dom has <targetId> <selector> [options]",
    description: "Check whether an element exists",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "count": {
    handler: cmd_getElementsCount,
    usage: "dom count <targetId> <selector> [options]",
    description: "Get matching element count",
    options: CDP_OPTIONS,
  },

  "attribute": {
    handler: cmd_getElementAttribute,
    usage: "dom attribute <targetId> <selector> <name> [options]",
    description: "Get an element attribute",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "attributes": {
    handler: cmd_getElementAttributes,
    usage: "dom attributes <targetId> <selector> [options]",
    description: "Get all element attributes",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "text": {
    handler: cmd_getElementInnerText,
    usage: "dom text <targetId> <selector> [options]",
    description: "Get element inner text",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "inner-html": {
    handler: cmd_getElementInnerHTML,
    usage: "dom inner-html <targetId> <selector> [options]",
    description: "Get element inner HTML",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "outer-html": {
    handler: cmd_getElementOuterHTML,
    usage: "dom outer-html <targetId> <selector> [options]",
    description: "Get element outer HTML",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "box": {
    handler: cmd_getElementBox,
    usage: "dom box <targetId> <selector> [options]",
    description: "Get element viewport box",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "center": {
    handler: cmd_getElementCenter,
    usage: "dom center <targetId> <selector> [options]",
    description: "Get element center point",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS}`,
  },

  "wait-appear": {
    handler: cmd_waitElementAppear,
    usage: "dom wait-appear <targetId> <selector> [options]",
    description: "Wait for an element to appear",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-disappear": {
    handler: cmd_waitElementDisappear,
    usage: "dom wait-disappear <targetId> <selector> [options]",
    description: "Wait for an element to disappear",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-visible": {
    handler: cmd_waitElementVisible,
    usage: "dom wait-visible <targetId> <selector> [options]",
    description: "Wait for an element to become visible",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-editable": {
    handler: cmd_waitElementEditable,
    usage: "dom wait-editable <targetId> <selector> [options]",
    description: "Wait for an element to become editable",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-clickable": {
    handler: cmd_waitElementClickable,
    usage: "dom wait-clickable <targetId> <selector> [options]",
    description: "Wait for an element to become clickable",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-text-includes": {
    handler: cmd_waitElementTextIncludes,
    usage:
      "dom wait-text-includes <targetId> <selector> <expectedText> [options]",
    description: "Wait for element text to include text",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-text-equals": {
    handler: cmd_waitElementTextEquals,
    usage:
      "dom wait-text-equals <targetId> <selector> <expectedText> [options]",
    description: "Wait for element text to equal text",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-text-regex": {
    handler: cmd_waitElementTextRegex,
    usage: "dom wait-text-regex <targetId> <selector> <pattern> [options]",
    description: "Wait for element text to match a regular expression",
    options: `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-count-equals": {
    handler: cmd_waitElementCountEquals,
    usage:
      "dom wait-count-equals <targetId> <selector> <expectedCount> [options]",
    description: "Wait for element count to equal a value",
    options: `${CDP_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-count-greater": {
    handler: cmd_waitElementCountGreater,
    usage:
      "dom wait-count-greater <targetId> <selector> <expectedCount> [options]",
    description: "Wait for element count to be greater than a value",
    options: `${CDP_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-count-greater-equals": {
    handler: cmd_waitElementCountGreaterEquals,
    usage:
      "dom wait-count-greater-equals <targetId> <selector> <expectedCount> [options]",
    description: "Wait for element count to be greater than or equal to a value",
    options: `${CDP_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-count-less": {
    handler: cmd_waitElementCountLess,
    usage:
      "dom wait-count-less <targetId> <selector> <expectedCount> [options]",
    description: "Wait for element count to be less than a value",
    options: `${CDP_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-count-less-equals": {
    handler: cmd_waitElementCountLessEquals,
    usage:
      "dom wait-count-less-equals <targetId> <selector> <expectedCount> [options]",
    description: "Wait for element count to be less than or equal to a value",
    options: `${CDP_OPTIONS} ${POLL_OPTIONS}`,
  },

  "wait-count-not-equals": {
    handler: cmd_waitElementCountNotEquals,
    usage:
      "dom wait-count-not-equals <targetId> <selector> <expectedCount> [options]",
    description: "Wait for element count to differ from a value",
    options: `${CDP_OPTIONS} ${POLL_OPTIONS}`,
  },
};

// -----------------------------------------------------------------------------
// CLI Commands: DOM
// -----------------------------------------------------------------------------

export function cmd_focus({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return focus(targetId, selector, options);
}

export function cmd_scrollIntoView({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return scrollIntoView(targetId, selector, options);
}

export function cmd_hasElement({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return hasElement(targetId, selector, options);
}

export function cmd_getElementsCount({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return getElementsCount(targetId, selector, options);
}

export function cmd_getElementAttribute({ argv, options } = {}) {
  const [targetId, selector, name] = argv;

  assertElementArgs(targetId, selector);
  assertNonBlankString(name, "name");

  return getElementAttribute(targetId, selector, name, options);
}

export function cmd_getElementAttributes({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return getElementAttributes(targetId, selector, options);
}

export function cmd_getElementInnerText({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return getElementInnerText(targetId, selector, options);
}

export function cmd_getElementInnerHTML({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return getElementInnerHTML(targetId, selector, options);
}

export function cmd_getElementOuterHTML({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return getElementOuterHTML(targetId, selector, options);
}

export function cmd_getElementBox({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return getElementBox(targetId, selector, options);
}

export function cmd_getElementCenter({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return getElementCenter(targetId, selector, options);
}

// -----------------------------------------------------------------------------
// CLI Commands: Wait
// -----------------------------------------------------------------------------

export function cmd_waitElementAppear({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return waitElementAppear(targetId, selector, options);
}

export function cmd_waitElementDisappear({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return waitElementDisappear(targetId, selector, options);
}

export function cmd_waitElementVisible({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return waitElementVisible(targetId, selector, options);
}

export function cmd_waitElementEditable({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return waitElementEditable(targetId, selector, options);
}

export function cmd_waitElementClickable({ argv, options } = {}) {
  const [targetId, selector] = resolveElementArgs(argv);

  return waitElementClickable(targetId, selector, options);
}

// -----------------------------------------------------------------------------
// CLI Commands: Wait - Text
// -----------------------------------------------------------------------------

export function cmd_waitElementTextIncludes({ argv, options } = {}) {
  const [targetId, selector, expectedText] = argv;

  assertElementArgs(targetId, selector);
  assertNonBlankString(expectedText, "expectedText");

  return waitElementTextIncludes(targetId, selector, expectedText, options);
}

export function cmd_waitElementTextEquals({ argv, options } = {}) {
  const [targetId, selector, expectedText] = argv;

  assertElementArgs(targetId, selector);
  assertNonBlankString(expectedText, "expectedText");

  return waitElementTextEquals(targetId, selector, expectedText, options);
}

export function cmd_waitElementTextRegex({ argv, options } = {}) {
  const [targetId, selector, pattern] = argv;

  assertElementArgs(targetId, selector);
  assertNonBlankString(pattern, "pattern");

  return waitElementTextRegex(targetId, selector, pattern, options);
}

// -----------------------------------------------------------------------------
// CLI Commands: Wait - Element Count
// -----------------------------------------------------------------------------

export function cmd_waitElementCountEquals({ argv, options } = {}) {
  return runWaitElementCount(waitElementCountEquals, argv, options);
}

export function cmd_waitElementCountGreater({ argv, options } = {}) {
  return runWaitElementCount(waitElementCountGreater, argv, options);
}

export function cmd_waitElementCountGreaterEquals({ argv, options } = {}) {
  return runWaitElementCount(waitElementCountGreaterEquals, argv, options);
}

export function cmd_waitElementCountLess({ argv, options } = {}) {
  return runWaitElementCount(waitElementCountLess, argv, options);
}

export function cmd_waitElementCountLessEquals({ argv, options } = {}) {
  return runWaitElementCount(waitElementCountLessEquals, argv, options);
}

export function cmd_waitElementCountNotEquals({ argv, options } = {}) {
  return runWaitElementCount(waitElementCountNotEquals, argv, options);
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function resolveElementArgs(argv = []) {
  const [targetId, selector] = argv;

  assertElementArgs(targetId, selector);

  return [targetId, selector];
}

function assertElementArgs(targetId, selector) {
  assertNonBlankString(targetId, "targetId");
  assertNonBlankString(selector, "selector");
}

function resolveExpectedCount(value) {
  assertNonBlankString(value, "expectedCount");

  const expectedCount = Number(value);

  if (!Number.isInteger(expectedCount) || expectedCount < 0) {
    throw new Error("expectedCount must be a non-negative integer");
  }

  return expectedCount;
}

function runWaitElementCount(waitMethod, argv = [], options = {}) {
  const [targetId, selector, value] = argv;

  assertElementArgs(targetId, selector);

  const expectedCount = resolveExpectedCount(value);

  return waitMethod(targetId, selector, expectedCount, options);
}
