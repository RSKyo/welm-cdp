import { log } from "../infra/log.js";

// wait.js
import {
  waitSelector,
  waitVisible,
  waitEditable,
  waitClickable,
  waitMatch,
  waitPage,
} from "../cdp/wait.js";

// dom.js
import {
  getElementAttribute,
  getElementAttributes,
  getElementOuterHTML,
  getElementInnerHTML,
  getElementInnerText,
  getElementBox,
  getElementCenter,
} from "../cdp/dom.js";

// input.js
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

/**
 * wait.js:
 *   page has
 *   page visible
 *   page editable
 *   page clickable
 *   page match
 *   page ready
 */
const PAGE_WAIT_COMMANDS = {
  has: {
    handler: cmd_waitSelector,
    usage: "page has <targetId> <selector> [options]",
    description: "Wait until element exists",
    options: "--timeout --interval --host --port",
  },

  visible: {
    handler: cmd_waitVisible,
    usage: "page visible <targetId> <selector> [options]",
    description: "Wait until element is visible",
    options: "--timeout --interval --host --port",
  },

  editable: {
    handler: cmd_waitEditable,
    usage: "page editable <targetId> <selector> [options]",
    description: "Wait until element is editable",
    options: "--timeout --interval --host --port",
  },

  clickable: {
    handler: cmd_waitClickable,
    usage: "page clickable <targetId> <selector> [options]",
    description: "Wait until element is clickable",
    options: "--timeout --interval --host --port",
  },

  match: {
    handler: cmd_waitMatch,
    usage: "page match <targetId> <selector> <pattern> [options]",
    description: "Wait until element text matches pattern",
    options: "--mode --timeout --interval --host --port",
  },

  ready: {
    handler: cmd_waitPage,
    usage: "page ready <targetId> [options]",
    description: "Wait until page is ready",
    options: "--timeout --interval --host --port",
  },
};

/**
 *   page attr
 *   page attrs
 *   page outerhtml
 *   page html
 *   page text
 *   page box
 *   page center
 */
const PAGE_DOM_COMMANDS = {
  attr: {
    handler: cmd_getElementAttribute,
    usage: "page attr <targetId> <selector> <name> [options]",
    description: "Get element attribute",
    options: "--host --port",
  },

  attrs: {
    handler: cmd_getElementAttributes,
    usage: "page attrs <targetId> <selector> [options]",
    description: "Get all element attributes",
    options: "--host --port",
  },

  outerhtml: {
    handler: cmd_getElementOuterHTML,
    usage: "page outerhtml <targetId> <selector> [options]",
    description: "Get element outerHTML",
    options: "--host --port",
  },

  html: {
    handler: cmd_getElementInnerHTML,
    usage: "page html <targetId> <selector> [options]",
    description: "Get element innerHTML",
    options: "--host --port",
  },

  text: {
    handler: cmd_getElementInnerText,
    usage: "page text <targetId> <selector> [options]",
    description: "Get element text",
    options: "--host --port",
  },

  box: {
    handler: cmd_getElementBox,
    usage: "page box <targetId> <selector> [options]",
    description: "Get element bounding box",
    options: "--host --port",
  },

  center: {
    handler: cmd_getElementCenter,
    usage: "page center <targetId> <selector> [options]",
    description: "Get element center point",
    options: "--host --port",
  },
};

/**
 * input.js:
 *   page move
 *   page click
 *   page dblclick
 *   page wheel
 *   page enter
 *   page tab
 *   page escape
 *   page backspace
 *   page delete
 *   page up
 *   page down
 *   page left
 *   page right
 *   page home
 *   page end
 *   page pageup
 *   page pagedown
 *   page type
 *   page fill
 */
const PAGE_INPUT_COMMANDS={
  move: {
    handler: cmd_mouseMoveTo,
    usage: "page move <targetId> <x> <y> [options]",
    description: "Move mouse to viewport position",
    options: "--buttons --modifiers --host --port",
  },

  click: {
    handler: cmd_click,
    usage: "page click <targetId> <selector> [options]",
    description: "Click element",
    options: "--button --modifiers --block --inline --behavior --timeout --interval --host --port",
  },

  dblclick: {
    handler: cmd_doubleClick,
    usage: "page dblclick <targetId> <selector> [options]",
    description: "Double click element",
    options: "--button --modifiers --block --inline --behavior --timeout --interval --host --port",
  },

  wheel: {
    handler: cmd_wheelAt,
    usage: "page wheel <targetId> <x> <y> <deltaY> [options]",
    description: "Wheel at viewport position",
    options: "--deltaX --modifiers --host --port",
  },

  enter: {
    handler: cmd_enter,
    usage: "page enter <targetId> [options]",
    description: "Press Enter key",
    options: "--modifiers --host --port",
  },

  tab: {
    handler: cmd_tab,
    usage: "page tab <targetId> [options]",
    description: "Press Tab key",
    options: "--modifiers --host --port",
  },

  escape: {
    handler: cmd_escape,
    usage: "page escape <targetId> [options]",
    description: "Press Escape key",
    options: "--modifiers --host --port",
  },

  backspace: {
    handler: cmd_backspace,
    usage: "page backspace <targetId> [options]",
    description: "Press Backspace key",
    options: "--modifiers --host --port",
  },

  delete: {
    handler: cmd_deleteKey,
    usage: "page delete <targetId> [options]",
    description: "Press Delete key",
    options: "--modifiers --host --port",
  },

  up: {
    handler: cmd_arrowUp,
    usage: "page up <targetId> [options]",
    description: "Press ArrowUp key",
    options: "--modifiers --host --port",
  },

  down: {
    handler: cmd_arrowDown,
    usage: "page down <targetId> [options]",
    description: "Press ArrowDown key",
    options: "--modifiers --host --port",
  },

  left: {
    handler: cmd_arrowLeft,
    usage: "page left <targetId> [options]",
    description: "Press ArrowLeft key",
    options: "--modifiers --host --port",
  },

  right: {
    handler: cmd_arrowRight,
    usage: "page right <targetId> [options]",
    description: "Press ArrowRight key",
    options: "--modifiers --host --port",
  },

  home: {
    handler: cmd_home,
    usage: "page home <targetId> [options]",
    description: "Press Home key",
    options: "--modifiers --host --port",
  },

  end: {
    handler: cmd_end,
    usage: "page end <targetId> [options]",
    description: "Press End key",
    options: "--modifiers --host --port",
  },

  pageup: {
    handler: cmd_pageUp,
    usage: "page pageup <targetId> [options]",
    description: "Press PageUp key",
    options: "--modifiers --host --port",
  },

  pagedown: {
    handler: cmd_pageDown,
    usage: "page pagedown <targetId> [options]",
    description: "Press PageDown key",
    options: "--modifiers --host --port",
  },

  type: {
    handler: cmd_type,
    usage: "page type <targetId> <selector> <text> [options]",
    description: "Type text into element",
    options: "--clear --block --inline --behavior --timeout --interval --host --port",
  },

  fill: {
    handler: cmd_fill,
    usage: "page fill <targetId> <selector> <text> [options]",
    description: "Fill element value",
    options: "--block --inline --behavior --timeout --interval --host --port",
  },
};

