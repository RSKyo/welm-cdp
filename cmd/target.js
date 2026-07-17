import { assertHttpUrl, assertNonBlankString } from "../infra/assert.js";
import {
  getCdpOptions,
  listTargets,
  getTarget,
  findTarget,
  findTargets,
  activateTarget,
  reloadTarget,
  openTarget,
  closeTarget,
} from "../cdp/target.js";

const CDP_OPTIONS = "--host --port";
const TARGET_TYPE_OPTIONS = "--target-type";

/**
 * CDP target CLI command registry.
 *
 * target options
 * target list
 * target get <targetId>
 * target find <keyword>
 * target find-all <keyword...>
 * target activate <targetId>
 * target reload <targetId>
 * target open <url>
 * target close <targetId>
 */
export const TARGET_COMMANDS = {
  "options": {
    handler: cmd_getCdpOptions,
    usage: "target options [options]",
    description: "Show resolved CDP options",
    options: `${CDP_OPTIONS} ${TARGET_TYPE_OPTIONS}`,
  },

  "list": {
    handler: cmd_listTargets,
    usage: "target list [options]",
    description: "List Chrome targets",
    options: `${CDP_OPTIONS} ${TARGET_TYPE_OPTIONS}`,
  },

  "get": {
    handler: cmd_getTarget,
    usage: "target get <targetId> [options]",
    description: "Get Chrome target by target ID",
    options: `${CDP_OPTIONS} ${TARGET_TYPE_OPTIONS}`,
  },

  "find": {
    handler: cmd_findTarget,
    usage: "target find <keyword> [options]",
    description: "Find the first matching Chrome target",
    options: `${CDP_OPTIONS} ${TARGET_TYPE_OPTIONS}`,
  },

  "find-all": {
    handler: cmd_findTargets,
    usage: "target find-all <keyword...> [options]",
    description: "Find all matching Chrome targets",
    options: `${CDP_OPTIONS} ${TARGET_TYPE_OPTIONS}`,
  },

  "activate": {
    handler: cmd_activateTarget,
    usage: "target activate <targetId> [options]",
    description: "Activate Chrome target",
    options: CDP_OPTIONS,
  },

  "reload": {
    handler: cmd_reloadTarget,
    usage: "target reload <targetId> [options]",
    description: "Reload Chrome target without cache",
    options: CDP_OPTIONS,
  },

  "open": {
    handler: cmd_openTarget,
    usage: "target open <url> [options]",
    description: "Open Chrome target",
    options: CDP_OPTIONS,
  },

  "close": {
    handler: cmd_closeTarget,
    usage: "target close <targetId> [options]",
    description: "Close Chrome target",
    options: CDP_OPTIONS,
  },
};

// -----------------------------------------------------------------------------
// CLI Commands
// -----------------------------------------------------------------------------

/**
 * Show resolved CDP connection and target options.
 */
export async function cmd_getCdpOptions({ options } = {}) {
  const cdpOptions = getCdpOptions(options);

  options.reporter?.info?.(
    `CDP endpoint: http://${cdpOptions.host}:${cdpOptions.port}`,
    options,
  );
  options.reporter?.info?.(
    `Chrome target type: ${cdpOptions.targetType}`,
    options,
  );

  return cdpOptions;
}

/**
 * List Chrome targets.
 */
export async function cmd_listTargets({ options } = {}) {
  const targets = await listTargets(options);

  reportTargets(targets, options);

  return targets;
}

/**
 * Get a Chrome target by target ID.
 */
export async function cmd_getTarget({ argv, options } = {}) {
  const [targetId] = argv;
  assertNonBlankString(targetId, "targetId");

  const target = await getTarget(targetId, options);

  reportTarget(target, options);

  return target;
}

/**
 * Find the first Chrome target matching a keyword.
 */
export async function cmd_findTarget({ argv, options } = {}) {
  const [keyword] = argv;
  assertNonBlankString(keyword, "keyword");

  const target = await findTarget(keyword, options);

  if (target) {
    reportTarget(target, options);
  }

  return target;
}

/**
 * Find Chrome targets matching one or more keywords.
 */
export async function cmd_findTargets({ argv, options } = {}) {
  assertKeywords(argv);

  const targets = await findTargets(argv, options);

  reportTargets(targets, options);

  return targets;
}

/**
 * Activate a Chrome target.
 */
export async function cmd_activateTarget({ argv, options } = {}) {
  const [targetId] = argv;
  assertNonBlankString(targetId, "targetId");

  await activateTarget(targetId, options);

  options.reporter?.info?.(`Chrome target activated: ${targetId}`, options);

  return true;
}

/**
 * Reload a Chrome target without cache.
 */
export async function cmd_reloadTarget({ argv, options } = {}) {
  const [targetId] = argv;
  assertNonBlankString(targetId, "targetId");

  await reloadTarget(targetId, options);

  options.reporter?.info?.(`Chrome target reloaded: ${targetId}`, options);

  return true;
}

/**
 * Open a new Chrome target.
 */
export async function cmd_openTarget({ argv, options } = {}) {
  const [url] = argv;
  assertHttpUrl(url, "url");

  const target = await openTarget(url, options);

  reportTarget(target, options);

  return target;
}

/**
 * Close a Chrome target.
 */
export async function cmd_closeTarget({ argv, options } = {}) {
  const [targetId] = argv;
  assertNonBlankString(targetId, "targetId");

  await closeTarget(targetId, options);

  options.reporter?.info?.(`Chrome target closed: ${targetId}`, options);

  return true;
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

function reportTarget(target, options = {}) {
  options.reporter?.info?.(
    `${target.targetId} ${target.type} ${target.title}`,
    options,
  );
}

function reportTargets(targets, options = {}) {
  const total = targets.length;

  targets.forEach((target, index) => {
    options.reporter?.info?.(
      `(${index + 1}/${total}) ${target.targetId} ${target.type} ${target.title}`,
      options,
    );
  });
}
