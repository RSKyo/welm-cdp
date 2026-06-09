import { ok } from "../infra/protocol.js";
import {
  getDebuggingInfo,
  ensureChrome,
  listChromePages,
  findChromePage,
  activateChromePage,
  openChromePage,
  ensureChromePage,
  closeChromePage,
} from "./chrome.js";

// Chrome CLI 命令注册表
export const CHROME_COMMANDS = {
  info: {
    handler: cmd_getDebuggingInfo,
    usage: "chrome info",
    description: "Show default Chrome/CDP configuration",
    mainOptions: "",
    advancedOptions: "",
  },

  ready: {
    handler: cmd_ensureChrome,
    usage: "chrome ready [main options] [advanced options]",
    description: "Ensure Chrome and CDP service ready",
    mainOptions: "--url=<url> --host=<host> --port=<port>",
    advancedOptions: "--chromeBin=<path> --userDataDir=<path> --timeout=<ms> --interval=<ms>",
  },

  list: {
    handler: cmd_listChromePages,
    usage: "chrome list [main options] [advanced options]",
    description: "List all Chrome pages",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: "--chromeBin=<path> --userDataDir=<path> --timeout=<ms> --interval=<ms>",
  },

  find: {
    handler: cmd_findChromePage,
    usage: "chrome find <keyword> [main options] [advanced options]",
    description: "Find a Chrome page by keyword",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: "--chromeBin=<path> --userDataDir=<path> --timeout=<ms> --interval=<ms>",
  },

  activate: {
    handler: cmd_activateChromePage,
    usage: "chrome activate <targetId> [main options] [advanced options]",
    description: "Activate a Chrome page",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: "--chromeBin=<path> --userDataDir=<path> --timeout=<ms> --interval=<ms>",
  },

  open: {
    handler: cmd_openChromePage,
    usage: "chrome open <url> [main options] [advanced options]",
    description: "Open a new Chrome page",
    mainOptions: "--host=<host> --port=<port> --wait=<dom|load>",
    advancedOptions: "--chromeBin=<path> --userDataDir=<path> --timeout=<ms> --interval=<ms>",
  },

  ensure: {
    handler: cmd_ensureChromePage,
    usage: "chrome ensure <url> [main options] [advanced options]",
    description: "Find or open Chrome page",
    mainOptions: "--wait=<dom|load> --host=<host> --port=<port> --keyword=<keyword>",
    advancedOptions: "--chromeBin=<path> --userDataDir=<path> --timeout=<ms> --interval=<ms>",
  },

  close: {
    handler: cmd_closeChromePage,
    usage: "chrome close <targetId> [main options] [advanced options]",
    description: "Close a Chrome page",
    mainOptions: "--host=<host> --port=<port>",
    advancedOptions: "--chromeBin=<path> --userDataDir=<path> --timeout=<ms> --interval=<ms>",
  },
};

// CLI 命令实现
export async function cmd_getDebuggingInfo(ctx) {
  return ok(getDebuggingInfo());
}

export async function cmd_ensureChrome(ctx) {
  const { options } = ctx;
  return ok(await ensureChrome(options));
}

export async function cmd_listChromePages(ctx) {
  const { options } = ctx;
  return ok(await listChromePages(options));
}

export async function cmd_findChromePage(ctx) {
  const { argv, options } = ctx;
  const [keyword] = argv;
  return ok(await findChromePage(keyword, options));
}

export async function cmd_activateChromePage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;
  return ok(await activateChromePage(targetId, options));
}

export async function cmd_openChromePage(ctx) {
  const { argv, options } = ctx;
  const [url] = argv;
  return ok(await openChromePage(url, options));
}

export async function cmd_ensureChromePage(ctx) {
  const { argv, options } = ctx;
  const [url] = argv;
  return ok(await ensureChromePage(url, options));
}

export async function cmd_closeChromePage(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;
  return ok(await closeChromePage(targetId, options));
}
