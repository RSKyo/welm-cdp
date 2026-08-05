// -----------------------------------------------------------------------------
// fs/file
// -----------------------------------------------------------------------------
// Local file read/write utilities.
//
// Public API:
// - copyFileToSync(filePath, toFilePath, options)
// - moveFileToSync(filePath, toFilePath, options)
// - removeFileSync(filePath)
// - renameFileSync(filePath, newName)
//
// - readFileTextSync(filePath, options)
// - writeFileTextSync(filePath, text, options)
// - readFileJsonSync(filePath, options)
// - writeFileJsonSync(filePath, json, options)
// - readFileBufferSync(filePath)
// - writeFileBufferSync(filePath, buffer)
// - readFileBase64Sync(filePath)
// - writeFileBase64Sync(filePath, base64)
//
// Features:
// - File move, copy, remove, and rename operations.
// - Text, JSON, Buffer, and Base64 file read/write operations.
// - Parent directories are created automatically before writing files.
// - JSON output supports configurable indentation and final newline.
//
// Design:
// - All methods are synchronous.
// - Public methods validate their inputs before calling Node's fs APIs.
// - Write operations overwrite existing files by default.
// - Copy, move, and rename operations do not overwrite targets by default.
// - Cross-device file moves automatically fallback to copy and remove.
// - Read methods throw when the target file does not exist.
// - Write methods create missing parent directories automatically.
//
// Version: 0.1.0
// Last modified: 2026-08-05
// -----------------------------------------------------------------------------

import fs from "node:fs";
import nodePath from "node:path";

// -----------------------------------------------------------------------------
// Public API: File Operations
// -----------------------------------------------------------------------------

/**
 * Copy a file to a new location.
 *
 * @example
 * const copiedPath = copyFileToSync(
 *   "/tmp/a.txt",
 *   "/backup/a.txt",
 * );
 *
 * @param {string} filePath
 * Source file path.
 *
 * @param {string} toFilePath
 * Target file path.
 * Parent directories are created automatically.
 *
 * @param {Object} [options]
 * Copy options.
 *
 * @param {boolean} [options.overwrite=false]
 * Overwrite the target file if it already exists.
 *
 * @returns {string}
 * Target file path.
 */
export function copyFileToSync(filePath, toFilePath, options = {}) {
  assertExistingFile(filePath, "filePath");
  assertFileIfExists(toFilePath, "toFilePath");

  if (nodePath.resolve(filePath) === nodePath.resolve(toFilePath)) {
    return toFilePath;
  }

  const { overwrite = false } = options;

  if (fs.existsSync(toFilePath) && !overwrite) {
    throw new Error(`target file already exists: ${toFilePath}`);
  }

  ensureDir(nodePath.dirname(toFilePath));

  // Reaching here means the target is absent or overwriting is allowed.
  fs.copyFileSync(filePath, toFilePath, 0);

  return toFilePath;
}

/**
 * Move a file to a new location.
 *
 * @example
 * const newPath = moveFileToSync(
 *   "/tmp/a.txt",
 *   "/backup/a.txt"
 * );
 *
 * @param {string} filePath
 * Source file path.
 *
 * @param {string} toFilePath
 * Target file path.
 * Parent directories are created automatically.
 *
 * @param {Object} [options]
 * Move options.
 *
 * @param {boolean} [options.overwrite=false]
 * Overwrite the target file if it already exists.
 *
 * @returns {string}
 * Target file path.
 */
export function moveFileToSync(filePath, toFilePath, options = {}) {
  assertExistingFile(filePath, "filePath");
  assertFileIfExists(toFilePath, "toFilePath");

  if (nodePath.resolve(filePath) === nodePath.resolve(toFilePath)) {
    return toFilePath;
  }

  const { overwrite = false } = options;

  if (fs.existsSync(toFilePath) && !overwrite) {
    throw new Error(`target file already exists: ${toFilePath}`);
  }

  ensureDir(nodePath.dirname(toFilePath));

  try {
    // Fast move within the same file system.
    // renameSync does overwrite if the target file exists.
    fs.renameSync(filePath, toFilePath);
  } catch (error) {
    if (error?.code !== "EXDEV") {
      throw error;
    }

    // Cross-device move: copy first, then remove the source.
    // 0: overwrite the existing target file.
    // COPYFILE_EXCL: throw EEXIST if the target file already exists.
    fs.copyFileSync(filePath, toFilePath, 0);
    fs.rmSync(filePath);
  }

  return toFilePath;
}

