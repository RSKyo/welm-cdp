// -----------------------------------------------------------------------------
// fs/scan
// -----------------------------------------------------------------------------
// Local recursive file and directory scanning utilities.
//
// Public API:
// - scanFiles(input, options)
// - scanDirs(dirPath, options)
//
// Features:
// - Recursive file and directory traversal.
// - File filtering by extension and name keywords.
// - Directory filtering by name keywords.
// - Optional hidden file and directory inclusion.
//
// Design:
// - All methods are synchronous.
// - scanFiles accepts either a file path or a directory path.
// - scanFiles returns file entries only, not directory entries.
// - scanDirs accepts a directory path only.
// - scanDirs returns subdirectory entries only, not the root directory.
// - Hidden files and directories are skipped by default.
// - Extension filters only apply to files.
// - Keyword filters apply to returned entries, not traversal.
// - Non-matching parent directories are still traversed.
//
// Version: 0.2.0
// Last modified: 2026-07-07
// -----------------------------------------------------------------------------

import fs from "node:fs";
import nodePath from "node:path";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Recursively scan files from a file or directory path.
 *
 * @example
 * const files = scanFiles("/music", {
 *   includeExts: [".mp3", ".flac"],
 *   excludeKeywords: ["demo"],
 * });
 *
 * @param {string} input
 * File path or directory path to scan.
 *
 * @param {Object} [options]
 * Scan options.
 *
 * @param {string[]} [options.includeExts]
 * Include only files with specified extensions.
 * Extensions can be written with or without a leading dot.
 * Example: [".mp3", "flac"]
 *
 * @param {string[]} [options.excludeExts]
 * Exclude files with specified extensions.
 * Example: [".jpg", ".png"]
 *
 * @param {string[]} [options.includeKeywords]
 * Include files whose name contains any keyword.
 * Example: ["live", "concert"]
 *
 * @param {string[]} [options.excludeKeywords]
 * Exclude files whose name contains any keyword.
 * Example: ["demo", "test"]
 *
 * @param {boolean} [options.includeHidden=false]
 * Include hidden files and directories.
 *
 * @returns {{
 *   root: string,
 *   dir: string,
 *   base: string,
 *   ext: string,
 *   name: string,
 *   filePath: string
 * }[]}
 *
 * Array of file entries.
 *
 * Each entry contains:
 * 
 * - root: Root part of the path.
 * - dir: Directory path containing the file.
 * - base: File name with extension.
 * - ext: File extension including the leading dot.
 * - name: File name without extension.
 * - filePath: Full file path.
 */
export function scanFiles(input, options = {}) {
  if (!input || !fs.existsSync(input)) {
    return [];
  }

  const scanOptions = normalizeScanOptions(options);

  if (!scanOptions.includeHidden && isHiddenPath(input)) {
    return [];
  }

  const stat = fs.statSync(input);

  if (stat.isDirectory()) {
    return walkFiles(input, scanOptions);
  }

  if (stat.isFile()) {
    if (!matchPath(input, scanOptions, { isFile: true })) {
      return [];
    }

    return [createFileEntry(input)];
  }

  return [];
}

/**
 * Recursively scan subdirectories from a directory path.
 *
 * @example
 * const dirs = scanDirs("/music", {
 *   includeKeywords: ["album"],
 *   excludeKeywords: ["temp"],
 * });
 *
 * @param {string} dirPath
 * Directory path to scan.
 *
 * @param {Object} [options]
 * Scan options.
 *
 * @param {string[]} [options.includeKeywords]
 * Include directories whose name contains any keyword.
 * Example: ["album", "artist"]
 *
 * @param {string[]} [options.excludeKeywords]
 * Exclude directories whose name contains any keyword.
 * Example: ["temp", "cache"]
 *
 * @param {boolean} [options.includeHidden=false]
 * Include hidden directories.
 *
 * @returns {{
 *   root: string,
 *   dir: string,
 *   base: string,
 *   ext: string,
 *   name: string,
 *   dirPath: string
 * }[]}
 *
 * Array of directory entries.
 *
 * Each entry contains:
 *
 * - root: Root part of the path.
 * - dir: Parent directory path.
 * - base: Directory name.
 * - ext: Directory extension, usually empty.
 * - name: Directory name without extension.
 * - dirPath: Full directory path.
 */
export function scanDirs(dirPath, options = {}) {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return [];
  }

  const scanOptions = normalizeScanOptions(options);

  if (!scanOptions.includeHidden && isHiddenPath(dirPath)) {
    return [];
  }

  const stat = fs.statSync(dirPath);

  if (!stat.isDirectory()) {
    return [];
  }

  return walkDirs(dirPath, scanOptions);
}

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

function walkFiles(dirPath, options = {}) {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return [];
  }

  const result = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    if (!options.includeHidden && isHiddenName(item.name)) {
      continue;
    }

    const fullPath = nodePath.join(dirPath, item.name);

    if (item.isDirectory()) {
      result.push(...walkFiles(fullPath, options));
      continue;
    }

    if (!item.isFile()) {
      continue;
    }

    if (!matchPath(fullPath, options, { isFile: true })) {
      continue;
    }

    result.push(createFileEntry(fullPath));
  }

  return result;
}

function walkDirs(dirPath, options = {}) {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return [];
  }

  const result = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    if (!options.includeHidden && isHiddenName(item.name)) {
      continue;
    }

    if (!item.isDirectory()) {
      continue;
    }

    const fullPath = nodePath.join(dirPath, item.name);

    if (matchPath(fullPath, options, { isFile: false })) {
      result.push(createDirEntry(fullPath));
    }

    result.push(...walkDirs(fullPath, options));
  }

  return result;
}

function normalizeScanOptions(options = {}) {
  return {
    ...options,
    includeHidden: options.includeHidden === true,
    includeExts: normalizeExts(options.includeExts),
    excludeExts: normalizeExts(options.excludeExts),
    includeKeywords: normalizeKeywords(options.includeKeywords),
    excludeKeywords: normalizeKeywords(options.excludeKeywords),
  };
}

function normalizeExts(exts) {
  if (!exts) {
    return null;
  }

  return exts.map((ext) => {
    ext = String(ext).toLowerCase();
    return ext.startsWith(".") ? ext : `.${ext}`;
  });
}

function normalizeKeywords(keywords) {
  if (!keywords) {
    return null;
  }

  return keywords.map((keyword) => String(keyword).toLowerCase());
}

function isHiddenPath(filePath) {
  return isHiddenName(nodePath.basename(filePath));
}

function isHiddenName(name) {
  return name.startsWith(".");
}

function matchPath(targetPath, options = {}, entry = {}) {
  const base = nodePath.basename(targetPath).toLowerCase();
  const isFile = entry.isFile === true;

  if (
    options.includeKeywords &&
    !options.includeKeywords.some((keyword) => base.includes(keyword))
  ) {
    return false;
  }

  if (
    options.excludeKeywords &&
    options.excludeKeywords.some((keyword) => base.includes(keyword))
  ) {
    return false;
  }

  if (!isFile) {
    return true;
  }

  const ext = nodePath.extname(targetPath).toLowerCase();

  if (options.includeExts && !options.includeExts.includes(ext)) {
    return false;
  }

  if (options.excludeExts && options.excludeExts.includes(ext)) {
    return false;
  }

  return true;
}

function createFileEntry(filePath) {
  const parsed = nodePath.parse(filePath);

  return {
    ...parsed,
    filePath,
  };
}

function createDirEntry(dirPath) {
  const parsed = nodePath.parse(dirPath);

  return {
    ...parsed,
    dirPath,
  };
}