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
// Version: 0.1.0
// Last modified: 2026-07-15
// -----------------------------------------------------------------------------

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { runProgram, runPowerShell } from "./process.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * @returns {Promise<string | null>}
 * Selected file path, or null if cancelled.
 *
 * @throws {Error}
 * Throws if the current platform is unsupported
 * or the native dialog operation fails.
 */
export async function selectFile(options = {}) {
  const title = options.dialogTitle ?? "Choose File";

  if (process.platform === "darwin") {
    return await selectFileDarwin(title);
  }

  if (process.platform === "win32") {
    return await selectFileWin32(title);
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

  if (process.platform === "darwin") {
    return await selectFilesDarwin(title);
  }

  if (process.platform === "win32") {
    return await selectFilesWin32(title);
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
  const dialogBin = path.join(__dirname, "dialog.bin");

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

async function selectFileDarwin(title) {
  try {
    const { stdout } = await runProgram(dialogBin, "file", title);

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

async function selectFilesDarwin(title) {
  try {
    const { stdout } = await runProgram(dialogBin, "files", title);

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

async function selectFileWin32(title) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = $args[0]
$dialog.Multiselect = $false

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
      error.stderr?.trim() || error.message || "failed to open file dialog";

    throw new Error(`selectFile failed: ${message}`);
  }
}

async function selectFilesWin32(title) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = $args[0]
$dialog.Multiselect = $true

if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
  exit 2
}

ConvertTo-Json -InputObject @($dialog.FileNames) -Compress
`;

  try {
    const { stdout } = await runPowerShell(script, title);
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
