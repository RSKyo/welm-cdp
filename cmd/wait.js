import { log } from "../infra/log.js";

import {
  waitAppear,
  waitDisappear,
  waitVisible,
  waitEditable,
  waitClickable,
  waitMatch,
  waitCount,
  waitCountGreater,
  waitPage,
} from "../cdp/wait.js";

const CONNECTION_OPTIONS = "--host --port";
const WAIT_OPTIONS = "--timeout --interval";

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
  appear: {
    handler: cmd_waitAppear,
    usage: "wait appear <targetId> <selector> [options]",
    description: "Wait until element exists",
    options: `--timeout --interval ${CONNECTION_OPTIONS}`,
  },

  disappear: {
    handler: cmd_waitDisappear,
    usage: "wait disappear <targetId> <selector> [options]",
    description: "Wait until element disappears",
    options: `${WAIT_OPTIONS} ${CONNECTION_OPTIONS}`,
  },

  visible: {
    handler: cmd_waitVisible,
    usage: "wait visible <targetId> <selector> [options]",
    description: "Wait until element is visible",
    options: `--timeout --interval ${CONNECTION_OPTIONS}`,
  },

  editable: {
    handler: cmd_waitEditable,
    usage: "wait editable <targetId> <selector> [options]",
    description: "Wait until element is editable",
    options: `--timeout --interval ${CONNECTION_OPTIONS}`,
  },

  clickable: {
    handler: cmd_waitClickable,
    usage: "wait clickable <targetId> <selector> [options]",
    description: "Wait until element is clickable",
    options: `--timeout --interval ${CONNECTION_OPTIONS}`,
  },

  match: {
    handler: cmd_waitMatch,
    usage: "wait match <targetId> <selector> <pattern> [options]",
    description: "Wait until element text matches pattern",
    options: `--mode --timeout --interval ${CONNECTION_OPTIONS}`,
  },

  count: {
    handler: cmd_waitCount,
    usage: "wait count <targetId> <selector> <count> [options]",
    description: "Wait until elements count equals value",
    options: `${WAIT_OPTIONS} ${CONNECTION_OPTIONS}`,
  },

  countGreater: {
    handler: cmd_waitCountGreater,
    usage: "wait countGreater <targetId> <selector> <count> [options]",
    description: "Wait until elements count is greater than value",
    options: `${WAIT_OPTIONS} ${CONNECTION_OPTIONS}`,
  },

  ready: {
    handler: cmd_waitPage,
    usage: "wait ready <targetId> [options]",
    description: "Wait until page is ready",
    options: `--timeout --interval ${CONNECTION_OPTIONS}`,
  },
};

/**
 * 等待 selector 出现。
 */
export async function cmd_waitAppear(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await waitAppear(targetId, selector, options);

  log.info(`Selector found: ${selector}`, options);

  return result;
}

/**
 * 等待 selector 消失。
 */
export async function cmd_waitDisappear(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  const result = await waitDisappear(targetId, selector, options);

  log.info(`Element disappeared: ${selector}`, options);

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
 * 等待元素数量等于指定值。
 */
export async function cmd_waitCount(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector, count] = argv;

  const result = await waitCount(targetId, selector, Number(count), options);

  log.info(`Elements count matched: ${selector} => ${count}`, options);

  return result;
}

/**
 * 等待元素数量大于指定值。
 */
export async function cmd_waitCountGreater(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector, count] = argv;

  const result = await waitCountGreater(
    targetId,
    selector,
    Number(count),
    options,
  );

  log.info(`Elements count greater than ${count}: ${selector}`, options);

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
