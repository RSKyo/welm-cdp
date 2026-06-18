import { evaluate } from "./runtime.js";
import { assertNonBlank } from "../infra/validate.js";
import { sleep } from "../infra/utils.js";
import { DEFAULT_TIMEOUT, DEFAULT_INTERVAL } from "../infra/config.js";
import { log } from "../infra/log.js";

function q(value) {
  return JSON.stringify(value);
}

/**
 * 观察元素 outerHTML 变化（diff logger）
 *
 * targetId:
 *   CDP target id
 *
 * selector:
 *   CSS selector
 *
 * options:
 *   interval 轮询间隔(ms)
 *   timeout  总观察时间(ms)
 *
 * 返回：
 *   变化记录数组
 */
export async function watchOuterHTML(targetId, selector, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  selector = assertNonBlank(selector, "selector");

  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const interval = options.interval ?? DEFAULT_INTERVAL;

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      return el ? el.outerHTML : "null";
    })()
  `;

  const start = Date.now();
  let last = null;

  const logs = [];

  while (Date.now() - start < timeout) {
    const value = await evaluate(targetId, expression, options);

    // 元素不存在
    if (last === null || value !== last) {
      last = value;
      log.info(Date.now());
      log.info(last);
    }

    await sleep(interval);
  }
}

// button[data-testid="send-button"]
// welm-cdp watch outerhtml 'AF92F15D434A36C3AF8CD8E1EC87429F' 'button[data-testid="send-button"]'