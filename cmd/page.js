import { log } from "../infra/log.js";
import {
  waitSelector,
  waitVisible,
  waitEditable,
  waitClickable,
  waitText,
  waitPage,
} from "../cdp/wait.js";

/**
 * Wait CLI 命令注册表。
 *
 * wait selector
 * wait visible
 * wait editable
 * wait clickable
 * wait text
 * wait page
 */
const WAIT_COMMANDS = {
  selector: {
    handler: cmd_waitSelector,
    usage: "wait selector <targetId> <selector> [options]",
    description: "Wait for selector exists",
    options: "--timeout --interval --host --port",
  },

  visible: {
    handler: cmd_waitVisible,
    usage: "wait visible <targetId> <selector> [options]",
    description: "Wait for element visible",
    options: "--timeout --interval --host --port",
  },

  editable: {
    handler: cmd_waitEditable,
    usage: "wait editable <targetId> <selector> [options]",
    description: "Wait for element editable",
    options: "--timeout --interval --host --port",
  },

  clickable: {
    handler: cmd_waitClickable,
    usage: "wait clickable <targetId> <selector> [options]",
    description: "Wait for element clickable",
    options: "--timeout --interval --host --port",
  },

  text: {
    handler: cmd_waitText,
    usage: "wait text <targetId> <selector> <expectedText> [options]",
    description: "Wait for text match",
    options: "--mode --timeout --interval --host --port",
  },

  page: {
    handler: cmd_waitPage,
    usage: "wait page <targetId> [options]",
    description: "Wait for page load",
    options: "--timeout --interval --host --port",
  },
};

export const PAGE_COMMANDS = {
    ...WAIT_COMMANDS,
}

// CLI 命令实现

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
 * 等待文本满足条件。
 */
export async function cmd_waitText(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector, expectedText] = argv;

  const result = await waitText(
    targetId,
    selector,
    expectedText,
    options,
  );

  log.info(`Text matched: ${expectedText}`, options);

  return result;
}

/**
 * 等待页面加载完成。
 */
export async function cmd_waitPage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await waitPage(targetId, options);

  log.info(`Page loaded: ${targetId}`, options);

  return result;
}