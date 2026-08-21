import {
  isAbsolutePath,
  isArray,
  isBoolean,
  isBuffer,
  isExistingDirectory,
  isExistingFile,
  isExistingPath,
  isFunction,
  isHttpUrl,
  isInteger,
  isNegative,
  isNegativeInteger,
  isNonBlankString,
  isNonBlankStringArray,
  isNonEmptyArray,
  isNonEmptyNonBlankStringArray,
  isNonEmptyPlainObjectArray,
  isNonNegative,
  isNonNegativeInteger,
  isNonPositive,
  isNonPositiveInteger,
  isNullish,
  isNumber,
  isPath,
  isPlainObject,
  isPlainObjectArray,
  isPositive,
  isPositiveInteger,
  isString,
  isValidEmail,
  isValidUrl,
} from "./is.js";

export * from "./is.js";

// Required

export function assertRequired(value, fieldName = "value") {
  if (isNullish(value)) {
    throw new Error(`${fieldName} is required`);
  }
}

// String

export function assertString(value, fieldName = "value") {
  if (!isString(value)) {
    throw new Error(`${fieldName} must be a string`);
  }
}

export function assertNonBlankString(value, fieldName = "value") {
  if (!isNonBlankString(value)) {
    throw new Error(`${fieldName} must not be blank`);
  }
}

// Number

export function assertNumber(value, fieldName = "value") {
  if (!isNumber(value)) {
    throw new Error(`${fieldName} must be a finite number`);
  }
}

export function assertInteger(value, fieldName = "value") {
  if (!isInteger(value)) {
    throw new Error(`${fieldName} must be an integer`);
  }
}

export function assertPositive(value, fieldName = "value") {
  if (!isPositive(value)) {
    throw new Error(`${fieldName} must be a positive number`);
  }
}

export function assertNegative(value, fieldName = "value") {
  if (!isNegative(value)) {
    throw new Error(`${fieldName} must be a negative number`);
  }
}

export function assertNonNegative(value, fieldName = "value") {
  if (!isNonNegative(value)) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
}

export function assertNonPositive(value, fieldName = "value") {
  if (!isNonPositive(value)) {
    throw new Error(`${fieldName} must be a non-positive number`);
  }
}

export function assertPositiveInteger(value, fieldName = "value") {
  if (!isPositiveInteger(value)) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
}

export function assertNonNegativeInteger(value, fieldName = "value") {
  if (!isNonNegativeInteger(value)) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
}

export function assertNegativeInteger(value, fieldName = "value") {
  if (!isNegativeInteger(value)) {
    throw new Error(`${fieldName} must be a negative integer`);
  }
}

export function assertNonPositiveInteger(value, fieldName = "value") {
  if (!isNonPositiveInteger(value)) {
    throw new Error(`${fieldName} must be a non-positive integer`);
  }
}

// Boolean

export function assertBoolean(value, fieldName = "value") {
  if (!isBoolean(value)) {
    throw new Error(`${fieldName} must be a boolean`);
  }
}

// Array

