// -----------------------------------------------------------------------------
// clipboard/text-clipboard
// -----------------------------------------------------------------------------
// System clipboard text read and write utilities.
//
// Public API:
// - readClipboardText()
// - writeClipboardText(text)
//
// Features:
// - Read plain text from the system clipboard.
// - Write plain text to the system clipboard.
// - Support macOS and Windows.
//
// Platform implementation:
// - macOS uses pbpaste and pbcopy.
// - Windows uses PowerShell Get-Clipboard and Set-Clipboard.
//
// Design:
// - Text is passed through standard input when writing.
// - Command output is decoded as UTF-8.
// - Unsupported platforms throw an explicit error.
// - Child process startup and non-zero exit failures are normalized as errors.
//
// Version: 0.1.0
// Last modified: 2026-07-16
// -----------------------------------------------------------------------------

import { spawn } from "node:child_process";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Read plain text from the system clipboard.
 *
 * @example
 * const text = await readClipboardText();
 *
 * @returns {Promise<string>}
 * Clipboard text.
 *
 * @throws {Error}
 * Throws if the current platform is unsupported or
 * the system clipboard command fails.
 */
export async function readClipboardText() {
  if (process.platform === "darwin") {
    return await run("pbpaste");
  }

  if (process.platform === "win32") {
    return await run("powershell.exe", [
      "-NoProfile",
      "-Command",
      "Get-Clipboard -Raw",
    ]);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

/**
 * Write plain text to the system clipboard.
 *
 * The value is converted to a string before it is passed
 * to the platform clipboard command.
 *
 * @example
 * await writeClipboardText("Hello");
 *
 * @param {*} text
 * Text to write.
 *
 * @returns {Promise<void>}
 * Resolves after the text has been written.
 *
 * @throws {Error}
 * Throws if the current platform is unsupported or
 * the system clipboard command fails.
 */
export async function writeClipboardText(text) {
  const value = String(text);

  if (process.platform === "darwin") {
    await run("pbcopy", [], value);
    return;
  }

  if (process.platform === "win32") {
    await run(
      "powershell.exe",
      ["-NoProfile", "-Command", "$input | Set-Clipboard"],
      value,
    );

    return;
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

function run(command, args = [], input = null) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
    });

    child.stderr.on("data", (d) => {
      stderr += d.toString("utf8");
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to start ${command}: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) return resolve(stdout);
      reject(new Error(stderr.trim() || `${command} failed (${code})`));
    });

    if (input !== null) {
      child.stdin.end(String(input));
    } else {
      child.stdin.end();
    }
  });
}
