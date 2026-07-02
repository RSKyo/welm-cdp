import fs from "fs";
import { spawn, execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const copyFileBin = new URL("./copy-file", import.meta.url).pathname;

export async function writeFile(filePath) {
  if (process.platform !== "darwin") {
    throw new Error("writeFile clipboard only supports macOS for now");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`file not found: ${filePath}`);
  }

  await execFileAsync(copyFileBin, [filePath]);

  return true;
}

async function runAppleScript(script) {
  const { stdout } = await execFileAsync("osascript", ["-e", script]);

  return stdout
    .trim()
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

// Node 没有直接 API 读 file clipboard
// pbpaste 只能读 text，不适合 file
// 只能通过 AppleScript 来实现

export async function readFile() {
  if (process.platform !== "darwin") {
    throw new Error("readFile clipboard only supports macOS for now");
  }

  const script = `
    tell app "Finder"
      set theFiles to the clipboard as alias list
      set paths to {}
      repeat with f in theFiles
        set end of paths to POSIX path of f
      end repeat
      return paths
    end tell
  `;

  return await runAppleScript(script);
}