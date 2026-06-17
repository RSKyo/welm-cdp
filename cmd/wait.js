import { log } from "../infra/log.js";

import {
  waitSelector,
  waitVisible,
  waitEditable,
  waitClickable,
  waitMatch,
  waitPage,
} from "../cdp/wait.js";

const CLIENT_OPTIONS = "--host --port";

/**
 * wait.js:
 *   wait has
 *   wait visible
 *   wait editable
 *   wait clickable
 *   wait match
 *   wait ready
 */
export const WAIT_COMMANDS = {
  has: {
    handler: cmd_waitSelector,
    usage: "wait has <targetId> <selector> [options]",
    description: "Wait until element exists",
    options: `--timeout --interval ${CLIENT_OPTIONS}`,
  },

  visible: {
    handler: cmd_waitVisible,
    usage: "wait visible <targetId> <selector> [options]",
    description: "Wait until element is visible",
    options: `--timeout --interval ${CLIENT_OPTIONS}`,
  },

  editable: {
    handler: cmd_waitEditable,
    usage: "wait editable <targetId> <selector> [options]",
    description: "Wait until element is editable",
    options: `--timeout --interval ${CLIENT_OPTIONS}`,
  },

  clickable: {
    handler: cmd_waitClickable,
    usage: "wait clickable <targetId> <selector> [options]",
    description: "Wait until element is clickable",
    options: `--timeout --interval ${CLIENT_OPTIONS}`,
  },

  match: {
    handler: cmd_waitMatch,
    usage: "wait match <targetId> <selector> <pattern> [options]",
    description: "Wait until element text matches pattern",
    options: `--mode --timeout --interval ${CLIENT_OPTIONS}`,
  },

  ready: {
    handler: cmd_waitPage,
    usage: "wait ready <targetId> [options]",
    description: "Wait until page is ready",
    options: `--timeout --interval ${CLIENT_OPTIONS}`,
  },
};

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

  const result = await waitMatch(targetId, selector, pattern, options);

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