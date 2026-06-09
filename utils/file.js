import fs from "fs";
import path from "path";
import { ERROR_CODE, createError } from "../infra/error.js";

function isFile(file) {
  return fs.statSync(file).isFile();
}

function isDirectory(dir) {
  return fs.statSync(dir).isDirectory();
}

function isHidden(file) {
  return path.basename(file).startsWith(".");
}

function matchExt(file, ext) {
  if (!ext) return true;
  return path.extname(file).toLowerCase() === ext.toLowerCase();
}

export function getFiles(input, ext = null, options = {}) {
  const { recursive = true, hidden = false } = options;

  const target = path.resolve(input);

  if (!fs.existsSync(target)) {
    throw createError(ERROR_CODE.PATH_NOT_FOUND, `path not found: ${input}`);
  }

  if (!hidden && isHidden(target)) {
    return [];
  }

  if (isFile(target)) {
    return matchExt(target, ext) ? [target] : [];
  }

  return fs
    .readdirSync(target, {
      recursive,
      withFileTypes: true,
    })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => hidden || !isHidden(file))
    .filter((file) => matchExt(file, ext));
}

export function readText(file, encoding = "utf8") {
  return fs.readFileSync(file, encoding);
}

export function writeText(file, text, encoding = "utf8") {
  fs.writeFileSync(file, text, encoding);
}

export function displayPath(file, options = {}) {
  if (options.fullPath) {
    return file;
  }

  return path.basename(file);
}
