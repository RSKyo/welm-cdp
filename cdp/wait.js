import { DEFAULT_TIMEOUT } from "../infra/config.js";
import { getClient } from "./client.js";
import { poll } from "./runtime.js";

function q(value) {
  return JSON.stringify(value);
}

function buildElementResolver(selector, options = {}) {
  return `
    (() => {
      const elements = document.querySelectorAll(${q(selector)});
      const count = elements.length;

      if (count === 0) {
        return null;
      }

      let index = ${options.nth ?? 0};

      if (index < 0) {
        index = count + index;
      }

      if (index < 0 || index >= count) {
        return null;
      }

      return elements[index];
    })()
  `;
}

/**
 * 等待 selector。
 */
export function waitElement(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      return !!el;
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等待 selector 出现。
 */
export function waitElementAppear(targetId, selector, options = {}) {
  return waitElement(targetId, selector, {
    ...options,

    matcher(value) {
      return value === true;
    },
  });
}

/**
 * 等待 selector 消失。
 */
export function waitElementDisappear(targetId, selector, options = {}) {
  return waitElement(targetId, selector, {
    ...options,

    matcher(value) {
      return value === false;
    },
  });
}

/**
 * 等待元素可见。
 */
export function waitVisible(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
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

  return poll(targetId, expression, {
    ...options,

    matcher(value) {
      return value === true;
    },
  });
}

/**
 * 等待元素可编辑。
 */
export function waitEditable(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
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

  return poll(targetId, expression, {
    ...options,

    matcher(value) {
      return value === true;
    },
  });
}

/**
 * 等待元素可点击。
 */
export function waitClickable(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0;

      const enabled =
        !el.disabled &&
        el.getAttribute('aria-disabled') !== 'true';

      return visible && enabled;
    })()
  `;

  return poll(targetId, expression, {
    ...options,

    matcher(value) {
      return value === true;
    },
  });
}

/**
 * 等待元素文本。
 */
export function waitText(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      if (!el) return '';

      return (el.innerText ?? el.textContent ?? '').trim();
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等待元素文本包含指定内容。
 */
export function waitTextIncludes(
  targetId,
  selector,
  expectedText,
  options = {},
) {
  return waitText(targetId, selector, {
    ...options,

    matcher(text) {
      return text.includes(expectedText);
    },
  });
}

/**
 * 等待元素文本完全匹配。
 */
export function waitTextEquals(targetId, selector, expectedText, options = {}) {
  return waitText(targetId, selector, {
    ...options,

    matcher(text) {
      return text === expectedText;
    },
  });
}

/**
 * 等待元素文本匹配正则表达式。
 */
export function waitTextRegex(targetId, selector, pattern, options = {}) {
  const re = new RegExp(pattern);

  return waitText(targetId, selector, {
    ...options,

    matcher(text) {
      return re.test(text);
    },
  });
}

/**
 * 等待元素数量。
 */
export function waitCount(targetId, selector, options = {}) {
  const expression = `
    (() => {
      return document.querySelectorAll(
        ${q(selector)}
      ).length;
    })()
  `;

  return poll(targetId, expression, options);
}

/**
 * 等待元素数量等于指定值。
 */
export function waitCountEquals(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitCount(targetId, selector, {
    ...options,

    matcher(count) {
      return count === expectedCount;
    },
  });
}

/**
 * 等待元素数量大于指定值。
 */
export function waitCountGreater(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitCount(targetId, selector, {
    ...options,

    matcher(count) {
      return count > expectedCount;
    },
  });
}

/**
 * 等待元素数量大于等于指定值。
 */
export function waitCountGreaterEquals(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitCount(targetId, selector, {
    ...options,

    matcher(count) {
      return count >= expectedCount;
    },
  });
}

/**
 * 等待元素数量小于指定值。
 */
export function waitCountLess(targetId, selector, expectedCount, options = {}) {
  return waitCount(targetId, selector, {
    ...options,

    matcher(count) {
      return count < expectedCount;
    },
  });
}

/**
 * 等待元素数量小于等于指定值。
 */
export function waitCountLessEquals(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitCount(targetId, selector, {
    ...options,

    matcher(count) {
      return count <= expectedCount;
    },
  });
}

/**
 * 等待元素数量不等于指定值。
 */
export function waitCountNotEquals(
  targetId,
  selector,
  expectedCount,
  options = {},
) {
  return waitCount(targetId, selector, {
    ...options,

    matcher(count) {
      return count !== expectedCount;
    },
  });
}

async function waitClientEvent(id, eventName, options = {}) {
  const timeout = 30000;
  const client = await getClient(id, options);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.off(eventName, onEvent);

      reject(new Error(`event ${eventName} timeout`));
    }, timeout);

    function onEvent(...args) {
      clearTimeout(timer);

      resolve(args.length <= 1 ? args[0] : args);
    }

    client.once(eventName, onEvent);
  });
}
