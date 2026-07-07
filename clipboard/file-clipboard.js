import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { runProgram, runPowerShell } from "./process.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Native binaries
const clipboardBin = assertClipboardBin();

// #region Public API

export async function readClipboardFile() {
  if (process.platform === "darwin") {
    return await readClipboardFileDarwin();
  }

  if (process.platform === "win32") {
    return await readClipboardFileWin32();
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

export async function writeClipboardFile(file) {
  const files = toAbsolutePaths(assertFilePaths(file));

  if (process.platform === "darwin") {
    return await writeClipboardFileDarwin(files);
  }

  if (process.platform === "win32") {
    return await writeClipboardFileWin32(files);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// #endregion

// #region Private helpers

function assertFilePaths(file) {
  const filePaths = Array.isArray(file) ? file : [file];

  if (filePaths.length === 0) {
    throw new Error("file cannot be empty");
  }

  for (const filePath of filePaths) {
    if (!filePath || typeof filePath !== "string") {
      throw new Error(
        "file must be a non-empty string or an array of non-empty strings",
      );
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`file not found: ${filePath}`);
    }
  }

  return filePaths;
}

function assertClipboardBin() {
  const clipboardBin = path.join(__dirname, "file-clipboard.bin");

  if (!fs.existsSync(clipboardBin)) {
    throw new Error(
      `file-clipboard binary not found: ${clipboardBin}. Run: npm run compile:file-clipboard`,
    );
  }

  return clipboardBin;
}

function toAbsolutePaths(files) {
  return files.map((filePath) => path.resolve(filePath));
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

async function writeClipboardFileDarwin(files) {
  try {
    await runProgram(clipboardBin, "write", ...files);
    return files;
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

async function writeClipboardFileWin32(files) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$collection = New-Object System.Collections.Specialized.StringCollection

foreach ($file in $args) {
  [void]$collection.Add($file)
}

[System.Windows.Forms.Clipboard]::SetFileDropList($collection)
`;

  try {
    await runPowerShell(script, ...files);
    return files;
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to write file(s) to clipboard";

    throw new Error(`writeClipboardFile failed: ${message}`);
  }
}

// #endregion
