import {
  readClipboardText,
  writeClipboardText,
  readClipboardFile,
  writeClipboardFile,
  readClipboardImage,
  writeClipboardImage,
} from "../clipboard/index.js";

export const CLIPBOARD_COMMANDS = {
  "read-text": {
    handler: cmd_readClipboardText,
    usage: "clipboard read-text",
    description: "Read text from the clipboard",
  },

  "write-text": {
    handler: cmd_writeClipboardText,
    usage: "clipboard write-text <text>",
    description: "Write text to the clipboard",
  },

  "read-file": {
    handler: cmd_readClipboardFile,
    usage: "clipboard read-file",
    description: "Read file paths from the clipboard",
  },

  "write-file": {
    handler: cmd_writeClipboardFile,
    usage: "clipboard write-file <file...>",
    description: "Write one or more files to the clipboard",
  },

  "read-image": {
    handler: cmd_readClipboardImage,
    usage: "clipboard read-image <output>",
    description: "Save a clipboard image as a PNG file",
  },

  "write-image": {
    handler: cmd_writeClipboardImage,
    usage: "clipboard write-image <file>",
    description: "Write an image file to the clipboard",
  },
};

export async function cmd_readClipboardText({ options = {} } = {}) {
  const text = await readClipboardText();
  const { reporter } = options;

  reporter?.info?.(text, options);

  return text;
}

export async function cmd_writeClipboardText({ argv = [], options = {} } = {}) {
  if (argv.length === 0) {
    throw new Error("text is required");
  }

  const text = argv.join(" ");

  await writeClipboardText(text);

  const { reporter } = options;
  reporter?.info?.("Clipboard text written", options);

  return true;
}

export async function cmd_readClipboardFile({ options = {} } = {}) {
  const filePaths = await readClipboardFile();
  const { reporter } = options;

  reporter?.info?.(`Read ${filePaths.length} file(s)`, options);

  for (const filePath of filePaths) {
    reporter?.info?.(`Clipboard file: ${filePath}`, options);
  }

  return filePaths;
}

export async function cmd_writeClipboardFile({ argv = [], options = {} } = {}) {
  const filePaths = await writeClipboardFile(argv);
  const { reporter } = options;

  reporter?.info?.(`Wrote ${filePaths.length} file(s)`, options);

  for (const filePath of filePaths) {
    reporter?.info?.(`Clipboard file: ${filePath}`, options);
  }

  return filePaths;
}

export async function cmd_readClipboardImage({ argv = [], options = {} } = {}) {
  const imagePath = await readClipboardImage(argv[0]);
  const { reporter } = options;

  reporter?.info?.(`Clipboard image saved: ${imagePath}`, options);

  return imagePath;
}

export async function cmd_writeClipboardImage({ argv = [], options = {} } = {}) {
  const imagePath = await writeClipboardImage(argv[0]);
  const { reporter } = options;

  reporter?.info?.(`Clipboard image written: ${imagePath}`, options);

  return imagePath;
}