export const PAGE_COMMANDS = {
  ...PAGE_WAIT_COMMANDS,
  ...PAGE_DOM_COMMANDS,
  ...PAGE_INPUT_COMMANDS,
};

// CLI 命令实现

// -----------------------------------------------------------------------------
// wait.js handlers
// -----------------------------------------------------------------------------
/**
 * 等待 selector 出现。
 */
export async function cmd_waitSelector(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await waitSelector(targetId, selector, options);

  log.info(`Selector found: ${selector}`, options);

  return result;
}

/**
 * 等待元素可见。
 */
export async function cmd_waitVisible(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await waitVisible(targetId, selector, options);

  log.info(`Element visible: ${selector}`, options);

  return result;
}

/**
 * 等待元素可编辑。
 */
export async function cmd_waitEditable(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await waitEditable(targetId, selector, options);

  log.info(`Element editable: ${selector}`, options);

  return result;
}

/**
 * 等待元素可点击。
 */
export async function cmd_waitClickable(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await waitClickable(targetId, selector, options);

  log.info(`Element clickable: ${selector}`, options);

  return result;
}

/**
 * 等待元素文本满足匹配条件。
 */
export async function cmd_waitMatch(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector, pattern] = argv;

  const result = await waitMatch(
    targetId,
    selector,
    pattern,
    options,
  );

  log.info(`Text matched: ${pattern}`, options);

  return result;
}

/**
 * 等待页面就绪。
 */
export async function cmd_waitPage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await waitPage(targetId, options);

  log.info(`Page ready: ${targetId}`, options);

  return result;
}

// -----------------------------------------------------------------------------
// dom.js handlers
// -----------------------------------------------------------------------------
/**
 * 获取元素指定属性。
 */
export async function cmd_getElementAttribute(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector, name] = argv;

  const result = await getElementAttribute(
    targetId,
    selector,
    name,
    options,
  );

  log.info(`Element attribute ${name}: ${result}`, options);

  return result;
}

/**
 * 获取元素所有 attributes。
 */
export async function cmd_getElementAttributes(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await getElementAttributes(targetId, selector, options);

  log.info(
    `Element attributes:\n${JSON.stringify(result, null, 2)}`,
    options,
  );

  return result;
}

/**
 * 获取元素 outerHTML。
 */
export async function cmd_getElementOuterHTML(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await getElementOuterHTML(targetId, selector, options);

  log.info(`Element outerHTML:\n${result}`, options);

  return result;
}

/**
 * 获取元素 innerHTML。
 */
export async function cmd_getElementInnerHTML(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await getElementInnerHTML(targetId, selector, options);

  log.info(`Element innerHTML:\n${result}`, options);

  return result;
}

/**
 * 获取元素 innerText。
 */
export async function cmd_getElementInnerText(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await getElementInnerText(targetId, selector, options);

  log.info(`Element text:\n${result}`, options);

  return result;
}

/**
 * 获取元素位置和尺寸。
 */
export async function cmd_getElementBox(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await getElementBox(targetId, selector, options);

  log.info(
    `Element box:\n${JSON.stringify(result, null, 2)}`,
    options,
  );

  return result;
}

/**
 * 获取元素中心点。
 */
export async function cmd_getElementCenter(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await getElementCenter(targetId, selector, options);

  log.info(
    `Element center:\n${JSON.stringify(result, null, 2)}`,
    options,
  );

  return result;
}

// -----------------------------------------------------------------------------
// input.js handlers
// -----------------------------------------------------------------------------

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

  const result = await wheelAt(
    targetId,
    x,
    y,
    deltaX,
    deltaY,
    options,
  );

  log.info(`Wheel at (${x}, ${y}): deltaX=${deltaX}, deltaY=${deltaY}`, options);

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