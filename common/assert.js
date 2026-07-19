import fs from "node:fs";
import nodePath from "node:path";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

// Required

export function assertRequired(value, fieldName = "value") {
  if (isNullish(value)) {
    throw new Error(`${fieldName} is required`);
  }

  return value;
}

// String

export function assertString(value, fieldName = "value") {
  if (!isString(value)) {
    throw new Error(`${fieldName} must be a string`);
  }

  return value;
}

export function assertNonBlankString(value, fieldName = "value") {
  if (!isNonBlankString(value)) {
    throw new Error(`${fieldName} must not be blank`);
  }

  return value;
}

// Number

export function assertNumber(value, fieldName = "value") {
  if (!isNumber(value)) {
    throw new Error(`${fieldName} must be a finite number`);
  }

  return value;
}

export function assertInteger(value, fieldName = "value") {
  if (!isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }

  return value;
}

export function assertPositive(value, fieldName = "value") {
  if (!isPositive(value)) {
    throw new Error(`${fieldName} must be a positive number`);
  }

  return value;
}

export function assertNegative(value, fieldName = "value") {
  if (!isNegative(value)) {
    throw new Error(`${fieldName} must be a negative number`);
  }

  return value;
}

// Boolean

export function assertBoolean(value, fieldName = "value") {
  if (!isBoolean(value)) {
    throw new Error(`${fieldName} must be a boolean`);
  }

  return value;
}

// Array

export function assertArray(value, fieldName = "value") {
  if (!isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }

  return value;
}

export function assertNonEmptyArray(value, fieldName = "value") {
  if (!isArray(value) || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty array`);
  }

  return value;
}

export function assertNonBlankStringOrArray(value, fieldName = "value") {
  if (isNonBlankString(value) || isArray(value)) {
    return value;
  }

  throw new Error(`${fieldName} must be a non-blank string or an array`);
}

// Object

export function assertPlainObject(value, fieldName = "value") {
  if (!isPlainObject(value)) {
    throw new Error(`${fieldName} must be a plain object`);
  }

  return value;
}

// Email

export function assertEmail(value, fieldName = "value") {
  if (!isValidEmail(value)) {
    throw new Error(`${fieldName} must be a valid email address`);
  }

  return value;
}

// URL

export function assertUrl(value, fieldName = "value") {
  if (!isValidUrl(value)) {
    throw new Error(`${fieldName} must be a valid URL`);
  }

  return value;
}

export function assertHttpUrl(value, fieldName = "value") {
  if (!isHttpUrl(value)) {
    throw new Error(`${fieldName} must be an HTTP or HTTPS URL`);
  }

  return value;
}

// Path

export function assertPath(value, fieldName = "value") {
  if (!isNonBlankString(value) || value.includes("\0")) {
    throw new Error(`${fieldName} must be a valid path`);
  }

  return value;
}

export function assertAbsolutePath(value, fieldName = "value") {
  assertPath(value, fieldName);

  if (!nodePath.isAbsolute(value)) {
    throw new Error(`${fieldName} must be an absolute path`);
  }

  return value;
}

export function assertExistingPath(value, fieldName = "value") {
  assertPath(value, fieldName);

  if (!fs.existsSync(value)) {
    throw new Error(`${fieldName} does not exist: ${value}`);
  }

  return value;
}

export function assertExistingFile(value, fieldName = "value") {
  assertExistingPath(value, fieldName);

  if (!fs.statSync(value).isFile()) {
    throw new Error(`${fieldName} is not a file: ${value}`);
  }

  return value;
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

// Nullish

const isNullish = (value) => value === null || value === undefined;

// String

const isString = (value) => typeof value === "string";

const isNonBlankString = (value) =>
  typeof value === "string" && value.trim() !== "";

// Number

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

const isInteger = (value) => isNumber(value) && Number.isInteger(value);

const isPositive = (value) => isNumber(value) && value > 0;

const isNegative = (value) => isNumber(value) && value < 0;

// Boolean

const isBoolean = (value) => typeof value === "boolean";

// Array

const isArray = (value) => Array.isArray(value);

const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;

// Object

const isPlainObject = (value) => {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }

  const proto = Object.getPrototypeOf(value);

  return proto === Object.prototype || proto === null;
};

// Email

const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// URL

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

const isValidUrl = (value) => parseUrl(value) !== null;

const isHttpUrl = (value) => {
  const url = parseUrl(value);

  return url?.protocol === "http:" || url?.protocol === "https:";
};
