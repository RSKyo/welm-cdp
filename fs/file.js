// -----------------------------------------------------------------------------
// fs/file
// -----------------------------------------------------------------------------
// Local file read/write utilities.
//
// Public API:
// - moveFileTo(filePath, toFilePath, options)
// - copyFileTo(filePath, toFilePath, options)
// - removeFile(filePath)
// - renameFile(filePath, name)
//
// - readFileText(filePath, options)
// - writeFileText(filePath, text, options)
// - readFileJson(filePath, options)
// - writeFileJson(filePath, value, options)
// - readFileBuffer(filePath)
// - writeFileBuffer(filePath, buffer, options)
// - readFileBase64(filePath)
// - writeFileBase64(filePath, base64, options)
//
// Features:
// - File move, copy, remove, and rename operations.
// - Text, JSON, Buffer, and Base64 file read/write operations.
// - Parent directories are created automatically before writing files.
// - JSON output supports configurable indentation and final newline.
//
// Design:
// - All methods are synchronous.
// - Public read/write methods stay flat and do not call each other.
// - Public read/write methods use internal low-level helpers.
// - Write operations do not overwrite existing files by default.
// - Cross-device file moves automatically fallback to copy and remove.
// - Read methods throw when the target file does not exist.
// - Write methods create missing parent directories automatically.
//
// Version: 0.1.0
// Last modified: 2026-07-07
// -----------------------------------------------------------------------------

import fs from "node:fs";
import nodePath from "node:path";

// -----------------------------------------------------------------------------
// Public API: File Operations
// -----------------------------------------------------------------------------

/**
 * Move a file to a new location.
 *
 * @example
 * const newPath = moveFileTo(
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
export function moveFileTo(filePath, toFilePath, options = {}) {
  assertExistingFile(filePath, "filePath");
  assertFileIfExists(toFilePath, "toFilePath");

  const { overwrite = false } = options;

  if (fs.existsSync(toFilePath)) {
    if (!overwrite) {
      return toFilePath;
    }

    fs.rmSync(toFilePath);
  }

  const toDirPath = nodePath.dirname(toFilePath);
  ensureDir(toDirPath);

  try {
    // Moving within the same file system is fast and preserves metadata.
    fs.renameSync(filePath, toFilePath);
  } catch (error) {
    if (error?.code !== "EXDEV") {
      throw error;
    }

    // Cross-device moves cannot use rename, so copy and then remove the source.
    fs.copyFileSync(filePath, toFilePath);
    fs.rmSync(filePath);
  }

  return toFilePath;
}

/**
 * Copy a file to a new location.
 *
 * @example
 * const copiedPath = copyFileTo(
 *   "/tmp/a.txt",
 *   "/backup/a.txt",
 *   {
 *     overwrite: true,
 *   }
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
export function copyFileTo(filePath, toFilePath, options = {}) {
  assertExistingFile(filePath, "filePath");
  assertFileIfExists(toFilePath, "toFilePath");

  const { overwrite = false } = options;

  const toDirPath = nodePath.dirname(toFilePath);
  ensureDir(toDirPath);

  // mode 0: overwrite the existing target file.
  // COPYFILE_EXCL: throw EEXIST if the target file already exists.
  const mode = overwrite ? 0 : fs.constants.COPYFILE_EXCL;

  try {
    fs.copyFileSync(filePath, toFilePath, mode);
  } catch (error) {
    if (error?.code === "EEXIST") {
      return toFilePath;
    }

    throw error;
  }

  return toFilePath;
}

/**
 * Remove a file.
 *
 * @example
 * removeFile("/tmp/a.txt");
 *
 * @param {string} filePath
 * File path to remove.
 *
 * @returns {boolean}
 * Returns true after successful removal.
 */
export function removeFile(filePath) {
  assertExistingFile(filePath, "filePath");

  fs.rmSync(filePath);

  return true;
}

/**
 * Rename a file in the same directory.
 *
 * @example
 * const newPath = renameFile(
 *   "/tmp/a.txt",
 *   "b.txt"
 * );
 *
 * @param {string} filePath
 * Existing file path.
 *
 * @param {string} name
 * New file name.
 * If the extension is omitted, the original extension is preserved.
 *
 * @returns {string}
 * New file path.
 */
export function renameFile(filePath, name) {
  assertExistingFile(filePath, "filePath");
  assertNonBlankString(name, "name");

  if (
    nodePath.basename(name) !== name ||
    nodePath.win32.basename(name) !== name
  ) {
    throw new Error(`invalid file name: ${name}`);
  }

  const ext = nodePath.extname(filePath);
  const fileName = nodePath.basename(filePath);

  const newExt = nodePath.extname(name);
  const newFileName = newExt ? name : `${name}${ext}`;

  if (fileName === newFileName) {
    return filePath;
  }

  const newFilePath = nodePath.join(nodePath.dirname(filePath), newFileName);

  if (fs.existsSync(newFilePath)) {
    throw new Error(`target file already exists: ${newFilePath}`);
  }

  fs.renameSync(filePath, newFilePath);

  return newFilePath;
}

// -----------------------------------------------------------------------------
// Public API: Text / JSON
// -----------------------------------------------------------------------------

/**
 * Read a text file.
 *
 * @example
 * const text = readFileText("/tmp/config.txt");
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
export function readFileText(filePath, options = {}) {
  assertExistingFile(filePath, "filePath");

  const { encoding = "utf8" } = options;

  return readFile(filePath).toString(encoding);
}

/**
 * Write text content to a file.
 *
 * @example
 * writeFileText(
 *   "/tmp/config.txt",
 *   "hello",
 *   {
 *     overwrite: true,
 *   }
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
 * @param {boolean} [options.overwrite=false]
 * Overwrite the existing file.
 *
 * @returns {string}
 * Target file path.
 */
