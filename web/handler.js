/**
 * -----------------------------------------------------------------------------
 * web/handler.js
 * -----------------------------------------------------------------------------
 * Express request handler utilities.
 *
 * Public API:
 * - withOptions(handler)
 *
 * Provides a wrapper for asynchronous route handlers that:
 * - extracts internal options from request query and body fields prefixed with "__";
 * - converts numeric and boolean option values to their corresponding types;
 * - forwards thrown or rejected values to Express error-handling middleware.
 *
 * Version: 0.1.1
 * Last modified: 2026-07-19
 */

const NUMBER_RE = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Wrap an asynchronous Express route handler.
 *
 * Internal request options are collected from req.query and req.body.
 * Only fields whose names begin with "__" are included, and the prefix
 * is removed before the options are passed to the handler.
 *
 * Numeric and boolean string values are converted automatically.
 * Any thrown or rejected value is normalized to an Error and forwarded
 * through next(error).
 *
 * @param {Function} handler
 * Asynchronous route handler called with:
 * (req, res, options).
 *
 * @returns {Function}
 * Express middleware function with the signature:
 * (req, res, next).
 */
export function withOptions(handler) {
  return async (req, res, next) => {
    try {
      const options = resolveOptions(req);

      await handler(req, res, options);
    } catch (error) {
      next(toError(error));
    }
  };
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function resolveOptions(req) {
  return {
    ...pickOptions(req.query),
    ...pickOptions(req.body),
  };
}

function pickOptions(input) {
  const options = {};

  if (!input || typeof input !== "object") {
    return options;
  }

  for (const [key, value] of Object.entries(input)) {
    if (!key.startsWith("__")) {
      continue;
    }

    const name = key.slice(2);

    if (!name) {
      continue;
    }

    options[name] = parseValue(value);
  }

  return options;
}

function parseValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  const text = value.trim();
  const lowerText = text.toLowerCase();

  if (NUMBER_RE.test(text)) {
    return Number(text);
  }

  if (lowerText === "true") {
    return true;
  }

  if (lowerText === "false") {
    return false;
  }

  return value;
}

function toError(error) {
  if (error instanceof Error) {
    return error;
  }

  if (error == null) {
    return new Error("unknown error");
  }

  if (
    typeof error === "object" &&
    typeof error.message === "string" &&
    error.message
  ) {
    return new Error(error.message);
  }

  try {
    return new Error(String(error) || "unknown error");
  } catch {
    return new Error("unknown error");
  }
}