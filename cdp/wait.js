import { DEFAULT_TIMEOUT } from "../infra/config.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";
import { getClient } from "./client.js";
import { poll } from "./runtime.js";

function q(value) {
  return JSON.stringify(value);
}

/**
 * 等待 selector 出现。
 *
 * targetId:
 *   CDP Target ID
 *
 * selector:
 *   CSS Selector
 *
 * options:
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *   host     CDP Host
 *   port     CDP Port
 */
export function waitSelector(targetId, selector, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      return !!el;
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等待元素可见。
 *
 * 可见条件：
 *   display !== none
 *   visibility !== hidden
 *   opacity !== 0
 *   width > 0
 *   height > 0
 *
 * targetId:
 *   CDP Target ID
 *
 * selector:
 *   CSS Selector
 *
 * options:
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *   host     CDP Host
 *   port     CDP Port
 */
export function waitVisible(targetId, selector, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
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
 * 等待元素可编辑。
 *
 * 元素必须：
 *   已可见
 *   未 disabled
 *   未 readonly
 *
 * contenteditable 元素直接视为可编辑。
 *
 * targetId:
 *   CDP Target ID
 *
 * selector:
 *   CSS Selector
 *
 * options:
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *   host     CDP Host
 *   port     CDP Port
 */
export function waitEditable(targetId, selector, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
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
 * 等待元素可点击。
 *
 * 元素必须：
 *   已可见
 *   pointer-events !== none
 *   未 disabled
 *
 * targetId:
 *   CDP Target ID
 *
 * selector:
 *   CSS Selector
 *
 * options:
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *   host     CDP Host
 *   port     CDP Port
 */
export function waitClickable(targetId, selector, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
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
 * 等待元素文本满足条件。
 *
 * mode:
 *   includes
 *   equals
 *   regex
 *
 * targetId:
 *   CDP Target ID
 *
 * selector:
 *   CSS Selector
 *
 * pattern:
 *   匹配内容。
 *   includes 模式下表示文本片段；
 *   equals 模式下表示完整文本；
 *   regex 模式下表示正则表达式字符串。
 *
 * options:
 *   mode     includes (默认)|equals|regex
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *   host     CDP Host
 *   port     CDP Port
 */
export function waitMatch(targetId, selector, pattern, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  selector = assertNonBlank(selector, "selector");
  pattern = assertNonBlank(pattern, "pattern");

  const mode = ["includes", "equals", "regex"].includes(options.mode)
    ? options.mode
    : "includes";

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) return false;

      const text = (el.innerText ?? el.textContent ?? '').trim();
      const mode = ${q(mode)};
      const pattern = ${q(pattern)};

      if (mode === 'equals') {
        return text === pattern ? text : '';
      }

      if (mode === 'regex') {
        const re = new RegExp(pattern);
        return re.test(text) ? text : '';
      }

      return text.includes(pattern) ? text : '';
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等待一次 CDP Client Event 触发。
 *
 * eventName:
 *   事件名称
 *
 * options:
 *   timeout 最大等待时间(ms)
 */
function waitEmitterEvent(emitter, eventName, options = {}) {
  if (!emitter || typeof emitter.on !== "function") {
    throw createError(ERROR_CODE.INVALID, "invalid emitter");
  }

  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  const remove =
    typeof emitter.off === "function"
      ? emitter.off.bind(emitter)
      : typeof emitter.removeListener === "function"
        ? emitter.removeListener.bind(emitter)
        : null;

  if (!remove) {
    throw createError(ERROR_CODE.INVALID, "invalid emitter");
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      finish(
        reject,
        createError(ERROR_CODE.TIMEOUT, "event {eventName} wait timeout", null, {
          eventName,
        }),
      );
    }, timeout);

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
 * 等待页面加载完成。
 *
 * 流程：
 *   1. 等待页面离开 about:blank
 *   2. 启用 Page Domain
 *   3. 等待 Page.loadEventFired
 *
 * targetId:
 *   CDP Target ID
 *
 * options:
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *   host     CDP Host
 *   port     CDP Port
 */
export async function waitPage(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const client = await getClient(targetId, options);
  await client.Page.enable();

  await poll(targetId, "location.href !== 'about:blank'", options);
  await waitEmitterEvent(client, "Page.loadEventFired", options);
}
