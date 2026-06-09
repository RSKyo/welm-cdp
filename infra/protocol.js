import { ERROR_CODE, createError, isClientError } from "./error.js";

const PROTOCOL_ERROR_DEFAULTS = {
  includeStack: false,
};

/**
 * 判断是否为协议结果对象
 */
function isProtocolResult(x) {
  return (
    x !== null &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    typeof x.ok === "boolean" &&
    (x.ok ? "value" in x : "error" in x)
  );
}

function requireProtocolResult(x) {
  if (!isProtocolResult(x)) {
    throw createError(ERROR_CODE.INVALID, "invalid protocol result");
  }

  return x;
}

function normalizeProtocolError(error, options = {}) {
  const errorPayloadConfig = {
    ...PROTOCOL_ERROR_DEFAULTS,
    ...options,
  };

  const { includeStack } = errorPayloadConfig;

  if (isClientError(error)) {
    return {
      code: error.code || ERROR_CODE.INTERNAL,
      message: error.message || "unknown error",
      details: error.details ?? null,
      ...(includeStack && { stack: error.stack }),
    };
  }

  if (error instanceof Error) {
    return {
      code: ERROR_CODE.INTERNAL,
      message: error.message || "unknown error",
      details: null,
      ...(includeStack && { stack: error.stack }),
    };
  }

  if (error && typeof error === "object") {
    return {
      code: error.code ?? ERROR_CODE.INTERNAL,
      message: error.message ?? "unknown error",
      details: error.details ?? null,
    };
  }

  return {
    code: ERROR_CODE.INTERNAL,
    message: typeof error === "string" ? error : "unknown error",
    details: null,
  };
}

function writeProtocolJson(payload) {
  const seen = new WeakSet();

  const json = JSON.stringify(payload, (_, v) => {
    if (typeof v === "bigint") return String(v);

    if (isClientError(v) || v instanceof Error) {
      return normalizeProtocolError(v);
    }

    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
    }

    return v;
  });

  process.stdout.write(`${json}\n`);
}

/**
 * 构造成功结果
 */
export function ok(value = null, meta) {
  return meta === undefined ? { ok: true, value } : { ok: true, value, meta };
}

/**
 * 构造失败结果（自动标准化 error）
 */
export function fail(error = null, meta) {
  const err = normalizeProtocolError(error ?? "unknown error");

  return meta === undefined
    ? { ok: false, error: err }
    : { ok: false, error: err, meta };
}

/**
 * CLI 入口执行器：
 * - 执行 main
 * - 统一输出结果
 * - 捕获未处理异常并转为 fail
 */
export async function run(main, options = {}) {
  try {
    const result = requireProtocolResult(await main());

    if (options.json) {
      writeProtocolJson(result);
    }

    process.exitCode = 0;
  } catch (error) {
    const result = fail(error);

    if (options.json) {
      writeProtocolJson(result);
    }

    process.exitCode = 1;
  }
}

let lastLength = 0;

export function print(text = "", options = {}) {
  if (options?.json) {
    return;
  }

  if (lastLength > 0) {
    process.stdout.write("\n");
  }

  process.stdout.write(`${text}\n`);
  lastLength = 0;
}

export function printUpdate(text = "", options = {}) {
  if (options?.json) {
    return;
  }

  const padding = Math.max(0, lastLength - text.length);
  process.stdout.write(`\r${text}${" ".repeat(padding)}`);
  lastLength = text.length;
}

export function printDone(text = "", options = {}) {
  if (options?.json) {
    return;
  }

  const padding = Math.max(0, lastLength - text.length);
  process.stdout.write(`\r${text}${" ".repeat(padding)}\n`);
  lastLength = 0;
}
