// node
import CDP from "chrome-remote-interface";
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import nodePath from "node:path";

const defaultHost = "127.0.0.1";
const defaultPort = 9222;
const defaultTargetType = "page";
const defaultUserDataDir = `${process.env.HOME}/.local/share/welm/chrome-profile`;

const defaultChromeReadyTimeout = 15000;
const defaultChromeReadyInterval = 200;

// -----------------------------------------------------------------------------
// Public API: Chrome
// -----------------------------------------------------------------------------

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

  const { host, port, targetType, userDataDir } = getCdpOptions(options);
  const chromeBin = await checkChromeBin(options.chromeBin ?? getChromeBin());

  return {
    host,
    port,
    targetType,
    userDataDir,
    chromeBin,
    launched: false,
  };
}

// -----------------------------------------------------------------------------
// Public API: Chrome Page
// -----------------------------------------------------------------------------

export async function listChromePages(options = {}) {
  return await listTargets(options);
}

export async function getChromePage(targetId, options = {}) {
  return await getTarget(targetId, options);
}

export async function findChromePage(keyword, options = {}) {
  return await findTarget(keyword, options);
}

export async function findChromePages(keywords, options = {}) {
  return await findTargets(keywords, options);
}

export async function activateChromePage(targetId, options = {}) {
  await activateTarget(targetId, options);

  return await getTarget(targetId, options);
}

export async function reloadChromePage(targetId, options = {}) {
  const startTime = Date.now();

  options.reporter?.progress?.("Reloading page...", options);

  await reloadTarget(targetId, options);

  options.reporter?.progress?.("Waiting for page...", options);

  await waitPageReady(targetId, options);

  const target = await getTarget(targetId, options);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  options.reporter?.progressDone?.(
    `Page reloaded (${elapsed}s) ${target.url}`,
    options,
  );

  return target;
}

export async function openChromePage(url, options = {}) {
  const startTime = Date.now();

  options.reporter?.progress?.("Opening page...", options);

  const { targetId } = await openTarget(url, options);

  options.reporter?.progress?.("Waiting for page...", options);

  await waitPageReady(targetId, options);

  // 由于 url 是异步加载的，因此前面获取的 target title 是空的，需要重新获取。
  const target = await getTarget(targetId, options);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  options.reporter?.progressDone?.(`Page is ready (${elapsed}s)`, options);

  return target;
}

export async function ensureChromePage(url, options = {}) {
  const keyword = options.keyword ?? url;

  const target = await findChromePage(keyword, options);

  if (target) {
    return target;
  }

  return await openChromePage(url, options);
}

export async function closeChromePage(targetId, options = {}) {
  const target = await getTarget(targetId, options);

  await closeTarget(targetId, options);

  return target;
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCdpOptions(options = {}) {
  return {
    host: options.cdpHost ?? defaultHost,
    port: options.cdpPort ?? defaultPort,
    targetType: options.cdpTargetType ?? defaultTargetType,
    userDataDir: options.cdpUserDataDir ?? defaultUserDataDir,
  };
}

function normalizeTarget(target) {
  return {
    targetId: target.id,
    type: target.type ?? "",
    title: target.title ?? "",
    url: target.url ?? "",
  };
}

// -----------------------------------------------------------------------------
// Private Helpers: CDP Target
// -----------------------------------------------------------------------------

async function listTargets(options = {}) {
  const { host, port, targetType } = getCdpOptions(options);

  const targets = await CDP.List({
    host,
    port,
  });

  const filteredTargets = targets.filter(
    (target) => target.type === targetType,
  );

  return filteredTargets.map(normalizeTarget);
}

async function getTarget(targetId, options = {}) {
  const targets = await listTargets(options);

  const target = targets.find((target) => target.targetId === targetId);

  if (!target) {
    throw new Error(`target not found: ${targetId}`);
  }

  return target;
}

async function findTargets(keywords, options = {}) {
  const targets = await listTargets(options);

  let search = Array.isArray(keywords) ? keywords : [keywords];
  search = search.map((keyword) => {
    if (typeof keyword !== "string" || keyword.trim() === "") {
      throw new Error(`keyword must be a non-empty string`);
    }

    return keyword.trim().toLowerCase();
  });

  return targets.filter((target) => {
    return (
      search.includes(target.targetId.toLowerCase()) ||
      search.includes(target.title.toLowerCase()) ||
      search.includes(target.url.toLowerCase())
    );
  });
}

async function findTarget(keyword, options = {}) {
  const targets = await findTargets(keyword, options);

  return targets[0] ?? null;
}

async function activateTarget(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  await CDP.Activate({
    host,
    port,
    id: targetId,
  });
}

async function reloadTarget(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  const client = await CDP({
    host,
    port,
    target: targetId,
  });

  try {
    await client.Page.reload({
      ignoreCache: true,
    });
  } finally {
    await client.close();
  }
}

async function openTarget(url, options = {}) {
  const { host, port } = getCdpOptions(options);

  const target = await CDP.New({
    host,
    port,
    url,
  });

  return normalizeTarget(target);
}

async function closeTarget(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  await CDP.Close({
    host,
    port,
    id: targetId,
  });
}

// -----------------------------------------------------------------------------
// Private Helpers: Chrome Lifecycle
// -----------------------------------------------------------------------------

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
 * 检查 CDP 服务是否可访问。
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
  const { host, port, userDataDir } = getCdpOptions(options);
  const chromeBin = await checkChromeBin(options.chromeBin ?? getChromeBin());

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

  return {
    host,
    port,
    chromeBin,
    userDataDir,
    launched: true,
  };
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
 * 等待页面加载完成。
 *
 * 先监听 loadEventFired，
 * 再等待页面离开 about:blank，
 * 最后等待页面 load 事件。
 *
 * 这样可以避免监听过晚导致错过事件。
 */
async function waitPageReady(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);
  const timeout = options.pageTimeout ?? 30000;
  const interval = options.interval ?? 200;

  const client = await CDP({
    host,
    port,
    targetId,
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