export function writeFileText(filePath, text, options = {}) {
  assertFileIfExists(filePath, "filePath");
  assertNonBlankString(text, "text");

  const { encoding = "utf8", overwrite = false } = options;

  return writeFile(filePath, String(text), { encoding, overwrite });
}

/**
 * Read a JSON file.
 *
 * @example
 * const config = readFileJson("/tmp/config.json");
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
export function readFileJson(filePath, options = {}) {
  assertExistingFile(filePath, "filePath");

  const { encoding = "utf8" } = options;

  const text = readFile(filePath).toString(encoding);

  return JSON.parse(stripBom(text));
}

/**
 * Write a value as JSON file.
 *
 * @example
 * writeFileJson(
 *   "/tmp/config.json",
 *   {
 *     name: "test",
 *   },
 *   {
 *     overwrite: true,
 *   }
 * );
 *
 * @param {string} filePath
 * Target JSON file path.
 *
 * @param {any} value
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
 * @param {boolean} [options.overwrite=false]
 * Overwrite the existing file.
 *
 * @returns {string}
 * Target file path.
 */
export function writeFileJson(filePath, value, options = {}) {
  assertFileIfExists(filePath, "filePath");

  const {
    spaces = 2,
    finalNewline = true,
    encoding = "utf8",
    overwrite = false,
  } = options;

  // it will throw an error if value is not JSON serializable
  // example: circular reference, BigInt, undefined, function, symbol
  // don't catch the error here, let it bubble up to the caller
  let text = JSON.stringify(value, null, spaces);

  if (text === undefined) {
    throw new Error("value is not JSON serializable");
  }

  if (finalNewline) {
    text += "\n";
  }

  return writeFile(filePath, text, { encoding, overwrite });
}

// -----------------------------------------------------------------------------
// Public API: Binary / Base64
// -----------------------------------------------------------------------------

/**
 * Read a file as Buffer.
 *
 * @example
 * const buffer = readFileBuffer("/tmp/image.bin");
 *
 * @param {string} filePath
 * File path.
 *
 * @returns {Buffer}
 * File content buffer.
 */
export function readFileBuffer(filePath) {
  assertExistingFile(filePath, "filePath");

  return readFile(filePath);
}

/**
 * Write Buffer data to a file.
 *
 * @example
 * writeFileBuffer(
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
 * @param {Object} [options]
 * Write options.
 *
 * @param {boolean} [options.overwrite=false]
 * Overwrite the existing file.
 *
 * @returns {string}
 * Target file path.
 */
export function writeFileBuffer(filePath, buffer, options = {}) {
  assertFileIfExists(filePath, "filePath");
  assertBuffer(buffer, "buffer");

  const { overwrite = false } = options;

  return writeFile(filePath, buffer, { overwrite });
}

/**
 * Read a file and return Base64 encoded content.
 *
 * @example
 * const base64 = readFileBase64("/tmp/image.png");
 *
 * @param {string} filePath
 * File path.
 *
 * @returns {string}
 * Base64 encoded content.
 */
export function readFileBase64(filePath) {
  assertExistingFile(filePath, "filePath");

  return readFile(filePath).toString("base64");
}

/**
 * Write Base64 encoded content to a file.
 *
 * @example
 * writeFileBase64(
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
 * @param {Object} [options]
 * Write options.
 *
 * @param {boolean} [options.overwrite=false]
 * Overwrite the existing file.
 *
 * @returns {string}
 * Target file path.
 */
export function writeFileBase64(filePath, base64, options = {}) {
  const clean = normalizeBase64(base64);

  const { overwrite = false } = options;

  return writeFile(filePath, Buffer.from(clean, "base64"), { overwrite });
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

// Assertions

function assertBuffer(value, fieldName = "value") {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
    throw new Error(`${fieldName} must be a Buffer or Uint8Array`);
  }

  return value;
}

function assertNonBlankString(value, fieldName = "value") {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} must be a non-blank string`);
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

function ensureDir(dirPath) {
  assertPath(dirPath, "dirPath");

  if (
    dirPath === "/" ||
    dirPath === "." ||
    dirPath === "./" ||
    dirPath === ".." ||
    dirPath === "../" ||
    dirPath === "~" ||
    dirPath === "~/"
  ) {
    return;
  }

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
}

function readFile(filePath) {
  // default encoding is null to return a Buffer instead of a string
  // toString() can be called later with the desired encoding
  return fs.readFileSync(filePath);
}

function writeFile(filePath, data, options = {}) {
  const dir = nodePath.dirname(filePath);
  ensureDir(dir);

  const encoding = options.encoding || null;
  const overwrite = options.overwrite || false;

  // Use flag "wx" to write the file only if it does not exist.
  // Use flag "w" to overwrite the file if it exists.
  const writeOptions = { flag: overwrite ? "w" : "wx" };
  if (encoding) {
    writeOptions.encoding = encoding;
  }

  try {
    fs.writeFileSync(filePath, data, writeOptions);
  } catch (error) {
    if (error?.code === "EEXIST") {
      return filePath;
    }

    throw error;
  }

  return filePath;
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

function normalizeBase64(base64) {
  if (typeof base64 !== "string") {
    throw new Error("invalid base64");
  }

  const clean = base64.replace(/^data:[^,]*;base64,/, "").replace(/\s+/g, "");

  if (clean.length % 4 === 1) {
    throw new Error("invalid base64");
  }

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
    throw new Error("invalid base64");
  }

  return clean;
}
