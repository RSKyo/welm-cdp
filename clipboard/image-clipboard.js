import fs from "node:fs";
import { fileURLToPath } from "node:url";
import nodePath from "node:path";

import { runProgram, runPowerShell } from "./process.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = nodePath.dirname(__filename);

const IMAGE_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".tif",
  ".tiff",
  ".gif",
  ".heic",
]);

// Native binaries
const clipboardBin =
  process.platform === "darwin" ? assertClipboardBin() : null;

// #region Public API

export async function readClipboardImage(imagePath) {
  imagePath = assertImagePath(imagePath);

  if (process.platform === "darwin") {
    return await readClipboardImageDarwin(imagePath);
  }

  if (process.platform === "win32") {
    return await readClipboardImageWin32(imagePath);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

export async function writeClipboardImage(imagePath) {
  imagePath = assertImageFile(imagePath);

  if (process.platform === "darwin") {
    return await writeClipboardImageDarwin(imagePath);
  }

  if (process.platform === "win32") {
    return await writeClipboardImageWin32(imagePath);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// #endregion

// #region Private helpers

function assertImageFile(imagePath) {
  if (!imagePath || typeof imagePath !== "string") {
    throw new Error("image file must be a non-empty string");
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`image file not found: ${imagePath}`);
  }

  if (!fs.statSync(imagePath).isFile()) {
    throw new Error(`image path is not a file: ${imagePath}`);
  }

  const imageExt = nodePath.extname(imagePath).toLowerCase();

  if (!IMAGE_EXTS.has(imageExt)) {
    throw new Error(`unsupported image format: ${imageExt}`);
  }

  return nodePath.resolve(imagePath);
}

function assertImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== "string") {
    throw new Error("image path must be a non-empty string");
  }

  const parsed = nodePath.parse(nodePath.resolve(imagePath));

  return nodePath.join(parsed.dir, `${parsed.name}.png`);
}

function assertClipboardBin() {
  const clipboardBin = nodePath.join(__dirname, "image-clipboard.bin");

  if (!fs.existsSync(clipboardBin)) {
    throw new Error(
      `image-clipboard binary not found: ${clipboardBin}. Run: npm run build:macos:image-clipboard`,
    );
  }

  return clipboardBin;
}

// #endregion

// #region macOS helpers

async function readClipboardImageDarwin(imagePath) {
  try {
    await runProgram(clipboardBin, "read", imagePath);
    return imagePath;
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to read image from clipboard";

    throw new Error(`readClipboardImage failed: ${message}`);
  }
}

async function writeClipboardImageDarwin(imagePath) {
  try {
    await runProgram(clipboardBin, "write", imagePath);
    return imagePath;
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to write image to clipboard";

    throw new Error(`writeClipboardImage failed: ${message}`);
  }
}

// #endregion

// #region Windows helpers

async function readClipboardImageWin32(imagePath) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

if (-not [System.Windows.Forms.Clipboard]::ContainsImage()) {
  throw "clipboard does not contain image"
}

$image = [System.Windows.Forms.Clipboard]::GetImage()

try {
  $image.Save(
    $args[0],
    [System.Drawing.Imaging.ImageFormat]::Png
  )
}
finally {
  $image.Dispose()
}
`;

  try {
    await runPowerShell(script, imagePath);
    return imagePath;
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to read image from clipboard";

    throw new Error(`readClipboardImage failed: ${message}`);
  }
}

async function writeClipboardImageWin32(imagePath) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$image = [System.Drawing.Image]::FromFile($args[0])

try {
  [System.Windows.Forms.Clipboard]::SetImage($image)
}
finally {
  $image.Dispose()
}
`;

  try {
    await runPowerShell(script, imagePath);
    return imagePath;
  } catch (error) {
    const message =
      error.stderr?.trim() ||
      error.message ||
      "failed to write image to clipboard";

    throw new Error(`writeClipboardImage failed: ${message}`);
  }
}

// #endregion
