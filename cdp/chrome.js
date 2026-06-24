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
    id: target.targetId,
    type: target.type ?? "",
    title: target.title ?? "",
    url: target.url ?? "",
  };
}

/**
 * ----------------------------------------------------------------------------
 * Target (CDP raw layer only)
 * ----------------------------------------------------------------------------
 */

async function listTargets(options = {}) {
  const cdpOptions = getCdpOptions(options);

  const cdpTargets = await CDP.List(cdpOptions);

  if (options.targetType) {
    return cdpTargets.filter((t) => t.type === options.targetType);
  }

  return cdpTargets;
}

async function getTarget(targetId, options = {}) {
  const cdpTargets = await listTargets(options);

  const cdpTarget = cdpTargets.find((t) => t.targetId === targetId);

  if (!cdpTarget) {
    throw new Error(`target not found: ${targetId}`);
  }

  return cdpTarget;
}

async function findTarget(keyword, options = {}) {
  const search = keyword.toLowerCase();
  const cdpTargets = await listTargets(options);

  return (
    cdpTargets.find(
      (t) =>
        (t.title || "").toLowerCase().includes(search) ||
        (t.url || "").toLowerCase().includes(search),
    ) ?? null
  );
}

async function activateTarget(targetId, options = {}) {
  const cdpOptions = getCdpOptions(options);

  await CDP.Activate({
    ...cdpOptions,
    targetId,
  });
}

async function openTarget(url, options = {}) {
  const cdpOptions = getCdpOptions(options);

  return await CDP.New({
    ...cdpOptions,
    url,
  });
}

async function closeTarget(targetId, options = {}) {
  const cdpOptions = getCdpOptions(options);

  await CDP.Close({
    ...cdpOptions,
    targetId,
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
  const timeout = options.timeout ?? 15000;
  const interval = options.interval ?? 200;

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
 * Chrome Page (Domain layer with normalizeTarget)
 * ----------------------------------------------------------------------------
 */

export async function listChromePages(options = {}) {
  const cdpTargets = await listTargets({
    ...options,
    targetType: options.targetType ?? "page",
  });

  return cdpTargets.map(normalizeTarget);
}

export async function getChromePage(id, options = {}) {
  const cdpTarget = await getTarget(id, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  return normalizeTarget(cdpTarget);
}

export async function findChromePage(keyword, options = {}) {
  const cdpTarget = await findTarget(keyword, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  return cdpTarget ? normalizeTarget(cdpTarget) : null;
}

export async function activateChromePage(id, options = {}) {
  await activateTarget(id, options);

  const cdpTarget = await getTarget(id, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  return normalizeTarget(cdpTarget);
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
    const cdpTarget = await getTarget(id, options);

    if (cdpTarget.url !== "about:blank") {
      return;
    }

    const remaining = timeout - (Date.now() - start);
    if (remaining <= 0) break;

    await sleep(Math.min(interval, remaining));
  }

  throw new Error(`leave about:blank timeout: id=${id}, timeout=${timeout}ms`);
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
    targetId: id,
  });

  let timer;

  function cleanup(onLoad) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    client.off("Page.loadEventFired", onLoad);
  }

  try {
    await client.Page.enable();

    let onLoad;

    const loadPromise = new Promise((resolve, reject) => {
      onLoad = () => {
        cleanup(onLoad);
        resolve();
      };

      timer = setTimeout(() => {
        cleanup(onLoad);
        reject(new Error(`Page load timeout: id=${id}, timeout=${timeout}ms`));
      }, timeout);

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

  let cdpTarget = await openTarget(url, options);
  const id = cdpTarget.targetId;

  options.reporter?.progress("Waiting for page...", options);

  await waitPageReady(id, options);

  // 由于 url 是异步加载的，因此前面获取的 target title 是空的，需要重新获取。
  cdpTarget = await getTarget(id, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  options.reporter?.progressDone(`Page is ready (${elapsed}s)`, options);

  return normalizeTarget(cdpTarget);
}

export async function ensureChromePage(url, options = {}) {
  const keyword = options.keyword ?? url;

  const page = await findChromePage(keyword, options);

  if (page) {
    return page;
  }

  return await openChromePage(url, options);
}

export async function closeChromePage(id, options = {}) {
  const cdpTarget = await getTarget(id, {
    ...options,
    targetType: options.targetType ?? "page",
  });

  await closeTarget(id, options);

  return normalizeTarget(cdpTarget);
}
