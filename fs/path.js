// -----------------------------------------------------------------------------
// fs/path
// -----------------------------------------------------------------------------
// Local path and directory utilities.
//
// Public API:
// - exists(filePath)
// - isFile(filePath)
// - isDirectory(dirPath)
// - joinPath(...segments)
// - ensureDir(dirPath)
// - removeDir(dirPath)
//
// Design:
// - All methods are synchronous.
// - Check methods return false for invalid empty/non-string paths.
// - ensureDir creates a directory recursively and succeeds if it already exists.
// - removeDir removes a directory recursively and succeeds if it does not exist.
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

// -----------------------------------------------------------------------------
// Directory helpers
// -----------------------------------------------------------------------------

export function ensureDir(dirPath) {
  assertDirPath(dirPath);

  fs.mkdirSync(dirPath, { recursive: true });

  return true;
}

export function removeDir(dirPath) {
  assertDirPath(dirPath);

  if (!fs.existsSync(dirPath)) {
    return true;
  }

  fs.rmSync(dirPath, { recursive: true, force: true });

  return true;
}

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

function assertDirPath(dirPath) {
  if (typeof dirPath !== "string" || dirPath.length === 0) {
    throw new Error("invalid dir path");
  }
}