/**
 * Remove a file.
 * Does nothing when the file does not exist.
 *
 * @example
 * removeFileSync("/tmp/a.txt");
 *
 * @param {string} filePath
 * File path to remove.
 */
export function removeFileSync(filePath) {
  assertFileIfExists(filePath, "filePath");

  fs.rmSync(filePath, { force: true });
}

/**
 * Rename a file in the same directory.
 *
 * @example
 * const newPath = renameFileSync(
 *   "/tmp/a.txt",
 *   "b.txt"
 * );
 *
 * @param {string} filePath
 * Existing file path.
 *
 * @param {string} newName
 * New file name.
 * If the extension is omitted, the original extension is preserved.
 *
 * @returns {string}
 * New file path.
 */
export function renameFileSync(filePath, newName) {
  assertExistingFile(filePath, "filePath");
  assertFileName(newName, "newName");

  const dir = nodePath.dirname(filePath);
  const ext = nodePath.extname(filePath);

  const targetExt = nodePath.extname(newName);
  const targetName = targetExt ? newName : `${newName}${ext}`;
  const targetPath = nodePath.join(dir, targetName);

  if (nodePath.resolve(targetPath) === nodePath.resolve(filePath)) {
    return filePath;
  }

  if (fs.existsSync(targetPath)) {
    throw new Error(`target file already exists: ${targetPath}`);
  }

  fs.renameSync(filePath, targetPath);

  return targetPath;
}

// -----------------------------------------------------------------------------
// Public API: Text / JSON
// -----------------------------------------------------------------------------

/**
 * Read a text file.
 *
 * @example
 * const text = readFileTextSync("/tmp/config.txt");
 *
 * @param {string} filePath
 * Text file path.
 *
 * @param {Object} [options]
 * Read options.
 *
 * @param {BufferEncoding} [options.encoding="utf8"]
 * Text encoding.
 *
 * @returns {string}
 * File content as string.
 */
export function readFileTextSync(filePath, options = {}) {
  assertExistingFile(filePath, "filePath");

  const { encoding = "utf8" } = options;

  return fs.readFileSync(filePath).toString(encoding);
}

/**
 * Write text content to a file.
 *
 * @example
 * writeFileTextSync(
 *   "/tmp/config.txt",
 *   "hello",
 * );
 *
 * @param {string} filePath
 * Target file path.
 *
 * @param {string} text
 * Text content to write.
 *
 * @param {Object} [options]
 * Write options.
 *
 * @param {BufferEncoding} [options.encoding="utf8"]
 * Text encoding.
 *
 * @returns {string}
 * Target file path.
 */
export function writeFileTextSync(filePath, text, options = {}) {
  assertFileIfExists(filePath, "filePath");
  assertString(text, "text");

  const { encoding = "utf8" } = options;

  ensureDir(nodePath.dirname(filePath));

  fs.writeFileSync(filePath, text, { encoding });

  return filePath;
}

/**
 * Read a JSON file.
 *
 * @example
 * const config = readFileJsonSync("/tmp/config.json");
 *
 * @param {string} filePath
 * JSON file path.
 *
 * @param {Object} [options]
 * Read options.
 *
 * @param {BufferEncoding} [options.encoding="utf8"]
 * Text encoding.
 *
 * @returns {Object}
 * Parsed JSON value.
 */
export function readFileJsonSync(filePath, options = {}) {
  assertExistingFile(filePath, "filePath");

  const { encoding = "utf8" } = options;

  const text = fs.readFileSync(filePath).toString(encoding);

  return JSON.parse(stripBom(text));
}

/**
 * Write a value as JSON file.
 *
 * @example
 * writeFileJsonSync(
 *   "/tmp/config.json",
 *   {
 *     name: "test",
 *   },
 * );
 *
 * @param {string} filePath
 * Target JSON file path.
 *
 * @param {any} json
 * JSON serializable value.
 *
 * @param {Object} [options]
 * Write options.
 *
 * @param {number} [options.spaces=2]
 * JSON indentation spaces.
 *
 * @param {boolean} [options.finalNewline=true]
 * Append a newline after JSON content.
 *
 * @param {BufferEncoding} [options.encoding="utf8"]
 * Text encoding.
 *
 * @returns {string}
 * Target file path.
 */
export function writeFileJsonSync(filePath, json, options = {}) {
  assertFileIfExists(filePath, "filePath");

  const { spaces = 2, finalNewline = true, encoding = "utf8" } = options;

  // JSON.stringify throws for circular references and BigInt values.
  // For unsupported top-level values such as undefined, function, and symbol,
  // it returns undefined instead.
  // Don't catch the error here, let it bubble up to the caller
  let text = JSON.stringify(json, null, spaces);
  if (text === undefined) {
    throw new Error("value is not JSON serializable");
  }

  if (finalNewline) {
    text += "\n";
  }

  ensureDir(nodePath.dirname(filePath));

  fs.writeFileSync(filePath, text, { encoding });

  return filePath;
}

