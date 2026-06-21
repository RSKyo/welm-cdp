// node
import CDP from "chrome-remote-interface";
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";

const defaultHost = "127.0.0.1";
const defaultPort = 9222;
const defaultUserDataDir = `${process.env.HOME}/.local/share/welm/chrome-profile`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCdpOptions(options = {}) {
  return {
    host: options.host ?? defaultHost,
    port: options.port ?? defaultPort,
  };
}

function normalizeTarget(target) {
  return {
    id: target.id,
    type: target.type ?? "",
    title: target.title ?? "",
    url: target.url ?? "",
  };
}

/**
 * ----------------------------------------------------------------------------
 * Target
 * ----------------------------------------------------------------------------
 */

async function listTargets(options = {}) {
  const cdpOptions = getCdpOptions(options);

  const targets = await CDP.List(cdpOptions);
  if (options.targetType) {
    return targets
      .filter((target) => target.type === options.targetType)
      .map(normalizeTarget);
  }

  return targets.map(normalizeTarget);
}

async function getTarget(id, options = {}) {
  const targets = await listTargets(options);

  const target = targets.find((target) => target.id === id);

  if (!target) {
    throw new Error("target not found");
  }

  return target;
}

async function findTarget(keyword, options = {}) {
  const search = keyword.toLowerCase();
  const targets = await listTargets(options);

  return (
    targets.find(
      (target) =>
        target.title.toLowerCase().includes(search) ||
        target.url.toLowerCase().includes(search),
    ) ?? null
  );
}

async function activateTarget(id, options = {}) {
  const cdpOptions = getCdpOptions(options);

  await CDP.Activate({
    ...cdpOptions,
    id,
  });
}

async function openTarget(url, options = {}) {
  const cdpOptions = getCdpOptions(options);

  const target = await CDP.New({
    ...cdpOptions,
    url,
  });

  return normalizeTarget(target);
}

async function closeTarget(id, options = {}) {
  const cdpOptions = getCdpOptions(options);

  await CDP.Close({
    ...cdpOptions,
    id,
  });
}

/**
 * ----------------------------------------------------------------------------
 * Chrome Lifecycle
 * ----------------------------------------------------------------------------
 */

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
    throw new Error("chrome executable not found");
  }
}

/**
 * 检查 CDP 服务是否可访问。
 */
async function isChromeReady(options = {}) {
  const cdpOptions = getCdpOptions(options);

  try {
    const res = await fetch(
      `http://${cdpOptions.host}:${cdpOptions.port}/json/version`,
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 等待 CDP 服务就绪。
 */
async function waitChromeReady(options = {}) {
  const cdpOptions = getCdpOptions(options);
  const timeout = 15000;
  const interval = 200;

  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await isChromeReady(cdpOptions)) {
      return;
    }

    await sleep(interval);
  }

  throw new Error("Chrome CDP service not ready!");
}

/**
 * 启动带 CDP 调试端口的 Chrome。
 */
async function launchChrome(options = {}) {
  const { host, port } = getCdpOptions(options);
  const chromeBin = await checkChromeBin(options.chromeBin ?? getChromeBin());
  const userDataDir = options.userDataDir ?? defaultUserDataDir;

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
 * 确保 Chrome 已启动并开放 CDP 服务。
 *
 * 如果 Chrome 未运行，则自动启动。
 * 返回当前连接信息。
 */
export async function ensureChrome(options = {}) {
  let launchInfo;

  if (!(await isChromeReady(options))) {
    const startTime = Date.now();

    options.reporter?.progress(`Starting Chrome...`, options);
    launchInfo = await launchChrome(options);

    options.reporter?.progress(`Waiting for Chrome CDP service...`, options);
    await waitChromeReady(options);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    options.reporter?.progressDone(`Chrome is ready (${elapsed}s)`, options);

    return launchInfo;
  }

  const { host, port } = getCdpOptions(options);
  const chromeBin = await checkChromeBin(options.chromeBin ?? getChromeBin());
  const userDataDir = options.userDataDir ?? defaultUserDataDir;

  return {
    host,
    port,
    chromeBin,
    userDataDir,
    launched: false,
  };
}

/**
 * ----------------------------------------------------------------------------
 * Chrome Page
 * ----------------------------------------------------------------------------
 */

export async function listChromePages(options = {}) {
  const targets = await listTargets({
    ...options,
    targetType: options.targetType ?? "page",
  });

  return targets;
}

export async function getChromePage(id, options = {}) {
  const target = await getTarget(id, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  return target;
}

export async function findChromePage(keyword, options = {}) {
  const target = await findTarget(keyword, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  return target ?? null;
}

export async function activateChromePage(id, options = {}) {
  await activateTarget(id, options);

  const target = await getTarget(id, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  return target;
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
async function waitLeaveAboutBlank(id, options = {}) {
  const timeout = 2000;
  const interval = 50;

  const start = Date.now();

  while (Date.now() - start < timeout) {
    const { url } = await getTarget(id, options);

    if (url !== "about:blank") {
      return;
    }

    await sleep(interval);
  }

  throw new Error("leave about:blank timeout");
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
async function waitPageReady(id, options = {}) {
  const cdpOptions = getCdpOptions(options);
  const timeout = 30000;

  const client = await CDP({
    ...cdpOptions,
    id,
  });

  try {
    await client.Page.enable();

    const loadPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        client.off("Page.loadEventFired", onLoad);

        reject(new Error("Page load timeout"));
      }, timeout);

      function onLoad() {
        clearTimeout(timer);

        resolve();
      }

      client.once("Page.loadEventFired", onLoad);
    });

    await waitLeaveAboutBlank(id, options);
    await loadPromise;
  } finally {
    await client.close();
  }
}

export async function openChromePage(url, options = {}) {
  const startTime = Date.now();

  options.reporter?.progress("Opening page...", options);
  let target = await openTarget(url, options);

  options.reporter?.progress("Waiting for page...", options);
  await waitPageReady(target.id, options);

  // 由于 url 是异步加载的，因此前面获取的 target title是空的，需要重新获取
  target = await getTarget(target.id, options);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  options.reporter?.progressDone(`Page is ready (${elapsed}s)`, options);

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

export async function closeChromePage(id, options = {}) {
  const target = await getTarget(id, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  await closeTarget(id, options);
  return target;
}
