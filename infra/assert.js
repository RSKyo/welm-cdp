import * as is from "./is.js";
export * from "./is.js";
export * from "./assert-base.js";

// Port
export function assertPort(port, fieldName = "port") {
  if (!is.isPort(port)) {
    throw new Error(`${fieldName} must be an integer between 1 and 65535`);
  }
}

// CDP Target ID
export function assertCDPTargetId(targetId, fieldName = "targetId") {
  if (!is.isCDPTargetId(targetId)) {
    throw new Error(
      `${fieldName} must be a valid CDP target ID (32-character hexadecimal string)`,
    );
  }
}

// Buffer
export function assertBuffer(buffer, fieldName = "value") {
  if (!is.isBuffer(buffer)) {
    throw new Error(`${fieldName} must be a Buffer`);
  }
}

/** Path, File, and Directory */

// Path
export function assertPath(value, fieldName = "value") {
  if (!is.isPath(value)) {
    throw new Error(`${fieldName} must be a valid path`);
  }
}

// Absolute Path
export function assertAbsolutePath(value, fieldName = "value") {
  if (!is.isAbsolutePath(value)) {
    throw new Error(`${fieldName} must be an absolute path`);
  }
}

// Existing Path
export function assertExistingPath(value, fieldName = "value") {
  if (!is.isExistingPath(value)) {
    throw new Error(`${fieldName} must be an existing path`);
  }
}

// Existing File
export function assertExistingFile(value, fieldName = "value") {
  if (!is.isExistingFile(value)) {
    throw new Error(`${fieldName} must be an existing file`);
  }
}

// Existing Directory
export function assertExistingDirectory(value, fieldName = "value") {
  if (!is.isExistingDirectory(value)) {
    throw new Error(`${fieldName} must be an existing directory`);
  }
}

// File If Exists
export function assertFileIfExists(value, fieldName = "value") {
  assertPath(value, fieldName);

  if (!is.isExistingPath(value)) return;

  if (!is.isExistingFile(value)) {
    throw new Error(`${fieldName} must be a file if it exists`);
  }
}

// Directory If Exists
export function assertDirectoryIfExists(value, fieldName = "value") {
  assertPath(value, fieldName);

  if (!is.isExistingPath(value)) return;

  if (!is.isExistingDirectory(value)) {
    throw new Error(`${fieldName} must be a directory if it exists`);
  }
}
