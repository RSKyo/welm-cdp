// -----------------------------------------------------------------------------
// clipboard/file-clipboard
// -----------------------------------------------------------------------------
// System clipboard file read and write utilities.
//
// Public API:
// - readClipboardFile()
// - writeClipboardFile(file)
//
// Features:
// - Read copied file paths from the system clipboard.
// - Write one or more files to the system clipboard.
// - Support macOS and Windows.
// - Normalize written file paths to absolute paths.
//
// Platform implementation:
// - macOS uses the compiled file-clipboard native binary.
// - Windows uses the System.Windows.Forms clipboard API through PowerShell.
//
// Design:
// - A single file path or an array of file paths is accepted when writing.
// - Every written path must exist.
// - Reading always returns an array of file paths.
// - The native binary is checked only on macOS.
// - Unsupported platforms throw an explicit error.
//
// macOS build:
// - npm run build:macos:file-clipboard
// - npm run build:macos:clipboard
//
// Version: 0.1.0
// Last modified: 2026-07-16
// -----------------------------------------------------------------------------

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import nodePath from "node:path";

import { runProgram, runPowerShell } from "./process.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = nodePath.dirname(__filename);

// Native binaries
const clipboardBin =
  process.platform === "darwin" ? assertClipboardBin() : null;

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Read copied file paths from the system clipboard.
 *
 * @example
 * const files = await readClipboardFile();
 *
 * @returns {Promise<string[]>}
 * Clipboard file paths.
 * Returns an empty array when the Windows clipboard
 * does not contain a file drop list.
 *
 * @throws {Error}
 * Throws if the current platform is unsupported,
 * the native helper is unavailable, or the clipboard
 * operation fails.
 */
export async function readClipboardFile() {
  if (process.platform === "darwin") {
    return await readClipboardFileDarwin();
  }

  if (process.platform === "win32") {
    return await readClipboardFileWin32();
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

/**
 * Write one or more files to the system clipboard.
 *
 * All paths are validated and converted to absolute paths
 * before being written.
 *
 * @example
 * const files = await writeClipboardFile("/music/song.mp3");
 *
 * @example
 * const files = await writeClipboardFile([
 *   "/music/song.mp3",
 *   "/images/cover.png",
 * ]);
 *
 * @param {string|string[]} files
 * Existing file path or file paths.
 *
 * @returns {Promise<string[]>}
 * Absolute paths written to the clipboard.
 *
 * @throws {Error}
 * Throws if the input is empty, a path is invalid,
 * a file does not exist, the current platform is unsupported,
 * or the clipboard operation fails.
 */
export async function writeClipboardFile(files) {
  const filePaths = toAbsolutePaths(assertFilePaths(files));

  if (process.platform === "darwin") {
    return await writeClipboardFileDarwin(filePaths);
  }

  if (process.platform === "win32") {
    return await writeClipboardFileWin32(filePaths);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

function assertFilePaths(files) {
  const filePaths = Array.isArray(files) ? files : [files];

  if (filePaths.length === 0) {
    throw new Error("files cannot be empty");
  }

  for (const filePath of filePaths) {
    if (!filePath || typeof filePath !== "string") {
      throw new Error(
        "files must be a non-empty string or an array of non-empty strings",
      );
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`file not found: ${filePath}`);
    }
  }

  return filePaths;
}

function assertClipboardBin() {
  const clipboardBin = nodePath.join(__dirname, "file-clipboard.bin");

  if (!fs.existsSync(clipboardBin)) {
    throw new Error(
      `file-clipboard binary not found: ${clipboardBin}. Run: npm run build:macos:file-clipboard`,
    );
  }

  return clipboardBin;
}

function toAbsolutePaths(filePaths) {
  return filePaths.map((filePath) => nodePath.resolve(filePath));
}

async function readClipboardFileDarwin() {
  try {
    const { stdout } = await runProgram(clipboardBin, "read");
    return JSON.parse(stdout);
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to read file(s) from clipboard";

    throw new Error(`readClipboardFile failed: ${message}`);
  }
}

async function writeClipboardFileDarwin(filePaths) {
  try {
    await runProgram(clipboardBin, "write", ...filePaths);
    return filePaths;
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to write file(s) to clipboard";

    throw new Error(`writeClipboardFile failed: ${message}`);
  }
}

async function readClipboardFileWin32() {
  const script = `
Add-Type -AssemblyName System.Windows.Forms

if (-not [System.Windows.Forms.Clipboard]::ContainsFileDropList()) {
  Write-Output "[]"
  exit 0
}

$files = [System.Windows.Forms.Clipboard]::GetFileDropList()
$files | ConvertTo-Json -Compress
`;

  try {
    const { stdout } = await runPowerShell(script);
    const text = stdout.trim();

    if (!text) {
      return [];
    }

    const value = JSON.parse(text);

    return Array.isArray(value) ? value : [value];
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to read file(s) from clipboard";

    throw new Error(`readClipboardFile failed: ${message}`);
  }
}

async function writeClipboardFileWin32(filePaths) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$collection = New-Object System.Collections.Specialized.StringCollection

foreach ($file in $args) {
  [void]$collection.Add($file)
}

[System.Windows.Forms.Clipboard]::SetFileDropList($collection)
`;

  try {
    await runPowerShell(script, ...filePaths);
    return filePaths;
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to write file(s) to clipboard";

    throw new Error(`writeClipboardFile failed: ${message}`);
  }
}
