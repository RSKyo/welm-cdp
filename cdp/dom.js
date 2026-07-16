// -----------------------------------------------------------------------------
// cdp/dom
// -----------------------------------------------------------------------------
// DOM query, inspection, focus, scrolling, and wait utilities.
//
// Public API: DOM
// - focus(targetId, selector, options)
// - scrollIntoView(targetId, selector, options)
// - hasElement(targetId, selector, options)
// - getElementsCount(targetId, selector, options)
// - getElementAttribute(targetId, selector, name, options)
// - getElementAttributes(targetId, selector, options)
// - getElementInnerText(targetId, selector, options)
// - getElementInnerHTML(targetId, selector, options)
// - getElementOuterHTML(targetId, selector, options)
// - getElementBox(targetId, selector, options)
// - getElementCenter(targetId, selector, options)
//
// Public API: Wait
// - waitElementAppear(targetId, selector, options)
// - waitElementDisappear(targetId, selector, options)
// - waitElementVisible(targetId, selector, options)
// - waitElementEditable(targetId, selector, options)
// - waitElementClickable(targetId, selector, options)
//
// Public API: Wait - Text
// - waitElementTextIncludes(targetId, selector, expectedText, options)
// - waitElementTextEquals(targetId, selector, expectedText, options)
// - waitElementTextRegex(targetId, selector, pattern, options)
//
// Public API: Wait - Element Count
// - waitElementCountEquals(targetId, selector, expectedCount, options)
// - waitElementCountGreater(targetId, selector, expectedCount, options)
// - waitElementCountGreaterEquals(targetId, selector, expectedCount, options)
// - waitElementCountLess(targetId, selector, expectedCount, options)
// - waitElementCountLessEquals(targetId, selector, expectedCount, options)
// - waitElementCountNotEquals(targetId, selector, expectedCount, options)
//
// Features:
// - Query elements using CSS selectors.
// - Select an element by zero-based or negative index.
// - Read element attributes, text, HTML, and viewport coordinates.
// - Focus and scroll elements into view.
// - Wait for element presence, visibility, editability, and clickability.
// - Wait for element text and element count conditions.
//
// Design:
// - DOM expressions are executed through the Runtime domain.
// - Element indices are zero-based and support negative values.
// - Negative indices select elements from the end of the result list.
// - Strict element resolution throws when an element cannot be resolved.
// - Safe element resolution returns null when an element cannot be resolved.
// - Wait methods use polling with method-specific matchers.
// - Missing elements return null during text polling.
// - Element text is trimmed before matching.
// - Element coordinates are relative to the viewport.
//
// Version: 0.1.0
// Last modified: 2026-07-14
// -----------------------------------------------------------------------------

import { evaluate, poll } from "./runtime.js";

// -----------------------------------------------------------------------------
// Public API: DOM
// -----------------------------------------------------------------------------

/**
 * Focus an element.
 *
 * @example
 * await focus(targetId, "#search");
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<boolean>}
 * Returns true after the element has been focused.
 */
