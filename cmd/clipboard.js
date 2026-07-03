import { log } from "../infra/log.js";
import {
  assertNonBlank,
  assertStringOrNonEmptyArray,
} from "../infra/validate.js";

import { readClipboardText, writeClipboardText } from "../clipboard/text.js";

import { readClipboardFile, writeClipboardFile } from "../clipboard/file.js";

import { readClipboardImage, writeClipboardImage } from "../clipboard/image.js";

export const CLIPBOARD_COMMANDS = {
  read: {
    handler: cmd_readClipboardText,
    usage: "clipboard read",
    description: "Read text from clipboard",
  },

  write: {
    handler: cmd_writeClipboardText,
    usage: "clipboard write <text>",
    description: "Write text to clipboard",
  },

  "read-file": {
    handler: cmd_readClipboardFile,
    usage: "clipboard read-file",
    description: "Read file(s) from clipboard",
  },

  "write-file": {
    handler: cmd_writeClipboardFile,
    usage: "clipboard write-file <file1> [file2 ...]",
    description: "Write file(s) to clipboard",
  },

  "read-image": {
    handler: cmd_readClipboardImage,
    usage: "clipboard read-image <outputPath>",
    description: "Read image from clipboard",
  },

  "write-image": {
    handler: cmd_writeClipboardImage,
    usage: "clipboard write-image <imagePath>",
    description: "Write image to clipboard",
  },
};

export async function cmd_readClipboardText({ argv, options } = {}) {
  const text = await readClipboardText(options);

  log.info(text, options);

  return text;
}

export async function cmd_writeClipboardText({ argv, options } = {}) {
  const [text] = argv;
  assertNonBlank(text, "argv[0]");

  await writeClipboardText(text, options);

  log.info(`Wrote text to clipboard`, options);

  return true;
}

export async function cmd_readClipboardFile({ argv, options } = {}) {
  const files = await readClipboardFile(options);

  log.info(`Read ${files.length} file(s) from clipboard`, options);
  for (const file of files) {
    log.info(`Read file from clipboard: ${file}`, options);
  }

  return files;
}

export async function cmd_writeClipboardFile({ argv, options } = {}) {
  const [files] = argv;
  assertStringOrNonEmptyArray(files, "argv[0]");

  const writtenFiles = await writeClipboardFile(files, options);

  log.info(`Wrote ${writtenFiles.length} file(s) to clipboard`, options);
  for (const file of writtenFiles) {
    log.info(`Wrote file to clipboard: ${file}`, options);
  }

  return writtenFiles;
}

export async function cmd_readClipboardImage({ argv, options } = {}) {
  const [outputPath] = argv;
  assertNonBlank(outputPath, "argv[0]");

  const image = await readClipboardImage(outputPath, options);

  log.info(`Read image from clipboard: ${outputPath}`, options);

  return image;
}

export async function cmd_writeClipboardImage({ argv, options } = {}) {
  const [imagePath] = argv;
  assertNonBlank(imagePath, "argv[0]");

  await writeClipboardImage(imagePath, options);

  log.info(`Wrote image to clipboard: ${imagePath}`, options);

  return true;
}