import { assertNonBlankString, assertNumber } from "../../common/assert.js";
import {
  removeMouseState,
  mouseMove,
  click,
  doubleClick,
} from "../../cdp/mouse.js";

const CDP_OPTIONS = "--host --port";
const DOM_OPTIONS = "--nth --timeout --interval";
const MOUSE_OPTIONS = "--button --buttons --modifiers";

/**
 * Mouse CLI command registry.
 *
 * mouse remove-state <targetId>
 * mouse move <targetId> <x> <y>
 * mouse click <targetId> <selector>
 * mouse double-click <targetId> <selector>
 */
export const MOUSE_COMMANDS = {
  "remove-state": {
    handler: cmd_removeMouseState,
    usage: "mouse remove-state <targetId> [options]",
    description: "Remove cached mouse state",
    options: CDP_OPTIONS,
  },

  move: {
    handler: cmd_mouseMove,
    usage: "mouse move <targetId> <x> <y> [options]",
    description: "Move mouse to viewport coordinates",
    options: `${CDP_OPTIONS} ${MOUSE_OPTIONS}`,
  },

  click: {
    handler: cmd_click,
    usage: "mouse click <targetId> <selector> [options]",
    description: "Click an element",
    options: `${CDP_OPTIONS} ${DOM_OPTIONS} ${MOUSE_OPTIONS}`,
  },

  "double-click": {
    handler: cmd_doubleClick,
    usage: "mouse double-click <targetId> <selector> [options]",
    description: "Double-click an element",
    options: `${CDP_OPTIONS} ${DOM_OPTIONS} ${MOUSE_OPTIONS}`,
  },
};

// -----------------------------------------------------------------------------
// CLI Commands
// -----------------------------------------------------------------------------

/**
 * Remove cached mouse state for a Chrome target.
 */
export function cmd_removeMouseState({ argv, options } = {}) {
  const [targetId] = argv;
  assertNonBlankString(targetId, "targetId");

  return removeMouseState(targetId, options);
}

/**
 * Move the mouse to viewport coordinates.
 */
export async function cmd_mouseMove({ argv, options } = {}) {
  const [targetId, xValue, yValue] = argv;

  assertNonBlankString(targetId, "targetId");

  const x = Number(xValue);
  const y = Number(yValue);

  assertNumber(x, "x");
  assertNumber(y, "y");

  await mouseMove(targetId, x, y, options);

  return {
    targetId,
    x,
    y,
  };
}

/**
 * Click an element.
 */
export async function cmd_click({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlankString(targetId, "targetId");
  assertNonBlankString(selector, "selector");

  await click(targetId, selector, options);

  return true;
}

/**
 * Double-click an element.
 */
export async function cmd_doubleClick({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlankString(targetId, "targetId");
  assertNonBlankString(selector, "selector");

  await doubleClick(targetId, selector, options);

  return true;
}
