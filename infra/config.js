// -----------------------------------------------------------------------------
// common/config
// -----------------------------------------------------------------------------
// Shared persistent configuration for Welm projects.
//
// Configuration file:
// - ~/.local/share/welm/config.json
//
// Public API:
// - config.load()
// - config.get(keyPath)
// - config.set(keyPath, value)
//
// Design:
// - Configuration is stored as one JSON object.
// - Projects use top-level namespaces such as cdp and radio.
// - get() and set() use dot keyPath such as "cdp.chromeBin".
// - Missing configuration files are treated as empty objects.
// - Files are written through a temporary file and atomically replaced.
// - Read and write operations are synchronous because configuration is small
//   and normally accessed only during startup or explicit configuration changes.
//
// Version: 0.2.0
// Last modified: 2026-07-17
// -----------------------------------------------------------------------------

import fs from "node:fs";
import os from "node:os";
import nodePath from "node:path";

const WELM_HOME = nodePath.join(os.homedir(), ".local", "share", "welm");

const CONFIG_PATH = nodePath.join(WELM_HOME, "config.json");

const unsafePathKeys = new Set(["__proto__", "constructor", "prototype"]);

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export const config = {
  load,
  get,
  set,
};

/**
 * Load the complete configuration object.
 *
 * @returns {Object}
 * Complete configuration object.
 */
function load() {
  return readConfigFile();
}

/**
 * Get a configuration value by dot path.
 *
 * @example
 * const chromeBin = config.get("cdp.chromeBin");
 *
 * @param {string} keyPath
 * Non-empty dot path such as "cdp.chromeBin".
 *
 * @returns {*}
 * Configuration value, or undefined when the path does not exist.
 */
function get(keyPath) {
  const keys = resolveKeyPath(keyPath);
  const configJson = readConfigFile();

  return getDeepValue(configJson, keys);
}

/**
 * Set a configuration value by dot path.
 *
 * Missing intermediate objects are created automatically.
 * Existing intermediate values that are not plain objects
 * are replaced with plain objects.
 *
 * @example
 * config.set(
 *   "cdp.chromeBin",
 *   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
 * );
 *
 * @param {string} keyPath
 * Non-empty dot path such as "cdp.chromeBin".
 *
 * @param {*} value
 * JSON-serializable configuration value.
 *
 * @returns {boolean}
 * Returns true after the value has been written.
 */
function set(keyPath, value) {
  const keys = resolveKeyPath(keyPath);

  if (value === undefined) {
    throw new Error("[config] value must not be undefined");
  }

  const configJson = readConfigFile();

  setDeepValue(configJson, keys, value);
  writeConfigFile(configJson);

  return true;
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function readConfigFile() {
  let raw;

  try {
    raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {};
    }

    throw error;
  }

  if (raw.trim() === "") {
    return {};
  }

  let configJson;

  try {
    configJson = JSON.parse(raw);
  } catch {
    throw new Error(`[config] invalid JSON file: ${CONFIG_PATH}`);
  }

  if (!isPlainObject(configJson)) {
    throw new Error(
      `[config] config root must be a plain object: ${CONFIG_PATH}`,
    );
  }

  return configJson;
}

function writeConfigFile(configJson) {
  fs.mkdirSync(WELM_HOME, {
    recursive: true,
  });

  const content = JSON.stringify(configJson, null, 2);

  const tempPath = `${CONFIG_PATH}.${process.pid}.${Date.now()}.tmp`;

  try {
    fs.writeFileSync(tempPath, content, "utf-8");
    fs.renameSync(tempPath, CONFIG_PATH);
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

function resolveKeyPath(keyPath) {
  if (typeof keyPath !== "string" || keyPath.trim() === "") {
    throw new Error("[config] path must be a non-empty string");
  }

  const keys = keyPath.split(".");

  return keys.map((key) => {
    if (key.trim() === "") {
      throw new Error(`[config] invalid path: ${keyPath}`);
    }

    if (unsafePathKeys.has(key.trim())) {
      throw new Error(`[config] unsafe path key: ${key}`);
    }

    return key.trim();
  });
}

function getDeepValue(obj, keys) {
  let current = obj;

  for (const key of keys) {
    if (
      current === null ||
      typeof current !== "object" ||
      !Object.hasOwn(current, key)
    ) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function setDeepValue(obj, keys, value) {
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (!isPlainObject(current[key])) {
      current[key] = {};
    }

    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}
