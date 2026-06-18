// infra
import { DEFAULT_TIMEOUT, DEFAULT_INTERVAL } from "../infra/config.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { sleep } from "../infra/utils.js";
// cdp
import { getClient } from "./client.js";

/**
 * 在页面上下文中执行 JavaScript 表达式。
 *
 * targetId:
 *   CDP Target ID
 *
 * expression:
 *   在页面中执行的 JavaScript 表达式
 *
 * options:
 *   host  CDP Host
 *   port  CDP Port
 *
 * 返回：
 *   表达式执行结果
 */
export async function evaluate(targetId, expression, options = {}) {
  const client = await getClient(targetId, options);
  const { Runtime } = client;

  const { result, exceptionDetails } = await Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    const message =
      exceptionDetails.exception?.description ||
      exceptionDetails.text ||
      "expression threw an exception";

    throw createError(ERROR_CODE.EVALUATE_ERROR, message, {
      expression,
    });
  }

  if (!result) {
    throw createError(ERROR_CODE.EVALUATE_ERROR, "missing evaluation result");
  }

  if ("value" in result) {
    return result.value;
  }

  return result.description;
}

/**
 * 判断轮询结果是否命中。
 *
 * 命中规则：
 *   null       -> false
 *   undefined  -> false
 *   false      -> false
 *   ""         -> false
 *   其它值     -> true
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
 * 轮询执行表达式直到条件满足。
 *
 * targetId:
 *   CDP Target ID
 *
 * expression:
 *   在页面中执行的 JavaScript 表达式
 *
 * options:
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *   host     CDP Host
 *   port     CDP Port
 */
export async function poll(targetId, expression, options = {}) {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const interval = options.interval ?? DEFAULT_INTERVAL;
  const start = Date.now();
  let value;
  let times = 0;

  while (Date.now() - start < timeout) {
    value = await evaluate(targetId, expression, options);
    times++;

    if (isPollMatched(value)) {
      return { value, times };
    }

    await sleep(interval);
  }

  throw createError(ERROR_CODE.TIMEOUT, "poll condition not matched", {
    timeout,
    interval,
    elapsed: Date.now() - start,
  });
}

export async function readClipboard(targetId, options = {}) {
  const expression = `
    (async () => {
      return await navigator.clipboard.readText();
    })()
  `;

  return await evaluate(targetId, expression, options);
}

export async function writeClipboard(targetId, text, options = {}) {
  const expression = `
    (async () => {
      await navigator.clipboard.writeText(
        ${JSON.stringify(text)}
      );

      return true;
    })()
  `;

  return await evaluate(targetId, expression, options);
}
