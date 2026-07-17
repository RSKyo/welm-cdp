import { log } from "../common/log.js";
import {
  moveFileTo,
  copyFileTo,
  removeFile,
  renameFile,
  readFileText,
  writeFileText,
  readFileJson,
  writeFileJson,
  readFileBase64,
  writeFileBase64,
  scanFiles,
  scanDirs,
} from "../fs/index.js";

export const FS_COMMANDS = {
  move: {
    handler: cmd_moveFileTo,
    usage: "fs move <source> <target>",
    description: "Move a file",
  },

  copy: {
    handler: cmd_copyFileTo,
    usage: "fs copy <source> <target>",
    description: "Copy a file",
  },

  remove: {
    handler: cmd_removeFile,
    usage: "fs remove <file>",
    description: "Remove a file",
  },

  rename: {
    handler: cmd_renameFile,
    usage: "fs rename <file> <name>",
    description: "Rename a file",
  },

  "read-text": {
    handler: cmd_readFileText,
    usage: "fs read-text <file>",
    description: "Read a text file",
  },

  "write-text": {
    handler: cmd_writeFileText,
    usage: "fs write-text <file> [text...]",
    description: "Write a text file",
  },

  "read-json": {
    handler: cmd_readFileJson,
    usage: "fs read-json <file>",
    description: "Read a JSON file",
  },

  "write-json": {
    handler: cmd_writeFileJson,
    usage: "fs write-json <file> <json>",
    description: "Write a JSON file",
  },

  "read-base64": {
    handler: cmd_readFileBase64,
    usage: "fs read-base64 <file>",
    description: "Read a file as Base64",
  },

  "write-base64": {
    handler: cmd_writeFileBase64,
    usage: "fs write-base64 <file> <base64>",
    description: "Write a file from Base64",
  },

  "scan-files": {
    handler: cmd_scanFiles,
    usage: "fs scan-files <path>",
    description: "Recursively scan files",
  },

  "scan-dirs": {
    handler: cmd_scanDirs,
    usage: "fs scan-dirs <path>",
    description: "Recursively scan directories",
  },
};

export async function cmd_moveFileTo({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "source file");
  const toFilePath = requireArg(argv, 1, "target file");
  const targetPath = moveFileTo(filePath, toFilePath, options);
  log.info(`File moved: ${targetPath}`, options);

  return targetPath;
}

export async function cmd_copyFileTo({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "source file");
  const toFilePath = requireArg(argv, 1, "target file");
  const targetPath = copyFileTo(filePath, toFilePath, options);
  log.info(`File copied: ${targetPath}`, options);

  return targetPath;
}

export async function cmd_removeFile({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "file");
  const removed = removeFile(filePath);
  log.info(`File removed: ${filePath}`, options);

  return removed;
}

export async function cmd_renameFile({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "file");
  const name = requireArg(argv, 1, "name");
  const targetPath = renameFile(filePath, name);
  log.info(`File renamed: ${targetPath}`, options);

  return targetPath;
}

export async function cmd_readFileText({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "file");
  const text = readFileText(filePath, options);
  log.info(text, options);

  return text;
}

export async function cmd_writeFileText({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "file");
  const text = argv.slice(1).join(" ");
  const targetPath = writeFileText(filePath, text, options);
  log.info(`Text file written: ${targetPath}`, options);

  return targetPath;
}

export async function cmd_readFileJson({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "file");
  const value = readFileJson(filePath, options);

  log.info(JSON.stringify(value, null, 2), options);

  return value;
}

export async function cmd_writeFileJson({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "file");
  const json = argv.slice(1).join(" ");

  if (json === "") {
    throw new Error("json is required");
  }

  let value;

  try {
    value = JSON.parse(json);
  } catch (error) {
    throw new Error(`invalid JSON: ${error.message}`);
  }

  const targetPath = writeFileJson(filePath, value, options);
  log.info(`JSON file written: ${targetPath}`, options);

  return targetPath;
}

export async function cmd_readFileBase64({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "file");
  const base64 = readFileBase64(filePath);

  log.info(base64, options);

  return base64;
}

export async function cmd_writeFileBase64({ argv = [], options = {} } = {}) {
  const filePath = requireArg(argv, 0, "file");
  const base64 = requireArg(argv, 1, "base64");
  const targetPath = writeFileBase64(filePath, base64, options);
  log.info(`Base64 file written: ${targetPath}`, options);

  return targetPath;
}

export async function cmd_scanFiles({ argv = [], options = {} } = {}) {
  const input = requireArg(argv, 0, "path");
  const entries = scanFiles(input, options);
  log.info(`Found ${entries.length} file(s)`, options);

  for (const entry of entries) {
    log.info(entry.filePath, options);
  }

  return entries;
}

export async function cmd_scanDirs({ argv = [], options = {} } = {}) {
  const dirPath = requireArg(argv, 0, "path");
  const entries = scanDirs(dirPath, options);
  log.info(`Found ${entries.length} directories`, options);

  for (const entry of entries) {
    log.info(entry.dirPath, options);
  }

  return entries;
}

function requireArg(argv, index, name) {
  const value = argv[index];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }

  return value;
}
