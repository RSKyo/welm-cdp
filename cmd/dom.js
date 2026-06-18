import { log } from "../infra/log.js";

import {
  hasElement,
  getElementsCount,
  getElementAttribute,
  getElementAttributes,
  getElementOuterHTML,
  getElementInnerHTML,
  getElementInnerText,
  getElementBox,
  getElementCenter,
} from "../cdp/dom.js";

const CONNECTION_OPTIONS = "--host --port";

/**
 *   dom attr
 *   dom attrs
 *   dom outerhtml
 *   dom html
 *   dom text
 *   dom box
 *   dom center
 */
export const DOM_COMMANDS = {
  has: {
    handler: cmd_hasElement,
    usage: "dom has <targetId> <selector> [options]",
    description: "Check if element exists",
    options: `${CONNECTION_OPTIONS}`,
  },

  count: {
    handler: cmd_getElementsCount,
    usage: "dom count <targetId> <selector> [options]",
    description: "Get matching elements count",
    options: `${CONNECTION_OPTIONS}`,
  },

  attr: {
    handler: cmd_getElementAttribute,
    usage: "dom attr <targetId> <selector> <name> [options]",
    description: "Get element attribute",
    options: `${CONNECTION_OPTIONS}`,
  },

  attrs: {
    handler: cmd_getElementAttributes,
    usage: "dom attrs <targetId> <selector> [options]",
    description: "Get all element attributes",
    options: `${CONNECTION_OPTIONS}`,
  },

  outerhtml: {
    handler: cmd_getElementOuterHTML,
    usage: "dom outerhtml <targetId> <selector> [options]",
    description: "Get element outerHTML",
    options: `${CONNECTION_OPTIONS}`,
  },

  innerhtml: {
    handler: cmd_getElementInnerHTML,
    usage: "dom innerhtml <targetId> <selector> [options]",
    description: "Get element innerHTML",
    options: `${CONNECTION_OPTIONS}`,
  },

  text: {
    handler: cmd_getElementInnerText,
    usage: "dom text <targetId> <selector> [options]",
    description: "Get element text",
    options: `${CONNECTION_OPTIONS}`,
  },

  box: {
    handler: cmd_getElementBox,
    usage: "dom box <targetId> <selector> [options]",
    description: "Get element bounding box",
    options: `${CONNECTION_OPTIONS}`,
  },

  center: {
    handler: cmd_getElementCenter,
    usage: "dom center <targetId> <selector> [options]",
    description: "Get element center point",
    options: `${CONNECTION_OPTIONS}`,
  },
};

/**
 * 判断元素是否存在。
 */
export async function cmd_hasElement(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await hasElement(targetId, selector, options);

  log.info(`Element exists: ${selector} => ${result}`, options);

  return result;
}

/**
 * 获取匹配元素数量。
 */
export async function cmd_getElementsCount(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await getElementsCount(targetId, selector, options);

  log.info(`Elements count: ${selector} => ${result}`, options);

  return result;
}

/**
 * 获取元素指定属性。
 */
export async function cmd_getElementAttribute(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector, name] = argv;

  const result = await getElementAttribute(targetId, selector, name, options);

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

  log.info(`Element attributes:\n${JSON.stringify(result, null, 2)}`, options);

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

  log.info(`Element box:\n${JSON.stringify(result, null, 2)}`, options);

  return result;
}

/**
 * 获取元素中心点。
 */
export async function cmd_getElementCenter(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await getElementCenter(targetId, selector, options);

  log.info(`Element center:\n${JSON.stringify(result, null, 2)}`, options);

  return result;
}
