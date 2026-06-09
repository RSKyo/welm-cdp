import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";
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
