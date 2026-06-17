import { log } from "../infra/log.js";

import {
  mouseMoveTo,
  click,
  doubleClick,
  wheelAt,
  enter,
  tab,
  escape,
  backspace,
  deleteKey,
  arrowUp,
  arrowDown,
  arrowLeft,
  arrowRight,
  home,
  end,
  pageUp,
  pageDown,
  type,
  fill,
} from "../cdp/input.js";

const CLIENT_OPTIONS = "--host --port";

/**
 * input.js:
 *   input move
 *   input click
 *   input dblclick
 *   input wheel
 *   input enter
 *   input tab
 *   input escape
 *   input backspace
 *   input delete
 *   input up
 *   input down
 *   input left
 *   input right
 *   input home
 *   input end
 *   input pageup
 *   input pagedown
 *   input type
 *   input fill
 */
export const INPUT_COMMANDS = {
  move: {
    handler: cmd_mouseMoveTo,
    usage: "input move <targetId> <x> <y> [options]",
    description: "Move mouse to viewport position",
    options: `--buttons --modifiers ${CLIENT_OPTIONS}`,
  },

  click: {
    handler: cmd_click,
    usage: "input click <targetId> <selector> [options]",
    description: "Click element",
    options: `--button --modifiers --block --inline --behavior --timeout --interval ${CLIENT_OPTIONS}`,
  },

  dblclick: {
    handler: cmd_doubleClick,
    usage: "input dblclick <targetId> <selector> [options]",
    description: "Double click element",
    options: `--button --modifiers --block --inline --behavior --timeout --interval ${CLIENT_OPTIONS}`,
  },

  wheel: {
    handler: cmd_wheelAt,
    usage: "input wheel <targetId> <x> <y> <deltaY> [options]",
    description: "Wheel at viewport position",
    options: `--deltaX --modifiers ${CLIENT_OPTIONS}`,
  },

  enter: {
    handler: cmd_enter,
    usage: "input enter <targetId> [options]",
    description: "Press Enter key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  tab: {
    handler: cmd_tab,
    usage: "input tab <targetId> [options]",
    description: "Press Tab key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  escape: {
    handler: cmd_escape,
    usage: "input escape <targetId> [options]",
    description: "Press Escape key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  backspace: {
    handler: cmd_backspace,
    usage: "input backspace <targetId> [options]",
    description: "Press Backspace key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  delete: {
    handler: cmd_deleteKey,
    usage: "input delete <targetId> [options]",
    description: "Press Delete key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  up: {
    handler: cmd_arrowUp,
    usage: "input up <targetId> [options]",
    description: "Press ArrowUp key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  down: {
    handler: cmd_arrowDown,
    usage: "input down <targetId> [options]",
    description: "Press ArrowDown key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  left: {
    handler: cmd_arrowLeft,
    usage: "input left <targetId> [options]",
    description: "Press ArrowLeft key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  right: {
    handler: cmd_arrowRight,
    usage: "input right <targetId> [options]",
    description: "Press ArrowRight key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  home: {
    handler: cmd_home,
    usage: "input home <targetId> [options]",
    description: "Press Home key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  end: {
    handler: cmd_end,
    usage: "input end <targetId> [options]",
    description: "Press End key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  pageup: {
    handler: cmd_pageUp,
    usage: "input pageup <targetId> [options]",
    description: "Press PageUp key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  pagedown: {
    handler: cmd_pageDown,
    usage: "input pagedown <targetId> [options]",
    description: "Press PageDown key",
    options: `--modifiers ${CLIENT_OPTIONS}`,
  },

  type: {
    handler: cmd_type,
    usage: "input type <targetId> <selector> <text> [options]",
    description: "Type text into element",
    options: `--clear --block --inline --behavior --timeout --interval ${CLIENT_OPTIONS}`,
  },

  fill: {
    handler: cmd_fill,
    usage: "input fill <targetId> <selector> <text> [options]",
    description: "Fill element value",
    options: `--block --inline --behavior --timeout --interval ${CLIENT_OPTIONS}`,
  },
};

