import { DEFAULT_TIMEOUT } from "../infra/config.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";
import { getClient } from "./client.js";
import { evaluate, poll } from "./runtime.js";

/**
 * 判断轮询结果是否命中。
 */

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
 * 等一次 Node EventEmitter 事件触发
 * 并不是 DOM Element
 */
function waitEmitterEvent(emitter, eventName, options = {}) {
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
      typeof emitter.off === "function"
        ? emitter.off.bind(emitter)
        : typeof emitter.removeListener === "function"
          ? emitter.removeListener.bind(emitter)
          : null;

    if (!remove) {
      throw createError(ERROR_CODE.INVALID, "invalid emitter");
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
 * 等待 DOM 树已构建完成
 * CDP 事件：Page.domContentEventFired
 * 此时 document.readyState 通常是 interactive
 */
export async function waitDom(targetId, options = {}) {
  const client = await getClient(targetId, options);

  await client.Page.enable();

  return waitEmitterEvent(client, "Page.domContentEventFired", options);
}

/**
 * 等待页面所有资源加载完成
 * CDP 事件：Page.loadEventFired
 * 此时 document.readyState 通常是 complete
 */
export async function waitLoad(targetId, options = {}) {
  const client = await getClient(targetId, options);

  await client.Page.enable();

  return waitEmitterEvent(client, "Page.loadEventFired", options);
}

// 开始导航
// ↓
// HTML 下载
// ↓
// HTML 解析
// ↓
// DOMContentLoaded
// ↓
// 图片、CSS、iframe、字体等继续加载
// ↓
// load
// ↓
// 页面完全加载

// 现代网站通常是 SPA 页面，页面加载完成后仍然会通过 Ajax请求渲染页面
// 这意味着 waitLoad 后，页面业务内容不一定出来
// 因此，更多常用的是 await waitSelector(...) 等 或直接 poll
