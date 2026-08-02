// -----------------------------------------------------------------------------
// dialog
// -----------------------------------------------------------------------------
// Native file system dialog utilities for macOS and Windows.
//
// Public API:
// - selectFolder(options)
// - selectFile(options)
// - selectFiles(options)
// - selectSavePath(options)
//
// Features:
// - Select a directory.
// - Select a single file.
// - Select multiple files.
// - Select a destination file path.
// - Customize native dialog titles.
// - Return null when the user cancels.
//
// Platforms:
// - macOS uses the compiled dialog.bin native program.
// - Windows uses PowerShell and System.Windows.Forms.
// - Other platforms are not supported.
//
// Design:
// - The macOS binary is validated only on macOS.
// - Windows does not depend on the macOS native binary.
// - User cancellation is represented by process exit code 2.
// - Cancellation returns null instead of throwing an error.
// - Save dialogs only select a path; callers write the file.
// - Unexpected native and PowerShell errors are wrapped with
//   the corresponding public method name.
//
// Version: 0.2.0
// Last modified: 2026-08-02
// -----------------------------------------------------------------------------

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import nodePath from "node:path";

import { runProgram, runPowerShell } from "./process.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = nodePath.dirname(__filename);

// Native binaries
const dialogBin = process.platform === "darwin" ? assertDialogBin() : null;

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Open a native folder selection dialog.
 *
 * Returns the selected directory path.
 * Returns null if the user cancels the dialog.
 *
 * @example
 * const folderPath = await selectFolder({
 *   dialogTitle: "Choose Audio Root",
 * });
 *
 * if (folderPath !== null) {
 *   console.log(folderPath);
 * }
 *
 * @param {Object} [options]
 * Dialog options.
 *
 * @param {string} [options.dialogTitle="Choose Folder"]
 * Native dialog title or description.
 *
 * @returns {Promise<string | null>}
 * Selected directory path, or null if cancelled.
 *
 * @throws {Error}
 * Throws if the current platform is unsupported
 * or the native dialog operation fails.
 */
