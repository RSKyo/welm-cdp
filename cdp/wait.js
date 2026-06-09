import { DEFAULT_TIMEOUT, DEFAULT_INTERVAL } from "../infra/config.js";
import { sleep } from "../infra/utils.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { getClient } from "./client.js";
import { evaluate } from "./runtime.js";

/**
 * 判断轮询结果是否命中。
 */
function isPollMatched(value) {
  if (value == null) return false;

  if (value === false) return false;

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  return true;
}

/**
 * 轮询执行表达式，直到命中或超时。
 */
async function poll(targetId, expression, options = {}) {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const interval = options.interval ?? DEFAULT_INTERVAL;
  const start = Date.now();
  let value;

  while (Date.now() - start < timeout) {
    value = await evaluate(targetId, expression, options);

    if (isPollMatched(value)) {
      return value;
    }

    await sleep(interval);
  }

  throw createError(
    ERROR_CODE.TIMEOUT,
    "poll condition not matched",
    {
      timeout,
      interval,
      elapsed: Date.now() - start,
    },
  );
}

/**
 * 等 selector 出现。
 */
export function waitSelector(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      return !!el;
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等元素可见。
 */
export function waitVisible(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
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

  return poll(targetId, expression, options);
}

/**
 * 等元素可编辑。
 */
export function waitEditable(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0;

      if (!visible) return false;

      if (el.isContentEditable) {
        return true;
      }

      if (!("value" in el)) {
        return false;
      }

      return (
        !el.disabled &&
        !el.readOnly &&
        el.getAttribute('aria-disabled') !== 'true' &&
        el.getAttribute('aria-readonly') !== 'true'
      );
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等元素可点击。
 */
export function waitClickable(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        style.pointerEvents !== 'none' &&
        rect.width > 0 &&
        rect.height > 0;

      const enabled =
        !el.disabled &&
        el.getAttribute('aria-disabled') !== 'true';

      return visible && enabled;
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等元素文本满足条件。
 */
function waitTextByMode(targetId, selector, expectedText, mode, options = {}) {
  const expression = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;

      const text = (el.innerText ?? el.textContent ?? '').trim();
      const mode = ${JSON.stringify(mode)};
      const expected = ${JSON.stringify(expectedText)};

      if (mode === 'equals') {
        return text === expected ? text : '';
      }

      if (mode === 'regex') {
        const re = new RegExp(expected);
        return re.test(text) ? text : '';
      }

      return text.includes(expected) ? text : '';
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等元素文本包含。
 */
export function waitTextIncludes(
  targetId,
  selector,
  expectedText,
  options = {},
) {
  return waitTextByMode(targetId, selector, expectedText, "includes", options);
}

/**
 * 等元素文本一致。
 */
export function waitTextEquals(targetId, selector, expectedText, options = {}) {
  return waitTextByMode(targetId, selector, expectedText, "equals", options);
}

/**
 * 等元素文本正则匹配。
 */
export function waitTextRegex(targetId, selector, expectedText, options = {}) {
  return waitTextByMode(targetId, selector, expectedText, "regex", options);
}

/**
 * 等元素文本（默认 includes）。
 */
export function waitText(targetId, selector, expectedText, options = {}) {
  return waitTextByMode(
    targetId,
    selector,
    expectedText,
    options.mode || "includes",
    options,
  );
}

/**
 * 等某个 JS 表达式成立。
 */
export function waitJs(targetId, expression, options = {}) {
  return poll(targetId, expression, options);
}

/**
 * 等一次事件触发。
 */
function waitPageEvent(emitter, eventName, options = {}) {
  if (!emitter || typeof emitter.on !== "function") {
    throw createError(ERROR_CODE.INVALID, "invalid emitter");
  }

  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      finish(
        reject,
        createError(ERROR_CODE.TIMEOUT, "{eventName} wait timeout", null, {
          eventName,
        }),
      );
    }, timeout);

    const remove =
      emitter.off?.bind(emitter) ||
      emitter.removeListener?.bind(emitter);

    if (!remove) {
      throw createError(ERROR_CODE.INVALID, "emitter.off not supported");
    }

    function finish(done, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      remove(eventName, eventHandler);
      done(value);
    }

    function eventHandler(...args) {
      finish(resolve, args.length <= 1 ? args[0] : args);
    }

    emitter.on(eventName, eventHandler);
  });
}

/**
 * 等发生一次主导航。
 */
export async function waitNavigation(targetId, options = {}) {
  const { Page } = await getClient(targetId, options);
  await Page.enable();

  return waitPageEvent(Page, "frameNavigated", options);
}

/**
 * 等 DOMContentLoaded。
 */
export async function waitDom(targetId, options = {}) {
  const { Page } = await getClient(targetId, options);
  await Page.enable();

  return waitPageEvent(Page, "domContentEventFired", options);
}

/**
 * 等 load 事件。
 */
export async function waitLoad(targetId, options = {}) {
  const { Page } = await getClient(targetId, options);
  await Page.enable();

  return waitPageEvent(Page, "loadEventFired", options);
}