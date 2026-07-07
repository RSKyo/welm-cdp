import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { runProgram, runPowerShell } from "./process.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Native binaries
const dialogBin = assertDialogBin();

// #region Public API

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

export async function selectSaveFile(options = {}) {
  const title = options.dialogTitle ?? "Save File";

  if (process.platform === "darwin") {
    return await selectSaveFileDarwin(title);
  }

  if (process.platform === "win32") {
    return await selectSaveFileWin32(title);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// #endregion

// #region Private helpers

function assertDialogBin() {
  const dialogBin = path.join(__dirname, "dialog.bin");

  if (!fs.existsSync(dialogBin)) {
    throw new Error(
      `dialog binary not found: ${dialogBin}. Run: npm run compile:dialog`,
    );
  }

  return dialogBin;
}

// #endregion

// #region macOS helpers

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

async function selectSaveFileDarwin(title) {
  try {
    const { stdout } = await runProgram(dialogBin, "save", title);

    return stdout;
  } catch (error) {
    if (error.code === 2 || error.code === "2") {
      return null;
    }

    const message =
      error.stderr?.trim() || error.message || "failed to open save dialog";

    throw new Error(`selectSaveFile failed: ${message}`);
  }
}

// #endregion

// #region Windows helpers

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

$dialog.FileNames | ConvertTo-Json -Compress
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

async function selectSaveFileWin32(title) {
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

    throw new Error(`selectSaveFile failed: ${message}`);
  }
}

// #endregion
