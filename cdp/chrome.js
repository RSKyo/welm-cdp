import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT,
  DEFAULT_INTERVAL,
} from "../infra/config.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { toBool, sleep } from "../infra/utils.js";
import { assertNonBlank, assertHttpUrl } from "../infra/validate.js";

import {
  listWebPageTargets,
  createTarget,
  activateTarget,
  closeTarget,
} from "./target.js";
import { evaluate } from "./runtime.js";
import { waitDom, waitLoad } from "./wait.js";

/**
 * 获取当前平台默认的 Chrome 可执行文件路径。
 */
function getChromeBin() {
  return (
    process.env.CHROME_BIN ||
    {
      darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      linux: "google-chrome",
      win32: "chrome.exe",
    }[process.platform]
  );
}

/**
 * 检查 Chrome 可执行文件是否存在。
 */
async function checkChromeBin(chromeBin = getChromeBin()) {
  if (process.platform === "linux" || process.platform === "win32") {
    return chromeBin;
  }

  try {
    await access(chromeBin, constants.X_OK);
    return chromeBin;
  } catch {
    throw createError(ERROR_CODE.NOT_FOUND, "chrome executable not found", {
      chromeBin,
    });
  }
}

/**
 * 获取 Chrome 独立调试用户数据目录。
 */
function getChromeUserDataDir() {
  return (
    process.env.CHROME_USER_DATA_DIR ||
    `${process.env.HOME}/.local/share/welmcli/chrome-cdp-profile`
  );
}

/**
 * 检查 CDP 服务是否可访问。
 */
async function isCdpReady(options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  try {
    const res = await fetch(`http://${host}:${port}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 等待 CDP 服务就绪。
 */
async function waitCdpReady(options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const interval = options.interval ?? DEFAULT_INTERVAL;

  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await isCdpReady({ host, port })) {
      return true;
    }

    await sleep(interval);
  }

  throw createError(ERROR_CODE.TIMEOUT, "CDP service not ready", {
    host,
    port,
    timeout,
    interval,
  });
}

/**
 * 获取默认 Chrome 调试配置信息。
 */
export function getDebuggingInfo() {
  return {
    chromeBin: getChromeBin(),
    userDataDir: getChromeUserDataDir(),
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
  };
}

/**
 * 启动带 CDP 调试端口的 Chrome。
 */
async function launchChrome(options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  const chromeBin = await checkChromeBin(options.chromeBin ?? getChromeBin());
  const userDataDir = options.userDataDir ?? getChromeUserDataDir();

  const args = [
    `--remote-debugging-address=${host}`,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
  ];

  const child = spawn(chromeBin, args, {
    detached: true,
    stdio: "ignore",
  });

  child.unref();

  return true;
}

/**
 * 确保 Chrome 已启动，并等待 CDP 服务可访问。
 */
export async function ensureChrome(options = {}) {
  if (!(await isCdpReady(options))) {
    await launchChrome(options);
    await waitCdpReady(options);
  }

  return true;
}

/**
 * 确保 targetId 对应的页面仍然存在，否则抛错
 */
async function assertTargetExists(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const targets = await listChromePages(options);
  const exists = targets.some((t) => t.id === targetId);
  if (!exists) {
    throw createError(
      ERROR_CODE.NOT_FOUND,
      "chrome page not found or already closed",
      { targetId },
    );
  }
}

/**
 * 判断是否属于页面初始化阶段的临时 evaluate 错误。
 */
function isPageNotReadyError(error) {
  const message = String(
    error?.message || error?.error?.message || error,
  ).toLowerCase();

  return (
    message.includes("execution context") || // 执行上下文相关错误，通常页面未初始化完成
    message.includes("context was destroyed") || // 上下文已销毁，通常页面重导航或未初始化完成
    message.includes("cannot find context") || // 无法找到上下文，通常页面未初始化完成
    message.includes("document is not defined") || // 页面上下文未准备好，document 对象不存在
    message.includes("frame was detached") // 页面 frame 被移除，通常页面重导航或未初始化完成
  );
}

/**
 * 获取页面当前加载状态；页面上下文尚未准备好时视为 loading。
 */
async function getPageReadyState(targetId, options = {}) {
  try {
    return await evaluate(targetId, "document.readyState", options);
  } catch (error) {
    if (isPageNotReadyError(error)) {
      return "loading";
    }

    throw error;
  }
}

/**
 * 判断页面是否已达到指定加载状态。
 */
function isPageReady(readyState, mode) {
  if (mode === "dom") {
    return readyState === "interactive" || readyState === "complete";
  }

  if (mode === "load") {
    return readyState === "complete";
  }

  throw createError(ERROR_CODE.INVALID, "invalid wait mode", {
    wait: mode,
  });
}

/**
 * 等待 Chrome 网页达到指定状态。
 */
async function waitChromePage(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const mode = options.wait ?? "load";
  const readyState = await getPageReadyState(targetId, options);

  if (isPageReady(readyState, mode)) {
    return targetId;
  }

  try {
    if (mode === "dom") {
      await waitDom(targetId, options);
    } else if (mode === "load") {
      await waitLoad(targetId, options);
    } else {
      throw createError(ERROR_CODE.INVALID, "invalid wait mode", {
        wait: mode,
      });
    }
  } catch (error) {
    const currentReadyState = await getPageReadyState(targetId, options);

    if (isPageReady(currentReadyState, mode)) {
      return targetId;
    }

    throw error;
  }

  return targetId;
}

/**
 * 获取所有 Chrome 普通网页 target。
 */
export async function listChromePages(options = {}) {
  await ensureChrome(options);

  return listWebPageTargets(options);
}

/**
 * 查找 Chrome 网页并返回 targetId；找不到抛错
 */
export async function findChromePage(keyword, options = {}) {
  keyword = assertNonBlank(keyword, "keyword");
  await ensureChrome(options);

  const targets = await listChromePages(options);

  const target = targets.find(
    (target) => target.title.includes(keyword) || target.url.includes(keyword),
  );

  if (!target) {
    throw createError(ERROR_CODE.NOT_FOUND, "chrome page not found", {
      keyword,
    });
  }

  if (toBool(options.activate) === true) {
    await activateTarget(target.id, options);
  }

  return target.id;
}

/**
 * 激活 Chrome 网页。
 */
export async function activateChromePage(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  await ensureChrome(options);
  await assertTargetExists(targetId, options);

  await activateTarget(targetId, options);

  return targetId;
}

/**
 * 新建 Chrome 网页。
 */
export async function openChromePage(url, options = {}) {
  url = assertHttpUrl(url);
  await ensureChrome(options);

  const target = await createTarget(url, options);

  await waitChromePage(target.id, options);

  return target.id;
}

/**
 * 查找或打开 Chrome 网页。
 */
export async function ensureChromePage(url, options = {}) {
  url = assertHttpUrl(url);
  await ensureChrome(options);

  try {
    const targetId = await findChromePage(options.keyword ?? url, options);

    // 已找到页面，激活并等待加载完成
    await activateChromePage(targetId, options);
    await waitChromePage(targetId, options);

    return targetId;
  } catch (error) {
    if (error.code !== ERROR_CODE.NOT_FOUND) throw error;

    return await openChromePage(url, options);
  }
}

/**
 * 关闭 Chrome 网页。
 */
export async function closeChromePage(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");
  await ensureChrome(options);
  await assertTargetExists(targetId, options);

  await closeTarget(targetId, options);

  return true;
}
