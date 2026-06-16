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

/**
 * Page CLI 命令注册表。
 *
 * wait.js:
 *   page has
 *   page visible
 *   page editable
 *   page clickable
 *   page match
 *   page ready
 *
 * dom.js:
 *   page attr
 *   page attrs
 *   page outerhtml
 *   page html
 *   page text
 *   page box
 *   page center
 */
export const PAGE_COMMANDS = {
  // wait.js
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

  // dom.js
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