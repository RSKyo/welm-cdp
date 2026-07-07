// -----------------------------------------------------------------------------
// fs/scan
// -----------------------------------------------------------------------------
// Local recursive file and directory scanning utilities.
//
// Public API:
// - scanFiles(input, options)
// - scanDirs(dirPath, options)
//
// scanFiles options:
// - includeExts: include only specific file extensions, e.g. [".mp3", ".flac"]
// - excludeExts: exclude specific file extensions, e.g. [".jpg", ".png"]
// - includeKeywords: include files whose base name contains any keyword, e.g. ["live"]
// - excludeKeywords: exclude files whose base name contains any keyword, e.g. ["demo"]
// - includeHidden: include hidden files and directories, default false
//
// scanDirs options:
// - includeKeywords: include directories whose base name contains any keyword, e.g. ["album"]
// - excludeKeywords: exclude directories whose base name contains any keyword, e.g. ["tmp"]
// - includeHidden: include hidden directories, default false
//
// Design:
// - All methods are synchronous.
// - scanFiles accepts either a file path or a directory path.
// - scanFiles returns file entries only, not directory entries.
// - scanDirs accepts a directory path only.
// - scanDirs returns subdirectory entries only, not file entries.
// - scanDirs does not include the root directory itself.
// - Hidden files and directories are skipped by default.
// - File extension filters only apply to files.
// - Keyword filters apply to returned entries, not parent traversal.
// - Non-matching parent directories are still traversed unless hidden.
//
// Version: 0.2.0
// Last modified: 2026-07-07
// -----------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";

// -----------------------------------------------------------------------------
// Scan files
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Scan directories
// -----------------------------------------------------------------------------

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

    const fullPath = path.join(dirPath, item.name);

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

    const fullPath = path.join(dirPath, item.name);

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
  return isHiddenName(path.basename(filePath));
}

function isHiddenName(name) {
  return name.startsWith(".");
}

function matchPath(targetPath, options = {}, entry = {}) {
  const base = path.basename(targetPath).toLowerCase();
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

  const ext = path.extname(targetPath).toLowerCase();

  if (options.includeExts && !options.includeExts.includes(ext)) {
    return false;
  }

  if (options.excludeExts && options.excludeExts.includes(ext)) {
    return false;
  }

  return true;
}

function createFileEntry(filePath) {
  const parsed = path.parse(filePath);

  return {
    ...parsed,
    filePath,
  };
}

function createDirEntry(dirPath) {
  const parsed = path.parse(dirPath);

  return {
    ...parsed,
    dirPath,
  };
}