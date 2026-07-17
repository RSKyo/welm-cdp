// -----------------------------------------------------------------------------
// cdp/target
// -----------------------------------------------------------------------------
// Chrome DevTools Protocol target management utilities.
//
// Public API:
// - getCdpOptions(options)
//
// - listTargets(options)
// - getTarget(targetId, options)
// - findTarget(keyword, options)
// - findTargets(keywords, options)
//
// - activateTarget(targetId, options)
// - reloadTarget(targetId, options)
// - openTarget(url, options)
// - closeTarget(targetId, options)
//
// Features:
// - Resolve shared CDP connection and target options.
// - List and normalize Chrome targets.
// - Filter targets by target type.
// - Get a target by its exact target ID.
// - Find targets by target ID, title, or URL.
// - Activate, reload, open, and close Chrome targets.
//
// Design:
// - Targets are normalized to targetId, type, title, and url.
// - Target IDs are recognized as 32-character hexadecimal strings.
// - Target ID matching is exact and case-insensitive.
// - Title and URL matching is partial and case-insensitive.
// - findTarget returns the first matching target.
// - findTargets returns all targets matching any keyword.
// - Reload operations use a temporary client that is always closed.
//
// Version: 0.1.0
// Last modified: 2026-07-15
// -----------------------------------------------------------------------------

import CDP from "chrome-remote-interface";
import { config } from "../infra/config.js";

const defaultHost = "127.0.0.1";
const defaultPort = 9222;
const defaultTargetType = "page";
const targetIdRE = /^[0-9A-F]{32}$/i;

const configHost = config.get("cdp.host");
const configPort = config.get("cdp.port");
const configTargetType = config.get("cdp.targetType");

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Resolve CDP connection and target options.
 *
 * @example
 * const options = getCdpOptions({
 *   cdpPort: 9333,
 *   targetType: "page",
 * });
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Chrome target type.
 *
 * @returns {Object}
 * Resolved CDP options containing host, port, and targetType.
 */
export function getCdpOptions(options = {}) {
  return {
    host: options.cdpHost ?? configHost ?? defaultHost,
    port: options.cdpPort ?? configPort ?? defaultPort,
    targetType: options.targetType ?? configTargetType ?? defaultTargetType,
  };
}

/**
 * List Chrome targets.
 *
 * Only targets matching the configured target type are returned.
 * By default, only targets with type "page" are included.
 *
 * @example
 * const targets = await listTargets();
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @returns {Promise<Object[]>}
 * Normalized Chrome targets.
 */
export async function listTargets(options = {}) {
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

/**
 * Get a Chrome target by its exact target ID.
 *
 * @example
 * const target = await getTarget(targetId);
 *
 * @param {string} targetId
 * Exact Chrome target ID.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @returns {Promise<Object>}
 * Matching Chrome target.
 *
 * @throws {Error}
 * Throws if the target does not exist.
 */
export async function getTarget(targetId, options = {}) {
  const targets = await listTargets(options);

  const target = targets.find(
    (target) => target.targetId.toLowerCase() === targetId.toLowerCase(),
  );

  if (!target) {
    throw new Error(`target not found: ${targetId}`);
  }

  return target;
}

/**
 * Find the first Chrome target matching a keyword.
 *
 * A 32-character hexadecimal target ID is matched exactly.
 * Other keywords are matched partially against the title
 * and URL. Matching is case-insensitive.
 *
 * @example
 * const target = await findTarget("example");
 *
 * @param {string} keyword
 * Target ID, title, or URL keyword.
 *
 * @param {Object} [options]
 * Find options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @param {boolean} [options.throwIfNotFound=true]
 * Throw an error if no target matches.
 *
 * @returns {Promise<Object|null>}
 * First matching Chrome target.
 * Returns null when no target matches and throwIfNotFound is false.
 *
 * @throws {Error}
 * Throws if keyword is not a non-empty string.
 * Throws if no target matches and throwIfNotFound is true.
 */
export async function findTarget(keyword, options = {}) {
  const { throwIfNotFound = true } = options;

  if (typeof keyword !== "string" || keyword.trim() === "") {
    throw new Error(`keyword must be a non-empty string`);
  }

  const search = keyword.trim().toLowerCase();
  const targets = await listTargets(options);

  const target =
    targets.find((target) => {
      if (isTargetId(search)) {
        return target.targetId.toLowerCase() === search;
      }

      if (target.title.toLowerCase().includes(search)) return true;
      if (target.url.toLowerCase().includes(search)) return true;

      return false;
    }) ?? null;

  if (!target && throwIfNotFound) {
    throw new Error(`target not found: ${keyword}`);
  }

  return target;
}

/**
 * Find Chrome targets matching one or more keywords.
 *
 * A 32-character hexadecimal target ID is matched exactly.
 * Other keywords are matched partially against the title
 * and URL. Matching is case-insensitive.
 *
 * A target is returned if it matches any keyword.
 *
 * @example
 * const targets = await findTargets([
 *   "example",
 *   "localhost",
 * ]);
 *
 * @param {string|string[]} keywords
 * Target ID, title, or URL keywords.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @param {string} [options.targetType="page"]
 * Target type to include.
 *
 * @returns {Promise<Object[]>}
 * Matching Chrome targets.
 *
 * @throws {Error}
 * Throws if any keyword is not a non-empty string.
 */
export async function findTargets(keywords, options = {}) {
  const targets = await listTargets(options);

  let search = Array.isArray(keywords) ? keywords : [keywords];
  search = search.map((keyword) => {
    if (typeof keyword !== "string" || keyword.trim() === "") {
      throw new Error(`keyword must be a non-empty string`);
    }

    return keyword.trim().toLowerCase();
  });

  return targets.filter((target) => {
    return search.some((keyword) => {
      if (isTargetId(keyword)) {
        return target.targetId.toLowerCase() === keyword;
      }

      if (target.title.toLowerCase().includes(keyword)) return true;
      if (target.url.toLowerCase().includes(keyword)) return true;

      return false;
    });
  });
}

/**
 * Activate a Chrome target.
 *
 * @example
 * await activateTarget(targetId);
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<void>}
 * Resolves after the target has been activated.
 */
export async function activateTarget(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  await CDP.Activate({
    host,
    port,
    id: targetId,
  });
}

/**
 * Reload a Chrome target without using the cache.
 *
 * A temporary CDP client is created for the target
 * and always closed after the reload request.
 *
 * @example
 * await reloadTarget(targetId);
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<void>}
 * Resolves after the reload request has been sent.
 */
export async function reloadTarget(targetId, options = {}) {
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

/**
 * Open a new Chrome target.
 *
 * @example
 * const target = await openTarget(
 *   "https://example.com"
 * );
 *
 * @param {string} url
 * URL to open.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<Object>}
 * Newly opened Chrome target.
 */
export async function openTarget(url, options = {}) {
  const { host, port } = getCdpOptions(options);

  const target = await CDP.New({
    host,
    port,
    url,
  });

  return normalizeTarget(target);
}

/**
 * Close a Chrome target.
 *
 * @example
 * await closeTarget(targetId);
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * CDP options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<void>}
 * Resolves after the close request has been accepted.
 */
export async function closeTarget(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  await CDP.Close({
    host,
    port,
    id: targetId,
  });
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function isTargetId(value) {
  return typeof value === "string" && targetIdRE.test(value);
}

function normalizeTarget(target) {
  return {
    targetId: target.id,
    type: target.type ?? "",
    title: target.title ?? "",
    url: target.url ?? "",
  };
}
