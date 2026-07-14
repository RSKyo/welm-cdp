// -----------------------------------------------------------------------------
// cdp/chrome
// -----------------------------------------------------------------------------
// Chrome process and page management utilities based on CDP.
//
// Public API:
// - ensureChrome(options)
// - isChromeReady(options)
//
// - listChromePages(options)
// - findChromePage(keyword, options)
// - findChromePages(keywords, options)
// - activateChromePage(keyword, options)
// - reloadChromePage(keyword, options)
// - openChromePage(url, options)
// - ensureChromePage(url, options)
// - closeChromePage(keywords, options)
//
// Features:
// - Check and launch Chrome with a remote debugging port.
// - Wait for the Chrome CDP service to become available.
// - List, find, activate, reload, open, and close Chrome pages.
// - Filter Chrome targets by target type.
// - Find one or more pages by target ID, title, or URL keywords.
// - Activate or reload the first page matching a keyword.
// - Close all pages matching any keyword.
// - Wait for newly opened or reloaded pages to become ready.
// - Support configurable CDP host, port, profile, and timeout options.
//
// Design:
// - Chrome runs as a detached process with a dedicated user data directory.
// - Page targets are normalized to targetId, type, title, and url.
// - Target ID matching is exact and case-insensitive.
// - Title and URL matching is partial and case-insensitive.
// - Opening a page accepts only HTTP and HTTPS URLs.
// - A page is ready when document.readyState is interactive or complete.
// - Temporary CDP clients are always closed after use.
// - Public methods return normalized Chrome or page information.
//
// Version: 0.2.0
// Last modified: 2026-07-15
// -----------------------------------------------------------------------------

import CDP from "chrome-remote-interface";
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import nodePath from "node:path";

import {
  getCdpOptions,
  listTargets,
  getTarget,
  findTargets,
  findTarget,
  activateTarget,
  reloadTarget,
  openTarget,
  closeTarget,
} from "./target.js";

const defaultUserDataDir = `${process.env.HOME}/.local/share/welm/chrome-profile`;

const defaultChromeBinDarwin =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const defaultChromeBinLinux = "google-chrome"; // need absolute path, e.g. /usr/bin/google-chrome
const defaultChromeBinWin32 = "chrome.exe"; // need absolute path, e.g. C:\Program Files\Google\Chrome\Application\chrome.exe

const defaultChromeReadyTimeout = 15000;
const defaultChromeReadyInterval = 200;
const defaultPageReadyTimeout = 30000;
const defaultPageReadyInterval = 200;

// -----------------------------------------------------------------------------
// Public API: Chrome
// -----------------------------------------------------------------------------

/**
 * Check whether the Chrome CDP service is available.
 *
 * @example
 * const ready = await isChromeReady();
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<boolean>}
 * Returns true if the Chrome CDP service is available.
 */
