import fs from "node:fs";
import nodePath from "node:path";
import { isNonBlankString } from "./is-base.js";
export * from "./is-base.js";

// Port
export function isPort(port) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// CDP Target ID
export function isCDPTargetId(value) {
  const targetIdRE = /^[0-9A-F]{32}$/i;
  return isNonBlankString(value) && targetIdRE.test(value);
}

// Buffer
export function isBuffer(value) {
  return Buffer.isBuffer(value);
}

/** Path, File, and Directory */

// Path
export function isPath(value) {
  return isNonBlankString(value) && !value.includes("\0");
}

// Absolute Path
export function isAbsolutePath(value) {
  return isPath(value) && nodePath.isAbsolute(value);
}

// Existing Path
export function isExistingPath(value) {
  return isPath(value) && fs.existsSync(value);
}

// Existing File
export function isExistingFile(value) {
  return isExistingPath(value) && fs.statSync(value).isFile();
}

// Existing Directory
export function isExistingDirectory(value) {
  return isExistingPath(value) && fs.statSync(value).isDirectory();
}
