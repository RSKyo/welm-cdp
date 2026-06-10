import { log } from "../infra/log.js";
import {
  ensureChrome,
  listChromePages,
  getChromePage,
  findChromePage,
  activateChromePage,
  openChromePage,
  ensureChromePage,
  closeChromePage,
} from "../cdp/chrome.js";

/**
 * Chrome CLI 命令注册表。
 *
 * chrome ready
 * chrome list
 * chrome get
 * chrome find
 * chrome activate
 * chrome open
 * chrome ensure
 * chrome close
 */
export const CHROME_COMMANDS = {
  ready: {
    handler: cmd_ensureChrome,
    usage: "chrome ready [options]",
    description: "Ensure Chrome and CDP service ready",
    options: "--host --port --chromeBin --userDataDir --timeout --interval",
  },

  list: {
    handler: cmd_listChromePages,
    usage: "chrome list [options]",
    description: "List all Chrome pages",
    options: "--type --host --port",
  },

  get: {
    handler: cmd_getChromePage,
    usage: "chrome get <targetId> [options]",
    description: "Get a Chrome page by targetId",
    options: "--type --host --port",
  },

  find: {
    handler: cmd_findChromePage,
    usage: "chrome find <keyword> [options]",
    description: "Find a Chrome page by keyword",
    options: "--type --host --port",
  },

  activate: {
    handler: cmd_activateChromePage,
    usage: "chrome activate <targetId> [options]",
    description: "Activate a Chrome page",
    options: "--host --port",
  },

  open: {
    handler: cmd_openChromePage,
    usage: "chrome open <url> [options]",
    description: "Open a new Chrome page",
    options: "--host --port --timeout --interval",
  },

  ensure: {
    handler: cmd_ensureChromePage,
    usage: "chrome ensure <url> [options]",
    description: "Find or open Chrome page",
    options: "--keyword --host --port --timeout --interval",
  },

  close: {
    handler: cmd_closeChromePage,
    usage: "chrome close <targetId> [options]",
    description: "Close a Chrome page",
    options: "--host --port",
  },
};

// CLI 命令实现

/**
 * 确保 Chrome 与 CDP 服务已就绪。
 */
export async function cmd_ensureChrome(ctx) {
  const { options } = ctx;
  const debugInfo = await ensureChrome(options);

  log.info(`CDP endpoint: http://${debugInfo.host}:${debugInfo.port}`, options);
  log.info(`Using Chrome executable: ${debugInfo.chromeBin}`, options);
  log.info(`Using Chrome user data dir: ${debugInfo.userDataDir}`, options);

  return debugInfo;
}

/**
 * 获取所有 Chrome 网页。
 */
export async function cmd_listChromePages(ctx) {
  const { options } = ctx;
  const pages = await listChromePages(options);

  const total = pages.length;
  pages.forEach((page, index) => {
    log.info(`(${index + 1}/${total}) ${page.id} ${page.title}`, options);
  });

  return pages;
}

/**
 * 获取指定 Chrome 网页。
 */
export async function cmd_getChromePage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const page = await getChromePage(targetId, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}

/**
 * 根据关键字查找 Chrome 网页。
 */
export async function cmd_findChromePage(ctx) {
  const { argv, options } = ctx;
  const [keyword] = argv;

  const page = await findChromePage(keyword, options);

  if (page) {
    log.info(`${page.id} ${page.title}`, options);
  } else {
    log.warn(`No matching Chrome page found for keyword: ${keyword}`, options);
  }

  return page;
}

/**
 * 激活 Chrome 网页。
 */
export async function cmd_activateChromePage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const page = await activateChromePage(targetId, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}

/**
 * 新建 Chrome 网页。
 */
export async function cmd_openChromePage(ctx) {
  const { argv, options } = ctx;
  const [url] = argv;

  const page = await openChromePage(url, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}

/**
 * 查找或打开 Chrome 网页。
 */
export async function cmd_ensureChromePage(ctx) {
  const { argv, options } = ctx;
  const [url] = argv;

  const page = await ensureChromePage(url, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}

/**
 * 关闭 Chrome 网页。
 */
export async function cmd_closeChromePage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const page = await closeChromePage(targetId, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}