// -----------------------------------------------------------------------------
// Public API: Binary / Base64
// -----------------------------------------------------------------------------

/**
 * Read a file as Buffer.
 *
 * @example
 * const buffer = readFileBufferSync("/tmp/image.bin");
 *
 * @param {string} filePath
 * File path.
 *
 * @returns {Buffer}
 * File content buffer.
 */
export function readFileBufferSync(filePath) {
  assertExistingFile(filePath, "filePath");

  return fs.readFileSync(filePath);
}

/**
 * Write Buffer data to a file.
 *
 * @example
 * writeFileBufferSync(
 *   "/tmp/image.bin",
 *   buffer
 * );
 *
 * @param {string} filePath
 * Target file path.
 *
 * @param {Buffer|Uint8Array} buffer
 * Binary content.
 *
 * @returns {string}
 * Target file path.
 */
export function writeFileBufferSync(filePath, buffer) {
  assertFileIfExists(filePath, "filePath");
  assertBuffer(buffer, "buffer");

  ensureDir(nodePath.dirname(filePath));

  fs.writeFileSync(filePath, buffer);

  return filePath;
}

/**
 * Read a file and return Base64 encoded content (synchronously).
 *
 * @example
 * const base64 = readFileBase64Sync("/tmp/image.png");
 *
 * @param {string} filePath
 * File path.
 *
 * @returns {string}
 * Base64 encoded content.
 */
export function readFileBase64Sync(filePath) {
  assertExistingFile(filePath, "filePath");

  return fs.readFileSync(filePath).toString("base64");
}

/**
 * Write Base64 encoded content to a file.
 *
 * @example
 * writeFileBase64Sync(
 *   "/tmp/image.png",
 *   base64
 * );
 *
 * @param {string} filePath
 * Target file path.
 *
 * @param {string} base64
 * Base64 encoded content.
 * Data URLs with prefix are supported.
 *
 * @returns {string}
 * Target file path.
 */
export function writeFileBase64Sync(filePath, base64) {
  assertFileIfExists(filePath, "filePath");
  const cleanBase64 = assertBase64(base64, "base64");

  ensureDir(nodePath.dirname(filePath));

  fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));

  return filePath;
}

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

function assertFileName(name, fieldName = "name") {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error(`${fieldName} must be a non-blank string`);
  }

  if (name.includes("\0")) {
    throw new Error(`invalid ${fieldName}: ${name}`);
  }

  if (
    name === "." ||
    name === ".." ||
    nodePath.basename(name) !== name ||
    nodePath.win32.basename(name) !== name
  ) {
    throw new Error(`invalid ${fieldName}: ${name}`);
  }

  return name;
}

function assertString(value, fieldName = "value") {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }

  return value;
}

function assertPath(path, fieldName = "path") {
  if (typeof path !== "string" || path.length === 0 || path.includes("\0")) {
    throw new Error(`invalid ${fieldName}: ${path}`);
  }

  return path;
}

function assertExistingPath(path, fieldName = "path") {
  assertPath(path, fieldName);

  if (!fs.existsSync(path)) {
    throw new Error(`path does not exist: ${path}`);
  }

  return path;
}

function assertExistingFile(filePath, fieldName = "path") {
  assertExistingPath(filePath, fieldName);

  if (!fs.statSync(filePath).isFile()) {
    throw new Error(`not a file: ${filePath}`);
  }

  return filePath;
}

function assertFileIfExists(filePath, fieldName = "path") {
  assertPath(filePath, fieldName);

  if (fs.existsSync(filePath) && !fs.statSync(filePath).isFile()) {
    throw new Error(`not a file: ${filePath}`);
  }

  return filePath;
}

function assertBuffer(buffer, fieldName = "value") {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new Error(`${fieldName} must be a Buffer or Uint8Array`);
  }

  return buffer;
}

function assertBase64(base64, fieldName = "base64") {
  if (typeof base64 !== "string") {
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

function ensureDir(dirPath) {
  assertPath(dirPath, "dirPath");

  if (fs.existsSync(dirPath)) {
    if (!fs.statSync(dirPath).isDirectory()) {
      throw new Error(`not a directory: ${dirPath}`);
    }

    return dirPath;
  }

  fs.mkdirSync(dirPath, { recursive: true });

  return dirPath;
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}
