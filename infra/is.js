import fs from "node:fs";
import nodePath from "node:path";

// -----------------------------------------------------------------------------
// common environment
// -----------------------------------------------------------------------------

/** Nullish */

export function isNullish(value) {
  return value === null || value === undefined;
}

export function isNullishOrEmpty(value) {
  if (isNullish(value)) {
    return true;
  }

  if (isString(value)) {
    return value.trim() === "";
  }

  if (isArray(value)) {
    return value.length === 0;
  }

  if (isMap(value) || isSet(value)) {
    return value.size === 0;
  }

  if (isPlainObject(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
}

/** String */

export function isString(value) {
  return typeof value === "string";
}

export function isNonBlankString(value) {
  return typeof value === "string" && value.trim() !== "";
}

/** Number */

export function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function isInteger(value) {
  return isNumber(value) && Number.isInteger(value);
}

export function isPositive(value) {
  return isNumber(value) && value > 0;
}

export function isNegative(value) {
  return isNumber(value) && value < 0;
}

export function isNonNegative(value) {
  return isNumber(value) && value >= 0;
}

export function isNonPositive(value) {
  return isNumber(value) && value <= 0;
}

export function isPositiveInteger(value) {
  return isInteger(value) && value > 0;
}

export function isNonNegativeInteger(value) {
  return isInteger(value) && value >= 0;
}

export function isNegativeInteger(value) {
  return isInteger(value) && value < 0;
}

export function isNonPositiveInteger(value) {
  return isInteger(value) && value <= 0;
}

/** Boolean */

export function isBoolean(value) {
  return typeof value === "boolean";
}

/** Array */

export function isArray(value) {
  return Array.isArray(value);
}

export function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

export function isNonBlankStringArray(value) {
  return Array.isArray(value) && value.every((item) => isNonBlankString(item));
}

export function isNonEmptyNonBlankStringArray(value) {
  return isNonEmptyArray(value) && isNonBlankStringArray(value);
}

export function isPlainObjectArray(value) {
  return Array.isArray(value) && value.every((item) => isPlainObject(item));
}

export function isNonEmptyPlainObjectArray(value) {
  return isNonEmptyArray(value) && isPlainObjectArray(value);
}

/** Map and Set */

export function isMap(value) {
  return Object.prototype.toString.call(value) === "[object Map]";
}

export function isSet(value) {
  return Object.prototype.toString.call(value) === "[object Set]";
}

/** Object */

export function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }

  const proto = Object.getPrototypeOf(value);

  return proto === Object.prototype || proto === null;
}

/** Function */

export function isFunction(value) {
  return typeof value === "function";
}

/** URL */

export function isValidUrl(value) {
  return parseUrl(value) !== null;
}

export function isHttpUrl(value) {
  const url = parseUrl(value);

  return url?.protocol === "http:" || url?.protocol === "https:";
}

function parseUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** Value */

// Uint8Array
export function isUint8Array(value) {
  return value instanceof Uint8Array;
}

// SameValueZero
export function isSameValueZero(a, b) {
  // NaN != NaN, but we consider them equal in SameValueZero comparison
  // a != a means a is NaN
  // b != b means b is NaN
  return a === b || (a !== a && b !== b);
}

// -----------------------------------------------------------------------------
// for node environment
// -----------------------------------------------------------------------------

// Port
export function isPort(port) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// CDP Target ID
export function isCDPTargetId(value) {
  const targetIdRE = /^[0-9A-F]{32}$/i;
  return isNonBlankString(value) && targetIdRE.test(value);
}

// Buffer
export function isBuffer(value) {
  return Buffer.isBuffer(value);
}

/** Path, File, and Directory */

// Path
export function isPath(value) {
  return isNonBlankString(value) && !value.includes("\0");
}

// Absolute Path
export function isAbsolutePath(value) {
  return isPath(value) && nodePath.isAbsolute(value);
}

// Existing Path
export function isExistingPath(value) {
  return isPath(value) && fs.existsSync(value);
}

// Existing File
export function isExistingFile(value) {
  return isExistingPath(value) && fs.statSync(value).isFile();
}

// Existing Directory
export function isExistingDirectory(value) {
  return isExistingPath(value) && fs.statSync(value).isDirectory();
}
