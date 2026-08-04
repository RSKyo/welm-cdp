import { log } from "../../common/log.js";
import { assertHttpUrl, assertNonBlankString } from "../../common/assert.js";
import {
  setCdpHost,
  setCdpPort,
  setCdpTargetType,
  setChromeBin,
  setChromeUserDataDir,
  ensureChrome,
  isChromeReady,
  listChromePages,
  findChromePage,
  findChromePages,
  activateChromePage,
  reloadChromePage,
  openChromePage,
  ensureChromePage,
  closeChromePage,
} from "../../cdp/chrome.js";

const CDP_OPTIONS = "--host --port";
const CHROME_OPTIONS = "--chrome-bin --user-data-dir";
const CHROME_READY_OPTIONS =
  "--chrome-ready-timeout --chrome-ready-interval";
const PAGE_OPTIONS = "--target-type";
const PAGE_READY_OPTIONS = "--page-ready-timeout --page-ready-interval";
const LEAVE_ABOUT_BLANK_OPTIONS =
  "--leave-about-blank-timeout --leave-about-blank-interval";

/**
 * Chrome CLI command registry.
 *
 * chrome set-host [host]
 * chrome set-port [port]
 * chrome set-target-type [targetType]
 * chrome set-bin <chromeBin>
 * chrome set-user-data-dir <userDataDir>
 * chrome status
 * chrome ready
 * chrome list
 * chrome find
 * chrome find-all
 * chrome activate
 * chrome reload
 * chrome open
 * chrome ensure
 * chrome close
 */
export const CHROME_COMMANDS = {
  "set-host": {
    handler: cmd_setCdpHost,
    usage: "chrome set-host [host]",
    description: "Save default Chrome CDP service host",
  },

  "set-port": {
    handler: cmd_setCdpPort,
    usage: "chrome set-port [port]",
    description: "Save default Chrome CDP service port",
  },

  "set-target-type": {
    handler: cmd_setCdpTargetType,
    usage: "chrome set-target-type [targetType]",
    description: "Save default Chrome target type",
  },

  "set-bin": {
    handler: cmd_setChromeBin,
    usage: "chrome set-bin <chromeBin>",
    description: "Save Chrome executable path",
  },

  "set-user-data-dir": {
    handler: cmd_setChromeUserDataDir,
    usage: "chrome set-user-data-dir <userDataDir>",
    description: "Save Chrome user data directory",
  },

  "status": {
    handler: cmd_isChromeReady,
    usage: "chrome status [options]",
    description: "Check Chrome CDP service status",
    options: CDP_OPTIONS,
  },

  "ready": {
    handler: cmd_ensureChrome,
    usage: "chrome ready [options]",
    description: "Ensure Chrome and CDP service ready",
    options: `${CDP_OPTIONS} ${CHROME_OPTIONS} ${CHROME_READY_OPTIONS}`,
  },

  "list": {
    handler: cmd_listChromePages,
    usage: "chrome list [options]",
    description: "List Chrome pages",
    options: `${CDP_OPTIONS} ${PAGE_OPTIONS}`,
  },

  "find": {
    handler: cmd_findChromePage,
    usage: "chrome find <keyword> [options]",
    description: "Find the first matching Chrome page",
    options: `${CDP_OPTIONS} ${PAGE_OPTIONS}`,
  },

  "find-all": {
    handler: cmd_findChromePages,
    usage: "chrome find-all <keyword...> [options]",
    description: "Find all matching Chrome pages",
    options: `${CDP_OPTIONS} ${PAGE_OPTIONS}`,
  },

  "activate": {
    handler: cmd_activateChromePage,
    usage: "chrome activate <keyword> [options]",
    description: "Activate the first matching Chrome page",
    options: `${CDP_OPTIONS} ${PAGE_OPTIONS}`,
  },

  "reload": {
    handler: cmd_reloadChromePage,
    usage: "chrome reload <keyword> [options]",
    description: "Reload the first matching Chrome page",
    options:
      `${CDP_OPTIONS} ${PAGE_OPTIONS} ${PAGE_READY_OPTIONS} ${LEAVE_ABOUT_BLANK_OPTIONS}`,
  },

  "open": {
    handler: cmd_openChromePage,
    usage: "chrome open <url> [options]",
    description: "Open Chrome page",
    options:
      `${CDP_OPTIONS} ${PAGE_OPTIONS} ${PAGE_READY_OPTIONS} ${LEAVE_ABOUT_BLANK_OPTIONS}`,
  },

  "ensure": {
    handler: cmd_ensureChromePage,
    usage: "chrome ensure <url> [options]",
    description: "Ensure Chrome page",
    options:
      `${CDP_OPTIONS} ${PAGE_OPTIONS} ${PAGE_READY_OPTIONS} ${LEAVE_ABOUT_BLANK_OPTIONS}`,
  },

  "close": {
    handler: cmd_closeChromePage,
    usage: "chrome close <keyword...> [options]",
    description: "Close all matching Chrome pages",
    options: `${CDP_OPTIONS} ${PAGE_OPTIONS}`,
  },
};

// -----------------------------------------------------------------------------
// CLI Commands
// -----------------------------------------------------------------------------

/**
 * Save the default Chrome CDP service host.
 */
export async function cmd_setCdpHost({ argv, options } = {}) {
  const [host] = argv;

  if (host !== undefined) {
    assertNonBlankString(host, "host");
  }

  const savedHost = setCdpHost(host);

  log.info(
    `Chrome CDP service host saved: ${savedHost}`,
    options,
  );

  return savedHost;
}

