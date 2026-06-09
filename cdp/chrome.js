import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT,
  DEFAULT_INTERVAL,
} from "../infra/config.js";

import { log } from "../infra/log.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { toBool, sleep } from "../infra/utils.js";
import { assertNonBlank, assertHttpUrl } from "../infra/validate.js";

import {
  TARGET_TYPE,
  listTargets,
  getTarget,
  findTarget,
  activateTarget,
  openTarget,
  closeTarget,
} from "./target.js";
import { evaluate } from "./runtime.js";
import { waitDom, waitLoad } from "./wait.js";

function normalizePage(target) {
  return {
    id: target.id,
    title: target.title ?? "",
    url: target.url ?? "",
  };
}

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
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const chromeBin = await checkChromeBin(options.chromeBin ?? getChromeBin());
  const userDataDir = options.userDataDir ?? getChromeUserDataDir();

  if (!(await isCdpReady(options))) {
    log.progress(`Starting Chrome...`, options);
    await launchChrome(options);
    log.progress(`Waiting for Chrome CDP service...`, options);
    await waitCdpReady(options);
  }

  log.info(`Chrome is ready`, options);

  return {
    host,
    port,
    chromeBin,
    userDataDir,
  };
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
    return;
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
      return;
    }

    throw error;
  }
}

/**
 * 获取所有 Chrome 普通网页 target。
 */
export async function listChromePages(options = {}) {
  const targets = await listTargets({ ...options, type: TARGET_TYPE.WEBPAGE });

  return targets.map(normalizePage);
}

export async function getChromePage(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const target = await getTarget(targetId, {
    ...options,
    type: TARGET_TYPE.WEBPAGE,
  });

  return normalizePage(target);
}

export async function findChromePage(keyword, options = {}) {
  keyword = assertNonBlank(keyword, "keyword");

  const target = await findTarget(keyword, {
    ...options,
    type: TARGET_TYPE.WEBPAGE,
  });
  if (target) {
    return normalizePage(target);
  }

  return null;
}

export async function activateChromePage(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const target = await getTarget(targetId, {
    ...options,
    type: TARGET_TYPE.WEBPAGE,
  });
  await activateTarget(targetId, options);
  return normalizePage(target);
}

/**
 * 新建 Chrome 网页。
 */
export async function openChromePage(url, options = {}) {
  url = assertHttpUrl(url);

  const target = await openTarget(url, options);
  // 等待页面加载
  await waitChromePage(target.id, options);

  return normalizePage(target);
}

/**
 * 查找或打开 Chrome 网页。
 */
export async function ensureChromePage(url, options = {}) {
  url = assertHttpUrl(url);

  let target;
  const keyword = options.keyword ?? url;

  target = await findTarget(keyword, { ...options, type: TARGET_TYPE.WEBPAGE });

  if (target) {
    await activateTarget(target.id, options);
  } else {
    target = await openTarget(url, options);
    // 等待页面加载
    await waitChromePage(target.id, options);
  }

  return normalizePage(target);
}

/**
 * 关闭 Chrome 网页。
 */
export async function closeChromePage(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const target = await getTarget(targetId, {
    ...options,
    type: TARGET_TYPE.WEBPAGE,
  });
  await closeTarget(targetId, options);
  return normalizePage(target);
}
