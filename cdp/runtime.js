import { DEFAULT_TIMEOUT, DEFAULT_INTERVAL } from "../infra/config.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";
import { sleep } from "../infra/utils.js";
import { getClient } from "./client.js";


/**
 * 执行表达式（Runtime.evaluate）。
 */
export async function evaluate(targetId, expression, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  expression = assertNonBlank(expression, "expression");

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
export async function poll(targetId, expression, options = {}) {
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