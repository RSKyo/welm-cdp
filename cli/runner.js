// -----------------------------------------------------------------------------
// runner.js
// -----------------------------------------------------------------------------
// CLI 命令运行器。
//
// Public API:
// - run(commandGroups, runOptions)
//
// Responsibilities:
// - 解析 process.argv 中的命令、参数与选项。
// - 查找并执行对应的命令处理器。
// - 在 --json 模式下只输出最终 JSON 结果。
// - 在 --json 模式下自动静音命令执行过程中的日志。
// - 将抛出的值转换为 Error 对象。
// - 设置 process.exitCode。
// - 执行可选的清理函数。
//
// Version: 0.2.0
// Last updated: 2026-07-18
// -----------------------------------------------------------------------------

import { resolveCommand } from "./resolve.js";

const outputResult = process.argv.includes("--json");
const errorStack = process.argv.includes("--stack");

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

// 运行 CLI 命令。
// 自动解析 process.argv、执行对应命令，并在 --json 模式下输出最终 JSON 结果。
// JSON 模式会自动静音命令执行过程中的日志。
//
// @param {Record<string, Record<string, { handler: Function }>>} commandGroups
// 命令组注册表。
//
// @param {object} [runOptions={}]
//
// @param {Function} [runOptions.cleanup]
// 命令结束后始终执行的异步清理函数。
//
// @returns {Promise<void>}
export async function run(commandGroups, runOptions = {}) {
  try {
    const ctx = resolveCommand(process, commandGroups);

    // 框架协议：JSON 输出时，不允许过程日志混入结果。
    ctx.options.silent = outputResult || ctx.options.silent === true;

    const result = await ctx.handler(ctx);

    if (outputResult) {
      const okPayload = ok(result);
      const jsonString = json2string(okPayload, runOptions);
      writeLine(jsonString);
    }

    process.exitCode = 0;
  } catch (error) {
    const caughtError = toError(error);

    if (outputResult) {
      const failPayload = fail(caughtError);
      const jsonString = json2string(failPayload, runOptions);
      writeLine(jsonString);
    } else {
      writeError(caughtError);
    }

    process.exitCode = 1;
  } finally {
    await runOptions.cleanup?.();
  }
}

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

function ok(value = null) {
  return { ok: true, value };
}

function fail(error = null) {
  return { ok: false, error };
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

function json2string(payload, runOptions = {}) {
  const seen = new WeakSet();

  return JSON.stringify(payload, (_, v) => {
    // 处理 bigint
    if (typeof v === "bigint") {
      return String(v);
    }

    // 处理 Error
    if (v instanceof Error) {
      const result = {
        message: v.message || "unknown error",
      };

      if (errorStack && v.stack) {
        result.stack = v.stack;
      }

      return result;
    }

    // 处理循环引用
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) {
        return "[Circular]";
      }

      seen.add(v);
    }

    return v;
  });
}

function writeLine(text) {
  process.stdout.write(`${text}\n`);
}

function writeError(error) {
  process.stderr.write(`\x1b[31mERROR: ${error.message}\x1b[0m\n`);
}
