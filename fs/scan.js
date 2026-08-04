/**
 * File and directory scanning utilities.
 *
 * Provides recursive file and directory scanning with optional hidden-item,
 * file-name, extension, and directory-name filters.
 *
 * Directory filters apply only when scanning from a directory:
 *
 * - `includeDirs` includes matching directories and all of their descendants.
 * - `excludeDirs` skips matching directories and their entire subtrees.
 * - A single-file input to `scanFiles()` uses file filters only.
 * - The root directory passed to `scanDirs()` is not matched or returned.
 * 
 * Version: 0.3.0
 * Last modified: 2026-08-05
 */

import fs from "node:fs";
import nodePath from "node:path";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Recursively scan files from a file or directory path.
 *
 * When `input` is a file, only file filters are applied. Directory filters do
 * not apply to a single-file input.
 *
 * When `input` is a directory, `includeDirs` limits results to matching
 * directories and their descendants. `excludeDirs` skips matching directories
 * and their entire subtrees.
 *
 * @example
 * const files = scanFiles("/music", {
 *   includeExts: [".mp3", ".flac"],
 *   excludeDirs: ["temp"],
 * });
 *
 * @param {string} input
 * File path or directory path to scan.
 *
 * @param {Object} [options]
 * Scan options.
 *
 * @param {boolean} [options.includeHidden=false]
 * Whether to include hidden files and directories.
 *
 * @param {string|string[]} [options.includeExts]
 * Include only files with the specified extensions.
 * Extensions can be written with or without a leading dot.
 *
 * @param {string|string[]} [options.excludeExts]
 * Exclude files with the specified extensions.
 * Extensions can be written with or without a leading dot.
 *
 * @param {string|string[]} [options.includeFiles]
 * Include only files whose names contain any keyword.
 *
 * @param {string|string[]} [options.excludeFiles]
 * Exclude files whose names contain any keyword.
 *
 * @param {string|string[]} [options.includeDirs]
 * Include files only from matching directories and their descendants.
 *
 * @param {string|string[]} [options.excludeDirs]
 * Exclude matching directories and their descendants.
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
    if (!matchFile(input, scanOptions)) {
      return [];
    }

    return [createFileEntry(input)];
  }

  return [];
}

/**
 * Recursively scan child directories from a directory path.
 *
 * The input directory itself is not matched, filtered, or returned. Only its
 * child directories are considered.
 *
 * `includeDirs` includes matching directories and their descendants.
 * `excludeDirs` skips matching directories and their entire subtrees.
 *
 * @example
 * const dirs = scanDirs("/music", {
 *   includeDirs: ["album"],
 *   excludeDirs: ["temp"],
 * });
 *
 * @param {string} input
 * Directory path to scan.
 *
 * @param {Object} [options]
 * Scan options.
 *
 * @param {boolean} [options.includeHidden=false]
 * Whether to include hidden directories.
 *
 * @param {string|string[]} [options.includeDirs]
 * Include only matching directories and their descendants.
 *
 * @param {string|string[]} [options.excludeDirs]
 * Exclude matching directories and their descendants.
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

function isHiddenPath(filePath) {
  return isHiddenName(nodePath.basename(filePath));
}

function isHiddenName(name) {
  return name.startsWith(".");
}

function walkFiles(dirPath, options = {}, isInIncludedDir = false) {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return [];
  }

  const dirName = nodePath.basename(dirPath).toLowerCase();

  const isCurrentDirIncluded =
    isInIncludedDir ||
    !options.includeDirs ||
    options.includeDirs.length === 0 ||
    options.includeDirs.some((keyword) => dirName.includes(keyword));

  const isCurrentDirExcluded =
    options.excludeDirs &&
    options.excludeDirs.length > 0 &&
    options.excludeDirs.some((keyword) => dirName.includes(keyword));

  // 排除目录及其整个子树。
  if (isCurrentDirExcluded) {
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
      result.push(...walkFiles(fullPath, options, isCurrentDirIncluded));
      continue;
    }

    if (isCurrentDirIncluded && item.isFile() && matchFile(fullPath, options)) {
      result.push(createFileEntry(fullPath));
    }
  }

  return result;
}

function walkDirs(dirPath, options = {}, isInIncludedDir = false) {
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

    const isCurrentDirIncluded =
      isInIncludedDir ||
      !options.includeDirs ||
      options.includeDirs.length === 0 ||
      options.includeDirs.some((keyword) =>
        item.name.toLowerCase().includes(keyword),
      );

    const isCurrentDirExcluded =
      options.excludeDirs &&
      options.excludeDirs.length > 0 &&
      options.excludeDirs.some((keyword) =>
        item.name.toLowerCase().includes(keyword),
      );

    // 排除目录及其整个子树。
    if (isCurrentDirExcluded) {
      continue;
    }

    // 包含目录及其子目录。
    if (isCurrentDirIncluded) {
      result.push(createDirEntry(fullPath));
    }

    result.push(...walkDirs(fullPath, options, isCurrentDirIncluded));
  }

  return result;
}

function normalizeScanOptions(options = {}) {
  return {
    ...options,
    includeHidden: options.includeHidden === true,
    includeExts: normalizeValues(options.includeExts, "."),
    excludeExts: normalizeValues(options.excludeExts, "."),
    includeDirs: normalizeValues(options.includeDirs),
    excludeDirs: normalizeValues(options.excludeDirs),
    includeFiles: normalizeValues(options.includeFiles),
    excludeFiles: normalizeValues(options.excludeFiles),
  };
}

function normalizeValues(values, prefix = "") {
  if (values == null) {
    return [];
  }

  if (typeof values !== "string" && !Array.isArray(values)) {
    throw new Error("values must be a string or an array of strings");
  }

  const rawValues = Array.isArray(values) ? values : [values];

  return [
    ...new Set(
      rawValues.map((value) => {
        if (typeof value !== "string" || value.trim() === "") {
          throw new Error("value must be a non-empty string");
        }

        value = value.trim().toLowerCase();
        value = value.startsWith(prefix) ? value : `${prefix}${value}`;
        return value;
      }),
    ),
  ];
}

function matchFile(targetPath, options = {}) {
  const base = nodePath.basename(targetPath).toLowerCase();
  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    if (
      options.includeFiles.length > 0 &&
      !options.includeFiles.some((keyword) => base.includes(keyword))
    ) {
      return false;
    }

    if (
      options.excludeFiles.length > 0 &&
      options.excludeFiles.some((keyword) => base.includes(keyword))
    ) {
      return false;
    }

    const ext = nodePath.extname(targetPath).toLowerCase();

    if (options.includeExts.length > 0 && !options.includeExts.includes(ext)) {
      return false;
    }

    if (options.excludeExts.length > 0 && options.excludeExts.includes(ext)) {
      return false;
    }
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
