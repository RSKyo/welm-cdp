// -----------------------------------------------------------------------------
// fs/file
// -----------------------------------------------------------------------------
// Local file read/write utilities.
//
// Public API:
// - readFileText(filePath, options)
// - writeFileText(filePath, text, options)
// - readFileJson(filePath, options)
// - writeFileJson(filePath, value, options)
// - readFileBuffer(filePath)
// - writeFileBuffer(filePath, buffer)
// - readFileBase64(filePath)
// - writeFileBase64(filePath, base64)
// - moveFileTo(filePath, toFilePath, options)
// - copyFileTo(filePath, toFilePath, options)
// - removeFile(filePath)
// - renameFile(filePath, name)
//
// Design:
// - All methods are synchronous.
// - Parent directories are created automatically before writing files.
// - JSON files are written with 2-space indentation and a final newline by default.
// - Public read/write methods stay flat and do not call each other.
// - Public read/write methods call the internal readFile / writeFile helpers.
//
// Version: 0.1.0
// Last modified: 2026-07-07
// -----------------------------------------------------------------------------

import fs from "node:fs";
import nodePath from "node:path";

// -----------------------------------------------------------------------------
// Text read/write
// -----------------------------------------------------------------------------

export function readFileText(filePath, options = {}) {
  assertExistingFile(filePath, "filePath");

  const { encoding = "utf8" } = options;

  return readFile(filePath).toString(encoding);
}

export function writeFileText(filePath, text, options = {}) {
  assertFileIfExists(filePath, "filePath");
  assertNonBlankString(text, "text");

  const { encoding = "utf8", overwrite = false } = options;

  return writeFile(filePath, String(text), { encoding, overwrite });
}

// -----------------------------------------------------------------------------
// JSON read/write
// -----------------------------------------------------------------------------

export function readFileJson(filePath, options = {}) {
  assertExistingFile(filePath, "filePath");

  const { encoding = "utf8" } = options;

  const text = readFile(filePath).toString(encoding);

  return JSON.parse(stripBom(text));
}

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
// Buffer read/write
// -----------------------------------------------------------------------------

export function readFileBuffer(filePath) {
  assertExistingFile(filePath, "filePath");

  return readFile(filePath);
}

export function writeFileBuffer(filePath, buffer, options = {}) {
  assertFileIfExists(filePath, "filePath");
  assertBuffer(buffer, "buffer");

  const { overwrite = false } = options;

  return writeFile(filePath, buffer, { overwrite });
}

// -----------------------------------------------------------------------------
// Base64 read/write
// -----------------------------------------------------------------------------

export function readFileBase64(filePath) {
  assertExistingFile(filePath, "filePath");

  return readFile(filePath).toString("base64");
}

export function writeFileBase64(filePath, base64, options = {}) {
  const clean = normalizeBase64(base64);

  const { overwrite = false } = options;

  return writeFile(filePath, Buffer.from(clean, "base64"), { overwrite });
}

// -----------------------------------------------------------------------------
// File operations
// -----------------------------------------------------------------------------

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
  ensureDir(toDirPath, "toDirPath");

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

export function copyFileTo(filePath, toFilePath, options = {}) {
  assertExistingFile(filePath, "filePath");
  assertFileIfExists(toFilePath, "toFilePath");

  const { overwrite = false } = options;

  const toDirPath = nodePath.dirname(toFilePath);
  ensureDir(toDirPath, "toDirPath");

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

export function removeFile(filePath) {
  assertExistingFile(filePath, "filePath");

  fs.rmSync(filePath);

  return true;
}

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
// Private helpers
// -----------------------------------------------------------------------------

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

function ensureDir(dirPath, fieldName = "dir") {
  assertPath(dirPath, fieldName);

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
  ensureDir(dir, "dir");

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
