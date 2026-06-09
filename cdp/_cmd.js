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
} from "./chrome.js";

// Chrome CLI 命令注册表
export const CHROME_COMMANDS = {
  ready: {
    handler: cmd_ensureChrome,
    usage: "chrome ready [main options] [advanced options]",
    description: "Ensure Chrome and CDP service ready",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions:
      "--chromeBin=<path> --userDataDir=<path> --timeout=<ms> --interval=<ms>",
  },

  list: {
    handler: cmd_listChromePages,
    usage: "chrome list [main options] [advanced options]",
    description: "List all Chrome pages",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: null,
  },

  get: {
    handler: cmd_getChromePage,
    usage: "chrome get <targetId> [main options] [advanced options]",
    description: "Get a Chrome page by targetId",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: null,
  },

  find: {
    handler: cmd_findChromePage,
    usage: "chrome find <keyword> [main options] [advanced options]",
    description: "Find a Chrome page by keyword",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: null,
  },

  activate: {
    handler: cmd_activateChromePage,
    usage: "chrome activate <targetId> [main options] [advanced options]",
    description: "Activate a Chrome page",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: null,
  },

  open: {
    handler: cmd_openChromePage,
    usage: "chrome open <url> [main options] [advanced options]",
    description: "Open a new Chrome page",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: "--wait=<dom|load>",
  },

  ensure: {
    handler: cmd_ensureChromePage,
    usage: "chrome ensure <url> [main options] [advanced options]",
    description: "Find or open Chrome page",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: "--wait=<dom|load> --keyword=<keyword>",
  },

  close: {
    handler: cmd_closeChromePage,
    usage: "chrome close <targetId> [main options] [advanced options]",
    description: "Close a Chrome page",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: null,
  },
};

// CLI 命令实现

export async function cmd_ensureChrome(ctx) {
  const { options } = ctx;
  const debugInfo = await ensureChrome(options);

  log.info(`CDP endpoint: http://${debugInfo.host}:${debugInfo.port}`, options);
  log.info(`Using Chrome executable: ${debugInfo.chromeBin}`, options);
  log.info(`Using Chrome user data dir: ${debugInfo.userDataDir}`, options);

  return debugInfo;
}

export async function cmd_listChromePages(ctx) {
  const { options } = ctx;
  const pages = await listChromePages(options);

  const total = pages.length;
  pages.forEach((page, index) => {
    log.info(`(${index + 1}/${total}) ${page.id} ${page.title}`, options);
  });

  return pages;
}

export async function cmd_getChromePage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const page = await getChromePage(targetId, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}

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

export async function cmd_activateChromePage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const page = await activateChromePage(targetId, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}

export async function cmd_openChromePage(ctx) {
  const { argv, options } = ctx;
  const [url] = argv;

  const page = await openChromePage(url, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}

export async function cmd_ensureChromePage(ctx) {
  const { argv, options } = ctx;
  const [url] = argv;

  const page = await ensureChromePage(url, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}

export async function cmd_closeChromePage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const page = await closeChromePage(targetId, options);
  log.info(`${page.id} ${page.title}`, options);

  return page;
}