export async function selectFolder(options = {}) {
  const title = options.dialogTitle ?? "Choose Folder";

  if (process.platform === "darwin") {
    return await selectFolderDarwin(title);
  }

  if (process.platform === "win32") {
    return await selectFolderWin32(title);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

/**
 * Open a native single-file selection dialog.
 *
 * Returns the selected file path.
 * Returns null if the user cancels the dialog.
 *
 * @example
 * const filePath = await selectFile({
 *   dialogTitle: "Choose Config File",
 * });
 *
 * if (filePath !== null) {
 *   console.log(filePath);
 * }
 *
 * @param {Object} [options]
 * Dialog options.
 *
 * @param {string} [options.dialogTitle="Choose File"]
 * Native dialog title.
 *
 * @param {string[]} [options.includeExts]
 * Include only files with these extensions.
 * Extensions can be written with or without a leading dot.
 * Example: [".mp3", "flac"]
 *
 * @returns {Promise<string | null>}
 * Selected file path, or null if cancelled.
 *
 * @throws {Error}
 * Throws if the current platform is unsupported
 * or the native dialog operation fails.
 */
export async function selectFile(options = {}) {
  const title = options.dialogTitle ?? "Choose File";
  const includeExts = normalizeIncludeExts(options.includeExts);

  if (process.platform === "darwin") {
    return await selectFileDarwin(title, includeExts);
  }

  if (process.platform === "win32") {
    return await selectFileWin32(title, includeExts);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

/**
 * Open a native multiple-file selection dialog.
 *
 * Returns an array containing the selected file paths.
 * Returns null if the user cancels the dialog.
 *
 * @example
 * const filePaths = await selectFiles({
 *   dialogTitle: "Choose Media Files",
 * });
 *
 * if (filePaths !== null) {
 *   for (const filePath of filePaths) {
 *     console.log(filePath);
 *   }
 * }
 *
 * @param {Object} [options]
 * Dialog options.
 *
 * @param {string} [options.dialogTitle="Choose Files"]
 * Native dialog title.
 *
 * @param {string[]} [options.includeExts]
 * Include only files with these extensions.
 * Extensions can be written with or without a leading dot.
 * Example: [".mp3", "flac"]
 *
 * @returns {Promise<string[] | null>}
 * Selected file paths, or null if cancelled.
 *
 * @throws {Error}
 * Throws if the current platform is unsupported,
 * the native dialog operation fails, or its output
 * cannot be parsed.
 */
export async function selectFiles(options = {}) {
  const title = options.dialogTitle ?? "Choose Files";
  const includeExts = normalizeIncludeExts(options.includeExts);

  if (process.platform === "darwin") {
    return await selectFilesDarwin(title, includeExts);
  }

  if (process.platform === "win32") {
    return await selectFilesWin32(title, includeExts);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

/**
 * Open a native save-file dialog.
 *
 * Returns the destination path selected by the user.
 * This method only selects a path; it does not create
 * or write the file.
 *
 * Returns null if the user cancels the dialog.
 *
 * @example
 * const filePath = await selectSavePath({
 *   dialogTitle: "Save Screenshot",
 * });
 *
 * if (filePath !== null) {
 *   await fs.writeFile(filePath, imageBuffer);
 * }
 *
 * @param {Object} [options]
 * Dialog options.
 *
 * @param {string} [options.dialogTitle="Save File"]
 * Native dialog title.
 *
 * @returns {Promise<string | null>}
 * Selected destination file path, or null if cancelled.
 *
 * @throws {Error}
 * Throws if the current platform is unsupported
 * or the native dialog operation fails.
 */
export async function selectSavePath(options = {}) {
  const title = options.dialogTitle ?? "Save File";

  if (process.platform === "darwin") {
    return await selectSavePathDarwin(title);
  }

  if (process.platform === "win32") {
    return await selectSavePathWin32(title);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// -----------------------------------------------------------------------------
// Private helpers for macOS
// -----------------------------------------------------------------------------

function assertDialogBin() {
  const dialogBin = nodePath.join(__dirname, "dialog.bin");

  if (!fs.existsSync(dialogBin)) {
    throw new Error(
      `dialog binary not found: ${dialogBin}. Run: npm run build:macos:dialog`,
    );
  }

  return dialogBin;
}

async function selectFolderDarwin(title) {
  try {
    const { stdout } = await runProgram(dialogBin, "folder", title);

    return stdout;
  } catch (error) {
    // User cancelled the dialog.
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open folder dialog";

    throw new Error(`selectFolder failed: ${message}`);
  }
}

async function selectFileDarwin(title, includeExts) {
  try {
    const args = ["file", title];

    if (includeExts !== null) {
      args.push(JSON.stringify(includeExts));
    }

    const { stdout } = await runProgram(dialogBin, ...args);

    return stdout;
  } catch (error) {
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open file dialog";

    throw new Error(`selectFile failed: ${message}`);
  }
}

async function selectFilesDarwin(title, includeExts) {
  try {
    const args = ["files", title];

    if (includeExts !== null) {
      args.push(JSON.stringify(includeExts));
    }

    const { stdout } = await runProgram(dialogBin, ...args);

    return JSON.parse(stdout);
  } catch (error) {
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open files dialog";

    throw new Error(`selectFiles failed: ${message}`);
  }
}

async function selectSavePathDarwin(title) {
  try {
    const { stdout } = await runProgram(dialogBin, "save", title);

    return stdout;
  } catch (error) {
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open save dialog";

    throw new Error(`selectSavePath failed: ${message}`);
  }
}

// -----------------------------------------------------------------------------
// Private helpers for Windows
// -----------------------------------------------------------------------------

async function selectFolderWin32(title) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = $args[0]

if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
} else {
  exit 2
}
`;

  try {
    const { stdout } = await runPowerShell(script, title);
    return stdout.trim();
  } catch (error) {
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open folder dialog";

    throw new Error(`selectFolder failed: ${message}`);
  }
}

async function selectFileWin32(title, includeExts) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = $args[0]
$dialog.Multiselect = $false

if ($args[1]) {
  $dialog.Filter = $args[1]
}

if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.FileName
} else {
  exit 2
}
`;

  try {
    const { stdout } = await runPowerShell(
      script,
      title,
      createFileFilter(includeExts),
    );
    return stdout.trim();
  } catch (error) {
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open file dialog";

    throw new Error(`selectFile failed: ${message}`);
  }
}

async function selectFilesWin32(title, includeExts) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = $args[0]
$dialog.Multiselect = $true

if ($args[1]) {
  $dialog.Filter = $args[1]
}

if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
  exit 2
}

ConvertTo-Json -InputObject @($dialog.FileNames) -Compress
`;

  try {
    const { stdout } = await runPowerShell(
      script,
      title,
      createFileFilter(includeExts),
    );
    return JSON.parse(stdout);
  } catch (error) {
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open files dialog";

    throw new Error(`selectFiles failed: ${message}`);
  }
}

async function selectSavePathWin32(title) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.SaveFileDialog
$dialog.Title = $args[0]

if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.FileName
} else {
  exit 2
}
`;

  try {
    const { stdout } = await runPowerShell(script, title);
    return stdout.trim();
  } catch (error) {
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open save dialog";

    throw new Error(`selectSavePath failed: ${message}`);
  }
}

function normalizeIncludeExts(includeExts) {
  if (includeExts == null) {
    return null;
  }

  if (!Array.isArray(includeExts) || includeExts.length === 0) {
    throw new Error("includeExts must be a non-empty array");
  }

  const normalizedExts = includeExts.map((includeExt) => {
    if (typeof includeExt !== "string") {
      throw new Error("includeExts must contain only strings");
    }

    const ext = includeExt.trim().toLowerCase();

    if (!ext || ext === ".") {
      throw new Error("includeExts must not contain empty extensions");
    }

    return ext.startsWith(".") ? ext : `.${ext}`;
  });

  return [...new Set(normalizedExts)];
}

function createFileFilter(includeExts) {
  if (includeExts === null) {
    return "All Files (*.*)|*.*";
  }

  const patterns = includeExts.map((ext) => `*${ext}`);

  return `Supported Files (${patterns.join(", ")})|${patterns.join(";")}`;
}