/**
 * Save the default Chrome CDP service port.
 */
export async function cmd_setCdpPort({ argv, options } = {}) {
  const [value] = argv;
  const port = value === undefined ? undefined : Number(value);

  if (port !== undefined && (!Number.isFinite(port) || port <= 0)) {
    throw new Error("port must be a positive number");
  }

  const savedPort = setCdpPort(port);

  log.info(
    `Chrome CDP service port saved: ${savedPort}`,
    options,
  );

  return savedPort;
}

/**
 * Save the default Chrome target type.
 */
export async function cmd_setCdpTargetType({ argv, options } = {}) {
  const [targetType] = argv;

  if (targetType !== undefined) {
    assertNonBlankString(targetType, "targetType");
  }

  const savedTargetType = setCdpTargetType(targetType);

  log.info(
    `Chrome target type saved: ${savedTargetType}`,
    options,
  );

  return savedTargetType;
}

/**
 * Save the Chrome executable path.
 */
export async function cmd_setChromeBin({ argv, options } = {}) {
  const [chromeBin] = argv;
  assertNonBlankString(chromeBin, "chromeBin");

  const savedChromeBin = setChromeBin(chromeBin);

  log.info(
    `Chrome executable path saved: ${savedChromeBin}`,
    options,
  );

  return savedChromeBin;
}

/**
 * Save the Chrome user data directory.
 */
export async function cmd_setChromeUserDataDir({ argv, options } = {}) {
  const [userDataDir] = argv;
  assertNonBlankString(userDataDir, "userDataDir");

  const savedUserDataDir = setChromeUserDataDir(userDataDir);

  log.info(
    `Chrome user data directory saved: ${savedUserDataDir}`,
    options,
  );

  return savedUserDataDir;
}

/**
 * Check whether the Chrome CDP service is ready.
 */
export async function cmd_isChromeReady({ options } = {}) {
  const ready = await isChromeReady(options);

  log.info(
    ready ? "Chrome CDP service is ready" : "Chrome CDP service is not ready",
    options,
  );

  return ready;
}

/**
 * Ensure Chrome and the CDP service are ready.
 */
export async function cmd_ensureChrome({ options } = {}) {
  const chrome = await ensureChrome(options);

  if (chrome.launched) {

    log.info(
      `CDP endpoint: http://${chrome.host}:${chrome.port}`,
      options,
    );
    log.info(`Using Chrome executable: ${chrome.chromeBin}`, options);
    log.info(
      `Using Chrome user data dir: ${chrome.userDataDir}`,
      options,
    );
  }

  return chrome;
}

/**
 * List Chrome pages.
 */
export async function cmd_listChromePages({ options } = {}) {
  const pages = await listChromePages(options);

  reportPages(pages, options);

  return pages;
}

/**
 * Find the first Chrome page matching a keyword.
 */
export async function cmd_findChromePage({ argv, options } = {}) {
  const [keyword] = argv;
  assertNonBlankString(keyword, "keyword");

  const page = await findChromePage(keyword, options);

  if (page) {
    reportPage(page, options);
  }

  return page;
}

/**
 * Find Chrome pages matching one or more keywords.
 */
export async function cmd_findChromePages({ argv, options } = {}) {
  assertKeywords(argv);

  const pages = await findChromePages(argv, options);

  reportPages(pages, options);

  return pages;
}

/**
 * Activate the first Chrome page matching a keyword.
 */
export async function cmd_activateChromePage({ argv, options } = {}) {
  const [keyword] = argv;
  assertNonBlankString(keyword, "keyword");

  const page = await activateChromePage(keyword, options);

  reportPage(page, options);

  return page;
}

/**
 * Reload the first Chrome page matching a keyword.
 */
export async function cmd_reloadChromePage({ argv, options } = {}) {
  const [keyword] = argv;
  assertNonBlankString(keyword, "keyword");

  const page = await reloadChromePage(keyword, options);

  reportPage(page, options);

  return page;
}

/**
 * Open a new Chrome page.
 */
export async function cmd_openChromePage({ argv, options } = {}) {
  const [url] = argv;
  assertHttpUrl(url, "url");

  const page = await openChromePage(url, options);

  reportPage(page, options);

  return page;
}

/**
 * Find or open a Chrome page.
 */
export async function cmd_ensureChromePage({ argv, options } = {}) {
  const [url] = argv;
  assertHttpUrl(url, "url");

  const page = await ensureChromePage(url, options);

  reportPage(page, options);

  return page;
}

/**
 * Close all Chrome pages matching one or more keywords.
 */
export async function cmd_closeChromePage({ argv, options } = {}) {
  assertKeywords(argv);

  const closed = await closeChromePage(argv, options);

  log.info("Matching Chrome pages closed", options);

  return closed;
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function assertKeywords(keywords) {
  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new Error("keywords is required");
  }

  keywords.forEach((keyword, index) => {
    assertNonBlankString(keyword, `keywords[${index}]`);
  });

  return keywords;
}

function reportPage(page, options = {}) {
  log.info(`${page.targetId} ${page.title}`, options);
}

function reportPages(pages, options = {}) {
  const total = pages.length;

  pages.forEach((page, index) => {
    log.info(
      `(${index + 1}/${total}) ${page.targetId} ${page.title}`,
      options,
    );
  });
}
