import { log } from "../infra/log.js";

import {
  getElementAttribute,
  getElementAttributes,
  getElementOuterHTML,
  getElementInnerHTML,
  getElementInnerText,
  getElementBox,
  getElementCenter,
} from "../cdp/dom.js";

const CLIENT_OPTIONS = "--host --port";

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
  attr: {
    handler: cmd_getElementAttribute,
    usage: "dom attr <targetId> <selector> <name> [options]",
    description: "Get element attribute",
    options: `${CLIENT_OPTIONS}`,
  },

  attrs: {
    handler: cmd_getElementAttributes,
    usage: "dom attrs <targetId> <selector> [options]",
    description: "Get all element attributes",
    options: `${CLIENT_OPTIONS}`,
  },

  outerhtml: {
    handler: cmd_getElementOuterHTML,
    usage: "dom outerhtml <targetId> <selector> [options]",
    description: "Get element outerHTML",
    options: `${CLIENT_OPTIONS}`,
  },

  html: {
    handler: cmd_getElementInnerHTML,
    usage: "dom html <targetId> <selector> [options]",
    description: "Get element innerHTML",
    options: `${CLIENT_OPTIONS}`,
  },

  text: {
    handler: cmd_getElementInnerText,
    usage: "dom text <targetId> <selector> [options]",
    description: "Get element text",
    options: `${CLIENT_OPTIONS}`,
  },

  box: {
    handler: cmd_getElementBox,
    usage: "dom box <targetId> <selector> [options]",
    description: "Get element bounding box",
    options: `${CLIENT_OPTIONS}`,
  },

  center: {
    handler: cmd_getElementCenter,
    usage: "dom center <targetId> <selector> [options]",
    description: "Get element center point",
    options: `${CLIENT_OPTIONS}`,
  },
};

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