export async function focus(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      el.focus();
      return true;
    })()
  `;

  await evaluate(targetId, expression, options);

  return true;
}

/**
 * Scroll an element into the viewport and wait until its
 * viewport-relative box becomes stable.
 *
 * The element is centered with instant scrolling. If the element
 * is not available or its center is outside the viewport, polling
 * continues until the element can be centered and its position
 * and size remain stable for the required number of checks.
 *
 * @example
 * await scrollIntoView(
 *   targetId,
 *   "#submit"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM, polling, and CDP options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @param {number} [options.pollTimeout=30000]
 * Maximum waiting duration, in milliseconds.
 *
 * @param {number} [options.pollInterval=100]
 * Delay between checks, in milliseconds.
 *
 * @param {number} [options.matchTimes=3]
 * Required number of consecutive stable box comparisons.
 *
 * @param {number} [options.positionTolerance=0.5]
 * Maximum allowed difference, in CSS pixels, for each box
 * position and size value between two consecutive checks.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<boolean>}
 * Returns true after the element is centered in the viewport
 * and its viewport-relative box is stable.
 *
 * @throws {Error}
 * Throws if the element cannot be found, centered, and stabilized
 * before the polling timeout.
 */
export async function scrollIntoView(targetId, selector, options = {}) {
  const tolerance = options.positionTolerance ?? 0.5;

  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("positionTolerance must be a non-negative number");
  }

  let previousBox = null;

  const expression = `
    (() => {
      const el = ${buildElementResolverSafe(selector, options)};
      if (!el) return null;

      const isCenterInViewport = (rect) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        return (
          centerX >= 0 &&
          centerX <= window.innerWidth &&
          centerY >= 0 &&
          centerY <= window.innerHeight
        );
      };

      let rect = el.getBoundingClientRect();

      if (!isCenterInViewport(rect)) {
        el.scrollIntoView({
          block: "center",
          inline: "center",
          behavior: "instant",
        });

        rect = el.getBoundingClientRect();
      }

      if (!isCenterInViewport(rect)) {
        return null;
      }

      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
    })()
  `;

  await poll(targetId, expression, {
    ...options,
    pollInterval: options.pollInterval ?? 100,
    matchTimes: options.matchTimes ?? 3,

    matcher(box) {
      if (!box) {
        previousBox = null;
        return false;
      }

      const stable =
        previousBox !== null && isRectStable(previousBox, box, tolerance);

      previousBox = box;

      return stable;
    },
  });

  return true;
}

/**
 * Check whether an element exists.
 *
 * @example
 * const exists = await hasElement(
 *   targetId,
 *   "#result"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<boolean>}
 * Returns true if the selected element exists.
 */
export async function hasElement(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolverSafe(selector, options)};

      return el !== null;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * Get the number of elements matching a selector.
 *
 * @example
 * const count = await getElementsCount(
 *   targetId,
 *   ".item"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * Runtime options.
 *
 * @returns {Promise<number>}
 * Number of matching elements.
 */
export async function getElementsCount(targetId, selector, options = {}) {
  const expression = `
    (() => {
      return document.querySelectorAll(${q(selector)}).length;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * Get an element attribute.
 *
 * @example
 * const href = await getElementAttribute(
 *   targetId,
 *   "a",
 *   "href"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {string} name
 * Attribute name.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<string>}
 * Attribute value.
 *
 * @throws {Error}
 * Throws if the element or attribute does not exist.
 */
export async function getElementAttribute(
  targetId,
  selector,
  name,
  options = {},
) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      if (!el.hasAttribute(${q(name)})) {
        throw new Error("attribute not found");
      }

      return el.getAttribute(${q(name)});
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * Get all attributes of an element.
 *
 * @example
 * const attributes = await getElementAttributes(
 *   targetId,
 *   "#result"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<Object>}
 * Attribute names and values.
 */
export async function getElementAttributes(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      
      const out = {};
      for (const attr of el.attributes) {
        out[attr.name] = attr.value;
      }
      return out;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * Get the inner text of an element.
 *
 * @example
 * const text = await getElementInnerText(
 *   targetId,
 *   "#result"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<string>}
 * Element inner text.
 */
export async function getElementInnerText(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      return el.innerText;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * Get the inner HTML of an element.
 *
 * @example
 * const html = await getElementInnerHTML(
 *   targetId,
 *   "#result"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<string>}
 * Element inner HTML.
 */
export async function getElementInnerHTML(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      
      return el.innerHTML;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * Get the outer HTML of an element.
 *
 * @example
 * const html = await getElementOuterHTML(
 *   targetId,
 *   "#result"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<string>}
 * Element outer HTML.
 */
export async function getElementOuterHTML(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      return el.outerHTML;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * Get the viewport-relative box of an element.
 *
 * @example
 * const box = await getElementBox(
 *   targetId,
 *   "#result"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<Object>}
 * Element coordinates and dimensions.
 * Includes x, y, width, height, centerX, and centerY.
 */
export async function getElementBox(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      const rect = el.getBoundingClientRect();

      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * Get the viewport-relative center point of an element.
 *
 * @example
 * const point = await getElementCenter(
 *   targetId,
 *   "#result"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<Object>}
 * Center point containing x and y.
 */
export async function getElementCenter(targetId, selector, options = {}) {
  const { centerX, centerY } = await getElementBox(targetId, selector, options);

  return {
    x: centerX,
    y: centerY,
  };
}

// -----------------------------------------------------------------------------
// Public API: Wait
// -----------------------------------------------------------------------------

/**
 * Wait for an element to appear.
 *
 * @example
 * await waitElementAppear(
 *   targetId,
 *   "#result"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM and polling options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<{value: boolean, times: number}>}
 * Polling result containing the matched boolean value and
 * total evaluation times.
 */
export function waitElementAppear(targetId, selector, options = {}) {
  return waitElement(targetId, selector, {
    ...options,

    matcher(value) {
      return value === true;
    },
  });
}

/**
 * Wait for an element to disappear.
 *
 * The condition is met when the selected element no longer exists.
 *
 * @example
 * await waitElementDisappear(
 *   targetId,
 *   "#loading"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM and polling options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<{value: boolean, times: number}>}
 * Polling result containing the matched boolean value and
 * total evaluation times.
 */
export function waitElementDisappear(targetId, selector, options = {}) {
  return waitElement(targetId, selector, {
    ...options,

    matcher(value) {
      return value === false;
    },
  });
}

/**
 * Wait for an element to become visible.
 *
 * Visibility requires a visible display and visibility state,
 * non-zero opacity, and positive width and height.
 *
 * @example
 * await waitElementVisible(
 *   targetId,
 *   "#dialog"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM and polling options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<{value: boolean, times: number}>}
 * Polling result containing the matched boolean value and
 * total evaluation times.
 */
export function waitElementVisible(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolverSafe(selector, options)};
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0
      );
    })()
  `;

  return poll(targetId, expression, {
    ...options,

    matcher(value) {
      return value === true;
    },
  });
}

/**
 * Wait for an element to become editable.
 *
 * Editable elements include contenteditable elements,
 * textareas, and editable input types.
 *
 * @example
 * await waitElementEditable(
 *   targetId,
 *   "#message"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM and polling options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<{value: boolean, times: number}>}
 * Polling result containing the matched boolean value and
 * total evaluation times.
 */
export function waitElementEditable(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolverSafe(selector, options)};
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        rect.width > 0 &&
        rect.height > 0;

      if (!visible) return false;

      if (
        el.getAttribute("aria-disabled") === "true" ||
        el.getAttribute("aria-readonly") === "true"
      ) {
        return false;
      }

      if (el.isContentEditable) {
        return true;
      }

      if (el instanceof HTMLTextAreaElement) {
        return !el.disabled && !el.readOnly;
      }

      if (el instanceof HTMLInputElement) {
        const nonEditableTypes = [
          "button",
          "checkbox",
          "color",
          "file",
          "hidden",
          "image",
          "radio",
          "range",
          "reset",
          "submit",
        ];

        return (
          !nonEditableTypes.includes(el.type) &&
          !el.disabled &&
          !el.readOnly
        );
      }

      return false;
    })()
  `;

  return poll(targetId, expression, {
    ...options,

    matcher(value) {
      return value === true;
    },
  });
}

/**
 * Wait for an element to become clickable.
 *
 * Clickability requires the element to be visible and enabled.
 * The element must not have disabled set and must not have
 * aria-disabled="true".
 *
 * @example
 * await waitElementClickable(
 *   targetId,
 *   "#submit"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {Object} [options]
 * DOM and polling options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<{value: boolean, times: number}>}
 * Polling result containing the matched boolean value and
 * total evaluation times. The value is true when the element is visible and enabled.
 */
export function waitElementClickable(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolverSafe(selector, options)};
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0;

      const enabled =
        !el.disabled &&
        el.getAttribute('aria-disabled') !== 'true';

      return visible && enabled;
    })()
  `;

  return poll(targetId, expression, {
    ...options,

    matcher(value) {
      return value === true;
    },
  });
}

// -----------------------------------------------------------------------------
// Public API: Wait - Text
// -----------------------------------------------------------------------------

/**
 * Wait for an element text to include the expected text.
 *
 * @example
 * const text = await waitElementTextIncludes(
 *   targetId,
 *   "#status",
 *   "Ready"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {string} expectedText
 * Text that must be included.
 *
 * @param {Object} [options]
 * DOM and polling options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<{value: string, times: number}>}
 * Polling result containing the matched element text and
 * total evaluation times.
 */
export function waitElementTextIncludes(
  targetId,
  selector,
  expectedText,
  options = {},
) {
  return waitElementText(targetId, selector, {
    ...options,

    matcher(value) {
      return typeof value === "string" && value.includes(expectedText);
    },
  });
}

/**
 * Wait for an element text to equal the expected text.
 *
 * @example
 * const text = await waitElementTextEquals(
 *   targetId,
 *   "#status",
 *   "Ready"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {string} expectedText
 * Exact expected text.
 *
 * @param {Object} [options]
 * DOM and polling options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<{value: string, times: number}>}
 * Polling result containing the matched element text and
 * total evaluation times.
 */
export function waitElementTextEquals(
  targetId,
  selector,
  expectedText,
  options = {},
) {
  return waitElementText(targetId, selector, {
    ...options,

    matcher(value) {
      return value !== null && value === expectedText;
    },
  });
}

/**
 * Wait for an element text to match a regular expression.
 *
 * @example
 * const text = await waitElementTextRegex(
 *   targetId,
 *   "#status",
 *   "^Ready"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {string|RegExp} pattern
 * Regular expression pattern.
 *
 * @param {Object} [options]
 * DOM and polling options.
 *
 * @param {number} [options.nth=0]
 * Zero-based element index.
 * Negative values select from the end.
 *
 * @returns {Promise<{value: string, times: number}>}
 * Polling result containing the matched element text and
 * total evaluation times.
 */
export function waitElementTextRegex(
  targetId,
  selector,
  pattern,
  options = {},
) {
  const re = new RegExp(pattern);

  return waitElementText(targetId, selector, {
    ...options,

    matcher(value) {
      if (typeof value !== "string") return false;

      re.lastIndex = 0;
      return re.test(value);
    },
  });
}

// -----------------------------------------------------------------------------
// Public API: Wait - Element Count
// -----------------------------------------------------------------------------

/**
 * Wait for the element count to equal the expected count.
 *
 * @example
 * const count = await waitElementCountEquals(
 *   targetId,
 *   ".item",
 *   5
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {number} expectedCount
 * Expected element count.
 *
 * @param {Object} [options]
 * Runtime and polling options.
 *
 * @returns {Promise<{value: number, times: number}>}
 * Polling result containing the matched element count and
 * total evaluation times.
 */
export function waitElementCountEquals(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitElementsCount(targetId, selector, {
    ...options,

    matcher(value) {
      return Number(value) === expectedCount;
    },
  });
}

/**
 * Wait for the element count to be greater than the expected count.
 *
 * @example
 * const count = await waitElementCountGreater(
 *   targetId,
 *   ".item",
 *   0
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {number} expectedCount
 * Count to compare against.
 *
 * @param {Object} [options]
 * Runtime and polling options.
 *
 * @returns {Promise<{value: number, times: number}>}
 * Polling result containing the matched element count and
 * total evaluation times.
 */
export function waitElementCountGreater(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitElementsCount(targetId, selector, {
    ...options,

    matcher(value) {
      return Number(value) > expectedCount;
    },
  });
}

/**
 * Wait for the element count to be greater than
 * or equal to the expected count.
 *
 * @example
 * const count = await waitElementCountGreaterEquals(
 *   targetId,
 *   ".item",
 *   5
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {number} expectedCount
 * Count to compare against.
 *
 * @param {Object} [options]
 * Runtime and polling options.
 *
 * @returns {Promise<{value: number, times: number}>}
 * Polling result containing the matched element count and
 * total evaluation times.
 */
export function waitElementCountGreaterEquals(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitElementsCount(targetId, selector, {
    ...options,

    matcher(value) {
      return Number(value) >= expectedCount;
    },
  });
}

/**
 * Wait for the element count to be less than the expected count.
 *
 * @example
 * const count = await waitElementCountLess(
 *   targetId,
 *   ".loading",
 *   1
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {number} expectedCount
 * Count to compare against.
 *
 * @param {Object} [options]
 * Runtime and polling options.
 *
* @returns {Promise<{value: number, times: number}>}
 * Polling result containing the matched element count and
 * total evaluation times.
 */
export function waitElementCountLess(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitElementsCount(targetId, selector, {
    ...options,

    matcher(value) {
      return Number(value) < expectedCount;
    },
  });
}

/**
 * Wait for the element count to be less than
 * or equal to the expected count.
 *
 * @example
 * const count = await waitElementCountLessEquals(
 *   targetId,
 *   ".item",
 *   5
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {number} expectedCount
 * Count to compare against.
 *
 * @param {Object} [options]
 * Runtime and polling options.
 *
 * @returns {Promise<{value: number, times: number}>}
 * Polling result containing the matched element count and
 * total evaluation times.
 */
export function waitElementCountLessEquals(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitElementsCount(targetId, selector, {
    ...options,

    matcher(value) {
      return Number(value) <= expectedCount;
    },
  });
}

/**
 * Wait for the element count to differ from the expected count.
 *
 * @example
 * const count = await waitElementCountNotEquals(
 *   targetId,
 *   ".item",
 *   0
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} selector
 * CSS selector.
 *
 * @param {number} expectedCount
 * Count to compare against.
 *
 * @param {Object} [options]
 * Runtime and polling options.
 *
 * @returns {Promise<{value: number, times: number}>}
 * Polling result containing the matched element count and
 * total evaluation times.
 */
export function waitElementCountNotEquals(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitElementsCount(targetId, selector, {
    ...options,

    matcher(value) {
      return Number(value) !== expectedCount;
    },
  });
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function q(value) {
  return JSON.stringify(value);
}

function resolveNth(options = {}) {
  const nth = options.nth ?? 0;

  if (!Number.isInteger(nth)) {
    throw new Error("nth must be an integer");
  }

  return nth;
}

function buildElementResolver(selector, options = {}) {
  const nth = resolveNth(options);

  return `
    (() => {
      const elements = document.querySelectorAll(${q(selector)});
      const count = elements.length;

      if (count === 0) {
        throw new Error("element not found");
      }

      let index = ${nth};

      if (index < 0) {
        index = count + index;
      }

      if (index < 0 || index >= count) {
        throw new Error(\`element index out of range: \${index}\`);
      }

      return elements[index];
    })()
  `;
}

function buildElementResolverSafe(selector, options = {}) {
  const nth = resolveNth(options);

  return `
    (() => {
      const elements = document.querySelectorAll(${q(selector)});
      const count = elements.length;

      if (count === 0) {
        return null;
      }

      let index = ${nth};

      if (index < 0) {
        index = count + index;
      }

      if (index < 0 || index >= count) {
        return null;
      }

      return elements[index];
    })()
  `;
}

function isRectStable(previous, current, tolerance) {
  return (
    Math.abs(current.x - previous.x) <= tolerance &&
    Math.abs(current.y - previous.y) <= tolerance &&
    Math.abs(current.width - previous.width) <= tolerance &&
    Math.abs(current.height - previous.height) <= tolerance
  );
}

function waitElement(targetId, selector, options = {}) {
  if (typeof options.matcher !== "function") {
    throw new Error("matcher must be a function");
  }

  const expression = `
    (() => {
      const el = ${buildElementResolverSafe(selector, options)};
      return !!el;
    })()
  `;

  return poll(targetId, expression, options);
}

function waitElementText(targetId, selector, options = {}) {
  if (typeof options.matcher !== "function") {
    throw new Error("matcher must be a function");
  }

  const expression = `
    (() => {
      const el = ${buildElementResolverSafe(selector, options)};
      if (!el) return null;

      return (el.innerText ?? el.textContent ?? '').trim();
    })()
  `;

  return poll(targetId, expression, options);
}

function waitElementsCount(targetId, selector, options = {}) {
  if (typeof options.matcher !== "function") {
    throw new Error("matcher must be a function");
  }

  const expression = `
    (() => {
      return document.querySelectorAll(
        ${q(selector)}
      ).length;
    })()
  `;

  return poll(targetId, expression, options);
}
