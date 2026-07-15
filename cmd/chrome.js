import { assertNonBlankString, assertHttpUrl } from "../infra/assert.js";
import {
  ensureChrome,
  listChromePages,
  findChromePage,
  findChromePages,
  activateChromePage,
  reloadChromePage,
  openChromePage,
  ensureChromePage,
  closeChromePage,
} from "../cdp/chrome.js";

const CDP_OPTIONS = "--host --port";
const CHROME_OPTIONS = "--chrome-bin --user-data-dir";
const CHROME_READY_OPTIONS =
  "--chrome-ready-timeout --chrome-ready-interval";
const PAGE_OPTIONS = "--target-type";
const PAGE_READY_OPTIONS = "--page-ready-timeout --page-ready-interval";

/**
 * Chrome CLI command registry.
 *
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
    options: `${CDP_OPTIONS} ${PAGE_OPTIONS} ${PAGE_READY_OPTIONS}`,
  },

  "open": {
    handler: cmd_openChromePage,
    usage: "chrome open <url> [options]",
    description: "Open Chrome page",
    options: `${CDP_OPTIONS} ${PAGE_OPTIONS} ${PAGE_READY_OPTIONS}`,
  },

  "ensure": {
    handler: cmd_ensureChromePage,
    usage: "chrome ensure <url> [options]",
    description: "Ensure Chrome page",
    options: `${CDP_OPTIONS} ${PAGE_OPTIONS} ${PAGE_READY_OPTIONS}`,
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
 * Ensure Chrome and the CDP service are ready.
 */
export async function cmd_ensureChrome({ options } = {}) {
  const chrome = await ensureChrome(options);

  if (chrome.launched) {
    const { reporter } = options;

    reporter?.info?.(
      `CDP endpoint: http://${chrome.host}:${chrome.port}`,
      options,
    );
    reporter?.info?.(`Using Chrome executable: ${chrome.chromeBin}`, options);
    reporter?.info?.(
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

  options.reporter?.info?.("Matching Chrome pages closed", options);

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
  options.reporter?.info?.(`${page.targetId} ${page.title}`, options);
}

function reportPages(pages, options = {}) {
  const total = pages.length;

  pages.forEach((page, index) => {
    options.reporter?.info?.(
      `(${index + 1}/${total}) ${page.targetId} ${page.title}`,
      options,
    );
  });
}
