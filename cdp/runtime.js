// -----------------------------------------------------------------------------
// cdp/runtime
// -----------------------------------------------------------------------------
// JavaScript evaluation and polling utilities based on the Runtime domain.
//
// Public API:
// - evaluate(targetId, expression, options)
// - poll(targetId, expression, options)
//
// Features:
// - Execute JavaScript expressions in a Chrome target.
// - Wait for promises returned by evaluated expressions.
// - Return evaluation results by value.
// - Convert Runtime exceptions to JavaScript errors.
// - Poll expressions until a matcher condition is satisfied.
// - Require consecutive matches before completing a poll.
// - Return polling values and execution statistics.
//
// Design:
// - CDP clients are obtained and reused through client.js.
// - Expressions are evaluated with returnByValue and awaitPromise enabled.
// - Runtime undefined values are returned as JavaScript undefined.
// - Poll matchers run in the Node.js context.
// - Consecutive match counts reset after a failed match.
// - Poll intervals never sleep beyond the remaining timeout.
// - Poll results include the matched value and evaluation count.
//
// Version: 0.1.5
// Last modified: 2026-07-17
// -----------------------------------------------------------------------------

import { getClient } from "./client.js";

const defaultPollTimeout = 30000; // 30 seconds
const defaultPollInterval = 500; // 0.5 seconds

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Evaluate a JavaScript expression in a Chrome target.
 *
 * Promises returned by the expression are awaited.
 * The result is returned by value whenever possible.
 *
 * @example
 * const title = await evaluate(
 *   targetId,
 *   "document.title"
 * );
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} expression
 * JavaScript expression to evaluate.
 *
 * @param {Object} [options]
 * Runtime and CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<*>}
 * Evaluated expression result.
 *
 * @throws {Error}
 * Throws if the expression raises an exception
 * or the Runtime result is missing.
 */
export async function evaluate(targetId, expression, options = {}) {
  const { Runtime } = await getClient(targetId, options);

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

    throw new Error(message);
  }

  if (!result) {
    throw new Error("missing evaluation result");
  }

  if (result.type === "undefined") {
    return undefined;
  }

  if ("value" in result) {
    return result.value;
  }

  return result.description;
}

/**
 * Poll a JavaScript expression until its result satisfies
 * the configured matcher condition.
 *
 * Successful matches must be consecutive. The condition can
 * require both a minimum number of consecutive matches and a
 * minimum continuous match duration. Any failed match resets
 * both the consecutive match count and match duration.
 *
 * @example
 * const result = await poll(
 *   targetId,
 *   "document.readyState",
 *   {
 *     matcher(value) {
 *       return value === "complete";
 *     },
 *     matchTimes: 3,
 *     matchDuration: 1000,
 *   },
 * );
 *
 * console.log(result.value);
 * console.log(result.times);
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} expression
 * JavaScript expression to evaluate repeatedly.
 *
 * @param {Object} [options]
 * Polling, Runtime, and CDP options.
 *
 * @param {number} [options.pollTimeout=30000]
 * Maximum polling duration, in milliseconds.
 * Must be a positive finite number.
 *
 * @param {number} [options.pollInterval=500]
 * Delay between evaluations, in milliseconds.
 * Must be a positive finite number.
 *
 * @param {(value: *) => boolean} [options.matcher]
 * Synchronous function used to test each evaluated value.
 * Uses the default matcher when omitted.
 *
 * @param {number} [options.matchTimes=1]
 * Required number of consecutive successful matches.
 * Must be a positive integer.
 *
 * @param {number} [options.matchDuration=0]
 * Minimum continuous match duration, in milliseconds.
 * The duration starts from the first successful match and
 * resets when a later evaluation does not match.
 * Must be a non-negative finite number.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<{value: *, times: number}>}
 * Polling result containing the final matched value and
 * total evaluation times.
 *
 * @throws {Error}
 * Throws if polling options are invalid, expression evaluation
 * fails, or the condition is not matched before the timeout.
 */
export async function poll(targetId, expression, options = {}) {
  const timeout = options.pollTimeout ?? defaultPollTimeout;
  const interval = options.pollInterval ?? defaultPollInterval;
  const matcher = options.matcher ?? defaultMatcher;
  const matchTimes = options.matchTimes ?? 1;
  const matchDuration = options.matchDuration ?? 0;

  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new Error("pollTimeout must be a positive finite number");
  }

  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error("pollInterval must be a positive finite number");
  }

  if (typeof matcher !== "function") {
    throw new Error("matcher must be a function");
  }

  if (!Number.isInteger(matchTimes) || matchTimes <= 0) {
    throw new Error("matchTimes must be a positive integer");
  }

  if (!Number.isFinite(matchDuration) || matchDuration < 0) {
    throw new Error("matchDuration must be a non-negative finite number");
  }

  const start = Date.now();

  let value;
  let times = 0;
  let matchedTimes = 0;
  let matchedStartTime = null;
  let matchedDuration = 0;

  while (Date.now() - start < timeout) {
    value = await evaluate(targetId, expression, options);
    times++;

    if (matcher(value)) {
      const matchedAt = Date.now();

      if (matchedTimes === 0) {
        matchedStartTime = matchedAt;
      }

      matchedDuration = matchedAt - matchedStartTime;
      matchedTimes++;

      if (matchedTimes >= matchTimes && matchedDuration >= matchDuration) {
        return {
          value,
          times,
        };
      }
    } else {
      matchedTimes = 0;
      matchedStartTime = null;
      matchedDuration = 0;
    }

    const remaining = timeout - (Date.now() - start);
    if (remaining <= 0) break;

    await sleep(Math.min(interval, remaining));
  }

  throw new Error(
    `poll condition not matched: timeout=${timeout}ms, interval=${interval}ms, elapsed=${Date.now() - start}ms`,
  );
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 判断轮询结果是否命中。
 *
 * 命中规则：
 *   null       -> false
 *   undefined  -> false
 *   false      -> false
 *   ""         -> false
 *   0          -> false
 *   其它值     -> true
 */
function defaultMatcher(value) {
  if (value == null) return false;

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  return true;
}
