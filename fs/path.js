// -----------------------------------------------------------------------------
// fs/path
// -----------------------------------------------------------------------------
// Local path utilities.
//
// Public API:
// - exists(filePath)
// - isFile(filePath)
// - isDirectory(dirPath)
// - joinPath(...segments)
// - ensureDir(dirPath)
//
// Design:
// - All methods are synchronous.
// - Invalid empty/non-string paths return false for check methods.
// - ensureDir throws on invalid input.
// - ensureDir creates parent directories recursively.
//
// Version: 0.1.0
// Last modified: 2026-07-07
// -----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

// -----------------------------------------------------------------------------
// Path existence and type checks
// -----------------------------------------------------------------------------

export function exists(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return false;
  }

  return fs.existsSync(filePath);
}

export function isFile(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return false;
  }

  try {
    const stat = fs.statSync(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export function isDirectory(dirPath) {
  if (!dirPath || typeof dirPath !== "string") {
    return false;
  }

  try {
    const stat = fs.statSync(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Path helpers
// -----------------------------------------------------------------------------

export function joinPath(...segments) {
  return path.join(...segments);
}
