// node
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";

// infra
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_TIMEOUT,
  DEFAULT_INTERVAL,
  CHROME_USER_DATA_DIR,
} from "../infra/config.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { log } from "../infra/log.js";
import { sleep } from "../infra/utils.js";

// cdp
import {
  TARGET_TYPE,
  listTargets,
  getTarget,
  findTarget,
  activateTarget,
  openTarget,
  closeTarget,
} from "./target.js";
import { waitPage } from "./wait.js";

/**
 * 标准化 Chrome Page 对象。
 *
 * 返回：
 *   id
 *   title
 *   url
 */
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
  const userDataDir = options.userDataDir ?? CHROME_USER_DATA_DIR;

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
 * 确保 Chrome 已启动。
 *
 * 流程：
 *   1. 检查 CDP 服务是否可访问
 *   2. 如未启动则启动 Chrome
 *   3. 等待 CDP 服务就绪
 *
 * options:
 *   host         CDP Host
 *   port         CDP Port
 *   chromeBin    Chrome 可执行文件路径
 *   userDataDir  Chrome 用户数据目录
 *   timeout      最大等待时间(ms)
 *   interval     轮询间隔(ms)
 *
 * 返回：
 *   host
 *   port
 *   chromeBin
 *   userDataDir
 */
export async function ensureChrome(options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;


  const chromeBin = await checkChromeBin(options.chromeBin ?? getChromeBin());
  const userDataDir = options.userDataDir ?? CHROME_USER_DATA_DIR;

  if (!(await isCdpReady(options))) {
    const startTime = Date.now();

    log.progress(`Starting Chrome...`, options);
    await launchChrome(options);

    log.progress(`Waiting for Chrome CDP service...`, options);
    await waitCdpReady(options);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log.progressDone(`Chrome is ready (${elapsed}s)`, options);
  }

  return {
    host,
    port,
    chromeBin,
    userDataDir,
  };
}

/**
 * 获取所有 Chrome 网页。
 *
 * options:
 *   host CDP Host
 *   port CDP Port
 *
 * 返回：
 *   Chrome Page[]
 */
export async function listChromePages(options = {}) {
  options.type = options.type ?? TARGET_TYPE.WEBPAGE;
  const targets = await listTargets(options);

  return targets.map(normalizePage);
}

/**
 * 获取 Chrome 网页。
 *
 * targetId:
 *   Chrome Target ID
 *
 * options:
 *   host CDP Host
 *   port CDP Port
 *
 * 返回：
 *   Chrome Page
 */
export async function getChromePage(targetId, options = {}) {
  options.type = options.type ?? TARGET_TYPE.WEBPAGE;

  const target = await getTarget(targetId, options);

  return normalizePage(target);
}

/**
 * 根据关键字查找 Chrome 网页。
 *
 * keyword:
 *   页面标题或 URL 关键字
 *
 * options:
 *   host CDP Host
 *   port CDP Port
 *
 * 返回：
 *   Chrome Page | null
 */
export async function findChromePage(keyword, options = {}) {
  options.type = options.type ?? TARGET_TYPE.WEBPAGE;

  const target = await findTarget(keyword, options);
  if (target) {
    return normalizePage(target);
  }

  return null;
}

/**
 * 激活 Chrome 网页。
 *
 * targetId:
 *   Chrome Target ID
 *
 * options:
 *   host CDP Host
 *   port CDP Port
 *
 * 返回：
 *   Chrome Page
 */
export async function activateChromePage(targetId, options = {}) {
  const target = await getTarget(targetId, {
    ...options,
    type: TARGET_TYPE.WEBPAGE,
  });
  await activateTarget(targetId, options);
  return normalizePage(target);
}

/**
 * 新建 Chrome 网页。
 *
 * 流程：
 *   1. 创建 Chrome Target
 *   2. 等待页面离开 about:blank
 *   3. 等待页面加载完成
 *
 * url:
 *   HTTP/HTTPS URL
 *
 * options:
 *   host     CDP Host
 *   port     CDP Port
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *
 * 返回：
 *   Chrome Page
 */
export async function openChromePage(url, options = {}) {
  url;
  // 创建 Target 后，会产生一个空白页 about:blank，此时并不能保证目标 url 开始加载
  // 接下来 Chrome 什么时候真正导航过去，是异步的
  let target = await openTarget(url, options);
  await waitPage(target.id, options);

  // 由于 url 是异步加载的，因此前面获取的 target title是空的，需要重新获取
  target = await getTarget(target.id, options);
  return normalizePage(target);
}

/**
 * 查找或打开 Chrome 网页。
 *
 * 流程：
 *   1. 根据 keyword 查找已有页面
 *   2. 找到则激活页面
 *   3. 未找到则创建新页面
 *   4. 等待页面加载完成
 *
 * url:
 *   HTTP/HTTPS URL
 *
 * options:
 *   keyword  查找关键字（默认使用 url）
 *   host     CDP Host
 *   port     CDP Port
 *   timeout  最大等待时间(ms)
 *   interval 轮询间隔(ms)
 *
 * 返回：
 *   Chrome Page
 */
export async function ensureChromePage(url, options = {}) {
  url;
  let target;
  const keyword = options.keyword ?? url;

  target = await findTarget(keyword, { ...options, type: TARGET_TYPE.WEBPAGE });

  if (target) {
    if (options.activate) {
      await activateTarget(target.id, options);
    }
  } else {
    const startTime = Date.now();

    log.progress("Opening page...", options);
    target = await openTarget(url, options);

    log.progress("Waiting for page...", options);
    await waitPage(target.id, options);
    target = await getTarget(target.id, options);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log.progressDone(`Page is ready (${elapsed}s)`, options);
  }

  return normalizePage(target);
}

/**
 * 关闭 Chrome 网页。
 *
 * targetId:
 *   Chrome Target ID
 *
 * options:
 *   host CDP Host
 *   port CDP Port
 *
 * 返回：
 *   Chrome Page
 */
export async function closeChromePage(targetId, options = {}) {
  const target = await getTarget(targetId, {
    ...options,
    type: TARGET_TYPE.WEBPAGE,
  });
  await closeTarget(targetId, options);
  return normalizePage(target);
}
