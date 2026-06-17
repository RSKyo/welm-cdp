import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { assertNonBlank } from "../infra/validate.js";
import { createError, ERROR_CODE } from "../infra/error.js";


// -----------------------------------------------------------------------------
// Core IO
// -----------------------------------------------------------------------------

function readFile(file) {
  file = assertNonBlank(file, "file");
  return fs.readFileSync(file);
}

async function writeFile(file, data) {
  file = assertNonBlank(file, "file");

  if (data == null) {
    throw createError(ERROR_CODE.INVALID, "missing data");
  }

  await ensureDir(path.dirname(file));
  await fsp.writeFile(file, data);

  return file;
}


// -----------------------------------------------------------------------------
// Text
// -----------------------------------------------------------------------------

function readText(file) {
  file = assertNonBlank(file, "file");
  return fs.readFileSync(file, "utf8");
}

export async function writeText(file, text, encoding = "utf8") {
  return writeFile(file, String(text), encoding);
}


// -----------------------------------------------------------------------------
// JSON
// -----------------------------------------------------------------------------

export function readJson(file) {
  try {
    return JSON.parse(readText(file));
  } catch {
    throw createError(ERROR_CODE.INVALID, "invalid json");
  }
}

export async function writeJson(file, value, options = {}) {
  const { spaces = 2 } = options;

  const text = JSON.stringify(value, null, spaces);

  return writeText(file, text);
}


// -----------------------------------------------------------------------------
// Buffer / Binary
// -----------------------------------------------------------------------------

export function readBuffer(file) {
  file = assertNonBlank(file, "file");
  return fs.readFileSync(file);
}

export async function writeBuffer(file, buffer) {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw createError(ERROR_CODE.INVALID, "invalid buffer");
  }

  return writeFile(file, buffer);
}


// -----------------------------------------------------------------------------
// Base64 (explicit layer, NOT encoding hack)
// -----------------------------------------------------------------------------

export function readBase64(file) {
  const buffer = readBuffer(file);
  return buffer.toString("base64");
}

export async function writeBase64(file, base64) {
  if (typeof base64 !== "string") {
    throw createError(ERROR_CODE.INVALID, "base64 must be string");
  }

  const clean = base64.replace(/^data:.*;base64,/, "");

  const buffer = Buffer.from(clean, "base64");

  return writeFile(file, buffer);
}


// -----------------------------------------------------------------------------
// FS utilities
// -----------------------------------------------------------------------------

export function exists(file) {
  return fs.existsSync(file);
}

export function isFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

export function isDir(dir) {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

export async function ensureDir(dir) {
  return fsp.mkdir(dir, { recursive: true });
}


// -----------------------------------------------------------------------------
// file list
// -----------------------------------------------------------------------------

export function getFiles(input, options = {}) {
  const { recursive = true, hidden = false } = options;

  const target = path.resolve(input);

  if (!fs.existsSync(target)) {
    throw createError(ERROR_CODE.NOT_FOUND, `not found: ${input}`);
  }

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    const result = [];

    for (const e of entries) {
      const full = path.join(dir, e.name);

      if (!hidden && e.name.startsWith(".")) continue;

      if (e.isDirectory()) {
        if (recursive) {
          result.push(...walk(full));
        }
      } else {
        result.push(full);
      }
    }

    return result;
  };

  if (isFile(target)) return [target];
  return walk(target);
}