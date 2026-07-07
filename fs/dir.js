// -----------------------------------------------------------------------------
// fs/dir
// -----------------------------------------------------------------------------
// Local directory utilities.
//
// Public API:
// - createDir(dirPath)
// - ensureDir(dirPath)
// - removeDir(dirPath)
// - emptyDir(dirPath)
// - readDir(dirPath, options)
// - listDir(dirPath, options)
// - copyDir(fromPath, toPath)
// - moveDir(fromPath, toPath)
//
// Design:
// - All methods are synchronous.
// - createDir creates a new directory and throws if it already exists.
// - ensureDir creates a directory recursively and succeeds if it already exists.
// - removeDir removes a directory recursively.
// - emptyDir removes all children but keeps the directory itself.
// - readDir returns names.
// - listDir returns structured entries.
// - copyDir copies a directory recursively.
// - moveDir moves/renames a directory.
//
// Version: 0.1.0
// Last modified: 2026-07-07
// -----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

// -----------------------------------------------------------------------------
// Create / ensure / remove
// -----------------------------------------------------------------------------

export function createDir(dirPath) {
  assertDirPath(dirPath);

  fs.mkdirSync(dirPath);

  return true;
}

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

export function emptyDir(dirPath) {
  assertDirPath(dirPath);
  ensureDir(dirPath);

  const names = fs.readdirSync(dirPath);

  for (const name of names) {
    const fullPath = path.join(dirPath, name);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }

  return true;
}

// -----------------------------------------------------------------------------
// Read / list
// -----------------------------------------------------------------------------

export function readDir(dirPath, options = {}) {
  assertDirPath(dirPath);

  const { includeHidden = true } = options;

  let names = fs.readdirSync(dirPath);

  if (!includeHidden) {
    names = names.filter((name) => !isHiddenName(name));
  }

  return names;
}

export function listDir(dirPath, options = {}) {
  assertDirPath(dirPath);

  const { includeHidden = true } = options;

  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const result = [];

  for (const item of items) {
    if (!includeHidden && isHiddenName(item.name)) {
      continue;
    }

    result.push(createDirEntry(dirPath, item));
  }

  return result;
}

// -----------------------------------------------------------------------------
// Copy / move
// -----------------------------------------------------------------------------

export function copyDir(fromPath, toPath) {
  assertDirPath(fromPath);
  assertDirPath(toPath);

  if (!fs.existsSync(fromPath)) {
    throw new Error(`directory not found: ${fromPath}`);
  }

  const stat = fs.statSync(fromPath);

  if (!stat.isDirectory()) {
    throw new Error(`not a directory: ${fromPath}`);
  }

  fs.cpSync(fromPath, toPath, { recursive: true });

  return true;
}

export function moveDir(fromPath, toPath) {
  assertDirPath(fromPath);
  assertDirPath(toPath);

  if (!fs.existsSync(fromPath)) {
    throw new Error(`directory not found: ${fromPath}`);
  }

  const stat = fs.statSync(fromPath);

  if (!stat.isDirectory()) {
    throw new Error(`not a directory: ${fromPath}`);
  }

  ensureParentDir(toPath);

  fs.renameSync(fromPath, toPath);

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

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);

  if (!dir || dir === ".") {
    return;
  }

  fs.mkdirSync(dir, { recursive: true });
}

function isHiddenName(name) {
  return name.startsWith(".");
}

function createDirEntry(dirPath, item) {
  const fullPath = path.join(dirPath, item.name);

  return {
    name: item.name,
    path: fullPath,
    dir: dirPath,
    isFile: item.isFile(),
    isDirectory: item.isDirectory(),
    isSymbolicLink: item.isSymbolicLink(),
  };
}