export async function isChromeReady(options = {}) {
  const { host, port } = getCdpOptions(options);

  try {
    const res = await fetch(`http://${host}:${port}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ensure that the Chrome CDP service is available.
 *
 * If the CDP service is not available, Chrome is launched
 * and the method waits until the service becomes ready.
 *
 * @example
 * const chrome = await ensureChrome({
 *   cdpPort: 9222,
 * });
 *
 * @param {Object} [options]
 * Chrome options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Chrome target type.
 *
 * @param {string} [options.userDataDir]
 * Chrome user data directory.
 *
 * @param {string} [options.chromeBin]
 * Chrome executable path.
 *
 * @param {number} [options.chromeReadyTimeout=15000]
 * Maximum time to wait for the Chrome CDP service, in milliseconds.
 *
 * @param {number} [options.chromeReadyInterval=200]
 * Chrome CDP service polling interval, in milliseconds.
 *
 * @param {Object} [options.reporter]
 * Progress reporter.
 *
 * @returns {Promise<Object>}
 * Chrome information.
 * The launched field indicates whether Chrome was started by this call.
 */
export async function ensureChrome(options = {}) {
  let launchInfo;

  if (!(await isChromeReady(options))) {
    const startTime = Date.now();

    options.reporter?.progress?.(`Starting Chrome...`, options);
    launchInfo = await launchChrome(options);

    options.reporter?.progress?.(`Waiting for Chrome CDP service...`, options);
    await waitChromeReady(options);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    options.reporter?.progressDone?.(`Chrome is ready (${elapsed}s)`, options);

    return launchInfo;
  }

  return normalizeChromeInfo(false, options);
}

// -----------------------------------------------------------------------------
// Public API: Chrome Page
// -----------------------------------------------------------------------------

/**
 * List Chrome pages.
 *
 * By default, only targets with type "page" are returned.
 *
 * @example
 * const pages = await listChromePages();
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @returns {Promise<Object[]>}
 * Normalized Chrome page targets.
 */
export async function listChromePages(options = {}) {
  return await listTargets(options);
}

/**
 * Find the first Chrome page matching a keyword.
 *
 * A target ID is matched exactly.
 * Title and URL keywords use partial matching.
 * Matching is case-insensitive.
 *
 * @example
 * const page = await findChromePage("example");
 *
 * @param {string} keyword
 * Target ID, title, or URL keyword.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @param {boolean} [options.throwIfNotFound=true]
 * Throw an error if no page matches.
 *
 * @returns {Promise<Object|null>}
 * First matching Chrome page.
 * Returns null when no page matches and throwIfNotFound is false.
 *
 * @throws {Error}
 * Throws if no page matches and throwIfNotFound is true.
 */
export async function findChromePage(keyword, options = {}) {
  return await findTarget(keyword, options);
}

/**
 * Find Chrome pages matching one or more keywords.
 *
 * A target ID is matched exactly.
 * Title and URL keywords use partial matching.
 * Matching is case-insensitive.
 * A page is returned if it matches any keyword.
 *
 * @example
 * const pages = await findChromePages([
 *   "example",
 *   "localhost",
 * ]);
 *
 * @param {string|string[]} keywords
 * Target ID, title, or URL keywords.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @returns {Promise<Object[]>}
 * Matching Chrome pages.
 */
export async function findChromePages(keywords, options = {}) {
  return await findTargets(keywords, options);
}

/**
 * Activate the first Chrome page matching a keyword.
 *
 * The keyword is matched case-insensitively against
 * the target ID, title, and URL.
 *
 * @example
 * const page = await activateChromePage("example");
 *
 * @param {string} keyword
 * Target ID, title, or URL keyword.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type used when retrieving the activated page.
 *
 * @returns {Promise<Object>}
 * Activated Chrome page.
 *
 * @throws {Error}
 * Throws if no page matches.
 */
export async function activateChromePage(keyword, options = {}) {
  const target = await findTarget(keyword, options);

  await activateTarget(target.targetId, options);

  return target;
}

/**
 * Reload the first Chrome page matching a keyword.
 *
 * The keyword is matched case-insensitively against
 * the target ID, title, and URL.
 * The page is reloaded without using the cache.
 * The method waits until the page becomes ready
 * and then returns the latest page information.
 *
 * @example
 * const page = await reloadChromePage("example");
 *
 * @param {string} keyword
 * Target ID, title, or URL keyword.
 *
 * @param {Object} [options]
 * Reload options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type used when retrieving the reloaded page.
 *
 * @param {number} [options.pageReadyTimeout=30000]
 * Maximum time to wait for the page, in milliseconds.
 *
 * @param {number} [options.pageReadyInterval=200]
 * Page readiness polling interval, in milliseconds.
 *
 * @param {Object} [options.reporter]
 * Progress reporter.
 *
 * @returns {Promise<Object>}
 * Reloaded Chrome page.
 *
 * @throws {Error}
 * Throws if no page matches.
 */
export async function reloadChromePage(keyword, options = {}) {
  let target = await findTarget(keyword, options);

  const startTime = Date.now();

  options.reporter?.progress?.("Reloading page...", options);

  await reloadTarget(target.targetId, options);

  options.reporter?.progress?.("Waiting for page...", options);

  await waitPageReady(target.targetId, options);

  target = await getTarget(target.targetId, options);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  options.reporter?.progressDone?.(
    `Page reloaded (${elapsed}s) ${target.url}`,
    options,
  );

  return target;
}

/**
 * Open a new Chrome page.
 *
 * The method waits until the page leaves about:blank
 * and document.readyState becomes interactive or complete.
 *
 * @example
 * const page = await openChromePage(
 *   "https://example.com"
 * );
 *
 * @param {string} url
 * HTTP or HTTPS URL to open.
 *
 * @param {Object} [options]
 * Open options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type used when retrieving the opened page.
 *
 * @param {number} [options.pageReadyTimeout=30000]
 * Maximum time to wait for the page, in milliseconds.
 *
 * @param {number} [options.pageReadyInterval=200]
 * Page readiness polling interval, in milliseconds.
 *
 * @param {Object} [options.reporter]
 * Progress reporter.
 *
 * @returns {Promise<Object>}
 * Opened Chrome page.
 *
 * @throws {Error}
 * Throws if url is not a valid HTTP or HTTPS URL.
 */
export async function openChromePage(url, options = {}) {
  assertHttpUrl(url);

  const startTime = Date.now();

  options.reporter?.progress?.("Opening page...", options);

  let target = await openTarget(url, options);

  options.reporter?.progress?.("Waiting for page...", options);

  await waitPageReady(target.targetId, options);

  target = await getTarget(target.targetId, options);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  options.reporter?.progressDone?.(`Page is ready (${elapsed}s)`, options);

  return target;
}

/**
 * Ensure that a Chrome page exists.
 *
 * The URL is used as a case-insensitive search keyword.
 * The first matching page is returned.
 * If no page matches, a new page is opened.
 *
 * @example
 * const page = await ensureChromePage(
 *   "https://example.com"
 * );
 *
 * @param {string} url
 * URL to find or open.
 *
 * @param {Object} [options]
 * Page options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @param {number} [options.pageReadyTimeout=30000]
 * Maximum time to wait when opening a new page, in milliseconds.
 *
 * @param {number} [options.pageReadyInterval=200]
 * Page readiness polling interval, in milliseconds.
 *
 * @param {Object} [options.reporter]
 * Progress reporter used when opening a new page.
 *
 * @returns {Promise<Object>}
 * Existing or newly opened Chrome page.
 *
 * @throws {Error}
 * Throws if url is not a valid HTTP or HTTPS URL.
 */
export async function ensureChromePage(url, options = {}) {
  const target = await findTarget(url, { ...options, throwIfNotFound: false });

  if (target) {
    return target;
  }

  return await openChromePage(url, options);
}

/**
 * Close all Chrome pages matching one or more keywords.
 *
 * A target ID is matched exactly.
 * Title and URL keywords use partial matching.
 * Matching is case-insensitive.
 *
 * @example
 * await closeChromePage([
 *   "example",
 *   "localhost",
 * ]);
 *
 * @param {string|string[]} keywords
 * Target ID, title, or URL keywords.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @returns {Promise<boolean>}
 * Returns true after all matching pages have been closed.
 */
export async function closeChromePage(keywords, options = {}) {
  const targets = await findTargets(keywords, options);

  for (const { targetId } of targets) {
    await closeTarget(targetId, options);
  }

  return true;
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function assertHttpUrl(url) {
  const parsedUrl = parseUrl(url);

  if (
    !parsedUrl ||
    (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:")
  ) {
    throw new Error(`invalid URL: ${url}`);
  }

  return url;
}

function normalizeChromeInfo(launched = false, options = {}) {
  const { host, port, targetType } = getCdpOptions(options);
  const userDataDir = options.userDataDir ?? defaultUserDataDir;
  const chromeBin = getChromeBin(options);

  return {
    host,
    port,
    targetType,
    userDataDir,
    chromeBin,
    launched,
  };
}

// -----------------------------------------------------------------------------
// Private Helpers: Chrome Lifecycle
// -----------------------------------------------------------------------------

/**
 * 获取当前平台默认的 Chrome 可执行文件路径。
 */
function getChromeBin(options = {}) {
  return (
    options.chromeBin ||
    process.env.CHROME_BIN ||
    {
      darwin: defaultChromeBinDarwin,
      linux: defaultChromeBinLinux,
      win32: defaultChromeBinWin32,
    }[process.platform]
  );
}

/**
 * 检查 Chrome 可执行文件是否存在。
 */
async function checkChromeBin(chromeBin) {
  // access() checks file or directory accessibility.
  // F_OK checks whether the path exists (darwin/linux/win32).
  // X_OK checks executable permission (Unix-like only, not win32).

  try {
    await access(chromeBin, constants.F_OK);
  } catch {
    throw new Error(`chrome executable not found: ${chromeBin}`);
  }

  if (process.platform === "win32") {
    if (nodePath.extname(chromeBin).toLowerCase() !== ".exe") {
      throw new Error(`invalid chrome executable: ${chromeBin}`);
    }
  } else {
    try {
      await access(chromeBin, constants.X_OK);
    } catch {
      throw new Error(`chrome executable is not executable: ${chromeBin}`);
    }
  }

  return chromeBin;
}

/**
 * 等待 CDP 服务就绪。
 */
async function waitChromeReady(options = {}) {
  const timeout = options.chromeReadyTimeout ?? defaultChromeReadyTimeout;
  const interval = options.chromeReadyInterval ?? defaultChromeReadyInterval;

  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await isChromeReady(options)) {
      return;
    }

    await sleep(interval);
  }

  throw new Error(`Chrome CDP service not ready after ${timeout}ms`);
}

/**
 * 启动带 CDP 调试端口的 Chrome。
 */
async function launchChrome(options = {}) {
  const { host, port } = getCdpOptions(options);
  const userDataDir = options.userDataDir ?? defaultUserDataDir;
  const chromeBin = await checkChromeBin(getChromeBin(options));

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

  return normalizeChromeInfo(true, options);
}

/**
 * 等待页面离开 about:blank。
 *
 * Chrome 创建页面后会先生成 about:blank。
 * 真正导航到目标 URL 是异步过程。
 *
 * 本方法仅表示导航开始，
 * 不表示页面已加载完成。
 */
async function waitLeaveAboutBlank(targetId, options = {}) {
  const timeout = 2000;
  const interval = 50;

  const start = Date.now();

  while (Date.now() - start < timeout) {
    const target = await getTarget(targetId, options);

    if (target.url !== "about:blank") {
      return;
    }

    const remaining = timeout - (Date.now() - start);
    if (remaining <= 0) break;

    await sleep(Math.min(interval, remaining));
  }

  throw new Error(
    `leave about:blank timeout: targetId=${targetId}, timeout=${timeout}ms`,
  );
}

/**
 * Wait for the page to become ready.
 *
 * First wait for the page to leave about:blank,
 * then poll document.readyState.
 *
 * The page is considered ready when the state
 * becomes interactive or complete.
 */
async function waitPageReady(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);
  const timeout = options.pageReadyTimeout ?? defaultPageReadyTimeout;
  const interval = options.pageReadyInterval ?? defaultPageReadyInterval;

  const client = await CDP({
    host,
    port,
    target: targetId,
  });

  try {
    await waitLeaveAboutBlank(targetId, options);

    const start = Date.now();

    while (Date.now() - start < timeout) {
      const result = await client.Runtime.evaluate({
        expression: "document.readyState",
        returnByValue: true,
      });

      const readyState = result.result?.value;

      if (readyState === "interactive" || readyState === "complete") {
        return;
      }

      const remaining = timeout - (Date.now() - start);
      if (remaining <= 0) break;

      await sleep(Math.min(interval, remaining));
    }

    throw new Error(
      `Page ready timeout: targetId=${targetId}, timeout=${timeout}ms`,
    );
  } finally {
    await client.close();
  }
}
