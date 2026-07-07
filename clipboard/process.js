import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runProgram(program, ...args) {
  try {
    return await execFileAsync(program, args);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`program not found: ${program}`);
    }

    throw error;
  }
}

export async function runPowerShell(script, ...args) {
  try {
    return await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-STA",
      "-Command",
      script,
      ...args,
    ]);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("powershell.exe not found");
    }

    throw error;
  }
}