/**
 * 移动鼠标到指定 viewport 坐标。
 */
export async function cmd_mouseMoveTo(ctx) {
  const { argv, options } = ctx;
  const [targetId, x, y] = argv;

  const result = await mouseMoveTo(targetId, x, y, options);

  log.info(`Mouse moved to (${x}, ${y})`, options);

  return result;
}

/**
 * 点击元素。
 */
export async function cmd_click(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await click(targetId, selector, options);

  log.info(`Element clicked: ${selector}`, options);

  return result;
}

/**
 * 双击元素。
 */
export async function cmd_doubleClick(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await doubleClick(targetId, selector, options);

  log.info(`Element double clicked: ${selector}`, options);

  return result;
}

/**
 * 鼠标滚轮。
 */
export async function cmd_wheelAt(ctx) {
  const { argv, options } = ctx;
  const [targetId, x, y, deltaY] = argv;
  const deltaX = options.deltaX ?? 0;

  const result = await wheelAt(targetId, x, y, deltaX, deltaY, options);

  log.info(
    `Wheel at (${x}, ${y}): deltaX=${deltaX}, deltaY=${deltaY}`,
    options,
  );

  return result;
}

/**
 * 回车。
 */
export async function cmd_enter(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await enter(targetId, options);

  log.info(`Pressed Enter: ${targetId}`, options);

  return result;
}

/**
 * Tab。
 */
export async function cmd_tab(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await tab(targetId, options);

  log.info(`Pressed Tab: ${targetId}`, options);

  return result;
}

/**
 * Escape。
 */
export async function cmd_escape(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await escape(targetId, options);

  log.info(`Pressed Escape: ${targetId}`, options);

  return result;
}

/**
 * Backspace。
 */
export async function cmd_backspace(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await backspace(targetId, options);

  log.info(`Pressed Backspace: ${targetId}`, options);

  return result;
}

/**
 * Delete。
 */
export async function cmd_deleteKey(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await deleteKey(targetId, options);

  log.info(`Pressed Delete: ${targetId}`, options);

  return result;
}

/**
 * ArrowUp。
 */
export async function cmd_arrowUp(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await arrowUp(targetId, options);

  log.info(`Pressed ArrowUp: ${targetId}`, options);

  return result;
}

/**
 * ArrowDown。
 */
export async function cmd_arrowDown(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await arrowDown(targetId, options);

  log.info(`Pressed ArrowDown: ${targetId}`, options);

  return result;
}

/**
 * ArrowLeft。
 */
export async function cmd_arrowLeft(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await arrowLeft(targetId, options);

  log.info(`Pressed ArrowLeft: ${targetId}`, options);

  return result;
}

/**
 * ArrowRight。
 */
export async function cmd_arrowRight(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await arrowRight(targetId, options);

  log.info(`Pressed ArrowRight: ${targetId}`, options);

  return result;
}

/**
 * Home。
 */
export async function cmd_home(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await home(targetId, options);

  log.info(`Pressed Home: ${targetId}`, options);

  return result;
}

/**
 * End。
 */
export async function cmd_end(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await end(targetId, options);

  log.info(`Pressed End: ${targetId}`, options);

  return result;
}

/**
 * PageUp。
 */
export async function cmd_pageUp(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await pageUp(targetId, options);

  log.info(`Pressed PageUp: ${targetId}`, options);

  return result;
}

/**
 * PageDown。
 */
export async function cmd_pageDown(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await pageDown(targetId, options);

  log.info(`Pressed PageDown: ${targetId}`, options);

  return result;
}

/**
 * 模拟输入文本。
 */
export async function cmd_type(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector, text] = argv;

  const result = await type(targetId, selector, text, options);

  log.info(`Text typed into element: ${selector}`, options);

  return result;
}

/**
 * 直接填充元素值。
 */
export async function cmd_fill(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector, text] = argv;

  const result = await fill(targetId, selector, text, options);

  log.info(`Element filled: ${selector}`, options);

  return result;
}