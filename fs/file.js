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
import path from "node:path";

// -----------------------------------------------------------------------------
// Text read/write
// -----------------------------------------------------------------------------

export function readFileText(filePath, options = {}) {
  const { encoding = "utf8" } = options;

  return readFile(filePath).toString(encoding);
}

export function writeFileText(filePath, text, options = {}) {
  const { encoding = "utf8" } = options;

  return writeFile(filePath, String(text), { encoding });
}

// -----------------------------------------------------------------------------
// JSON read/write
// -----------------------------------------------------------------------------

export function readFileJson(filePath, options = {}) {
  const { encoding = "utf8" } = options;

  const text = readFile(filePath).toString(encoding);

  return JSON.parse(stripBom(text));
}

export function writeFileJson(filePath, value, options = {}) {
  const { spaces = 2, finalNewline = true, encoding = "utf8" } = options;

  let text = JSON.stringify(value, null, spaces);

  if (typeof text !== "string") {
    throw new Error("invalid json");
  }

  if (finalNewline) {
    text += "\n";
  }

  return writeFile(filePath, text, { encoding });
}

// -----------------------------------------------------------------------------
// Buffer read/write
// -----------------------------------------------------------------------------

export function readFileBuffer(filePath) {
  return readFile(filePath);
}

export function writeFileBuffer(filePath, buffer) {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new Error("invalid buffer");
  }

  return writeFile(filePath, buffer);
}

// -----------------------------------------------------------------------------
// Base64 read/write
// -----------------------------------------------------------------------------

export function readFileBase64(filePath) {
  return readFile(filePath).toString("base64");
}

export function writeFileBase64(filePath, base64) {
  const clean = normalizeBase64(base64);

  return writeFile(filePath, Buffer.from(clean, "base64"));
}

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

function assertFilePath(filePath) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error("invalid file path");
  }
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);

  if (!dir || dir === ".") {
    return;
  }

  fs.mkdirSync(dir, { recursive: true });
}

function readFile(filePath) {
  assertFilePath(filePath);

  return fs.readFileSync(filePath);
}

function writeFile(filePath, data, options) {
  assertFilePath(filePath);
  ensureParentDir(filePath);

  fs.writeFileSync(filePath, data, options);

  return true;
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