export function assertArray(value, fieldName = "value") {
  if (!isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
}

export function assertNonEmptyArray(value, fieldName = "value") {
  if (!isNonEmptyArray(value)) {
    throw new Error(`${fieldName} must be a non-empty array`);
  }
}

export function assertNonBlankStringArray(value, fieldName = "value") {
  if (!isNonBlankStringArray(value)) {
    throw new Error(`${fieldName} must be an array of non-blank strings`);
  }
}

export function assertNonEmptyNonBlankStringArray(value, fieldName = "value") {
  if (!isNonEmptyNonBlankStringArray(value)) {
    throw new Error(
      `${fieldName} must be a non-empty array of non-blank strings`,
    );
  }
}

export function assertPlainObjectArray(value, fieldName = "value") {
  if (!isPlainObjectArray(value)) {
    throw new Error(`${fieldName} must be an array of plain objects`);
  }
}

export function assertNonEmptyPlainObjectArray(value, fieldName = "value") {
  if (!isNonEmptyPlainObjectArray(value)) {
    throw new Error(`${fieldName} must be a non-empty array of plain objects`);
  }
}

export function assertNonBlankStringOrArray(value, fieldName = "value") {
  if (!isNonBlankString(value) && !isNonBlankStringArray(value)) {
    throw new Error(
      `${fieldName} must be a non-blank string or an array of non-blank strings`,
    );
  }
}

export function assertNonBlankStringOrNonEmptyArray(
  value,
  fieldName = "value",
) {
  if (!isNonBlankString(value) && !isNonEmptyNonBlankStringArray(value)) {
    throw new Error(
      `${fieldName} must be a non-blank string or a non-empty array of non-blank strings`,
    );
  }
}

export function assertPlainObjectOrArray(value, fieldName = "value") {
  if (!isPlainObject(value) && !isPlainObjectArray(value)) {
    throw new Error(
      `${fieldName} must be a plain object or an array of plain objects`,
    );
  }
}

export function assertPlainObjectOrNonEmptyArray(value, fieldName = "value") {
  if (!isPlainObject(value) && !isNonEmptyPlainObjectArray(value)) {
    throw new Error(
      `${fieldName} must be a plain object or a non-empty array of plain objects`,
    );
  }
}

// Function

export function assertFunction(value, fieldName = "value") {
  if (!isFunction(value)) {
    throw new Error(`${fieldName} must be a function`);
  }
}

// Object

export function assertPlainObject(value, fieldName = "value") {
  if (!isPlainObject(value)) {
    throw new Error(`${fieldName} must be a plain object`);
  }
}

// Path

export function assertPath(value, fieldName = "value") {
  if (!isPath(value)) {
    throw new Error(`${fieldName} must be a valid path`);
  }
}

export function assertAbsolutePath(value, fieldName = "value") {
  if (!isAbsolutePath(value)) {
    throw new Error(`${fieldName} must be an absolute path`);
  }
}

export function assertExistingPath(value, fieldName = "value") {
  if (!isExistingPath(value)) {
    throw new Error(`${fieldName} must be an existing path`);
  }
}

export function assertExistingFile(value, fieldName = "value") {
  if (!isExistingFile(value)) {
    throw new Error(`${fieldName} must be an existing file`);
  }
}

export function assertFileIfExists(value, fieldName = "value") {
  assertPath(value, fieldName);

  if (!isExistingPath(value)) return;

  if (!isExistingFile(value)) {
    throw new Error(`${fieldName} must be a file if it exists`);
  }
}

// Directory

export function assertExistingDirectory(value, fieldName = "value") {
  if (!isExistingDirectory(value)) {
    throw new Error(`${fieldName} must be an existing directory`);
  }
}

export function assertDirectoryIfExists(value, fieldName = "value") {
  assertPath(value, fieldName);

  if (!isExistingPath(value)) return;

  if (!isExistingDirectory(value)) {
    throw new Error(`${fieldName} must be a directory if it exists`);
  }
}

// -----------------------------------------------------------------------------
// Web
// -----------------------------------------------------------------------------

// Email

export function assertEmail(value, fieldName = "value") {
  if (!isValidEmail(value)) {
    throw new Error(`${fieldName} must be a valid email address`);
  }
}

// URL

export function assertUrl(value, fieldName = "value") {
  if (!isValidUrl(value)) {
    throw new Error(`${fieldName} must be a valid URL`);
  }
}

export function assertHttpUrl(value, fieldName = "value") {
  if (!isHttpUrl(value)) {
    throw new Error(`${fieldName} must be an HTTP or HTTPS URL`);
  }
}

// HTML Element

export function assertHtmlElement(value, fieldName = "value") {
  if (!isHtmlElement(value)) {
    throw new Error(`${fieldName} must be an HTML element`);
  }
}

export function assertElementNode(value, fieldName = "value") {
  if (!isElementNode(value)) {
    throw new Error(`${fieldName} must be an element node`);
  }
}

export function assertSelectorOrHtmlElement(value, fieldName = "value") {
  if (!isNonBlankString(value) && !isHtmlElement(value)) {
    throw new Error(
      `${fieldName} must be a non-blank selector string or an HTML element`,
    );
  }
}

export function assertSelectorOrElementNode(value, fieldName = "value") {
  if (!isNonBlankString(value) && !isElementNode(value)) {
    throw new Error(
      `${fieldName} must be a non-blank selector string or an element node`,
    );
  }
}

// -----------------------------------------------------------------------------
// Other
// -----------------------------------------------------------------------------

// Buffer
export function assertBuffer(buffer, fieldName = "value") {
  if (!isBuffer(buffer)) {
    throw new Error(`${fieldName} must be a Buffer or Uint8Array`);
  }
}

// Base64
export function assertBase64(base64, fieldName = "base64") {
  if (!isString(base64)) {
    throw new Error(`${fieldName} must be a string`);
  }

  const clean = base64.replace(/^data:[^,]*;base64,/, "").replace(/\s+/g, "");

  if (clean.length % 4 === 1) {
    throw new Error(`invalid ${fieldName}`);
  }

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
    throw new Error(`invalid ${fieldName}`);
  }

  return clean;
}

// Port
export function assertPort(port, fieldName = "port") {
  if (!isPort(port)) {
    throw new Error(`${fieldName} must be an integer between 1 and 65535`);
  }
}

// CDP Target ID
export function assertCDPTargetId(targetId, fieldName = "targetId") {
  if (!isCDPTargetId(targetId)) {
    throw new Error(
      `${fieldName} must be a valid CDP target ID (32-character hexadecimal string)`,
    );
  }
}

// Key existence assertions
export function assertKeyExists(key, target, fieldName = "key") {
  assertNonBlankString(key, fieldName);

  if (!hasKey(target, key)) {
    throw new Error(`${fieldName} not found: ${key}`);
  }
}

export function assertKeyNotExists(key, target, fieldName = "key") {
  assertNonBlankString(key, fieldName);

  if (hasKey(target, key)) {
    throw new Error(`${fieldName} already exists: ${key}`);
  }
}

function hasKey(target, key) {
  if (isPlainObject(target)) {
    return Object.hasOwn(target, key);
  }

  if (isMap(target)) {
    return target.has(key);
  }

  throw new Error("target must be a plain object or a Map");
}

// Value existence assertions
export function assertValueExists(value, target, fieldName = "value") {
  if (!hasValue(target, value)) {
    throw new Error(`${fieldName} not found: ${value}`);
  }
}

export function assertValueNotExists(value, target, fieldName = "value") {
  if (hasValue(target, value)) {
    throw new Error(`${fieldName} already exists: ${value}`);
  }
}

// SameValue means NaN = NaN, +0 != -0, and all other values are compared by ===
// SameValue is used by: Object.is()
// SameValueZero means NaN = NaN, +0 = -0, and all other values are compared by ===
// SameValueZero is used by: Array.includes(), Set.has(), Map.has()
function hasValue(target, value) {
  if (isArray(target)) {
    return target.includes(value);
  }

  if (isSet(target)) {
    return target.has(value);
  }

  if (isPlainObject(target)) {
    for (const key of Object.keys(target)) {
      if (isSameValueZero(target[key], value)) {
        return true;
      }
    }

    return false;
  }

  if (isMap(target)) {
    for (const item of target.values()) {
      if (isSameValueZero(item, value)) {
        return true;
      }
    }

    return false;
  }

  throw new Error("target must be an Array, a Set, a Plain Object, or a Map");
}
