import { log } from "../../common/log.js";
import {
  readFileText,
  writeFileText,

  copyFileTo,
  moveFileTo,
  removeFile,
  renameFile,
} from "../../fs/file.js";

import {
  scanFiles,
  scanDirs,
} from "../../fs/scan.js";


export const FILE_COMMANDS = {
  readText: {
    handler: cmd_readText,
    usage: "file readText <file>",
    description: "Read text file",
  },

  writeText: {
    handler: cmd_writeText,
    usage: "file writeText <file> <text>",
    description: "Write text file",
  },

  copy: {
    handler: cmd_copyFile,
    usage: "file copy <file> <target>",
    description: "Copy file",
  },

  move: {
    handler: cmd_moveFile,
    usage: "file move <file> <target>",
    description: "Move file",
  },

  remove: {
    handler: cmd_removeFile,
    usage: "file remove <file>",
    description: "Remove file",
  },

  rename: {
    handler: cmd_renameFile,
    usage: "file rename <file> <name>",
    description: "Rename file",
  },


  scanFiles: {
    handler: cmd_scanFiles,
    usage: "file scanFiles <path>",
    description: "Scan files",
  },

  scanDirs: {
    handler: cmd_scanDirs,
    usage: "file scanDirs <path>",
    description: "Scan directories",
  },
};


// -----------------------------------------------------------------------------
// Read / Write
// -----------------------------------------------------------------------------

export async function cmd_readText({ argv, options } = {}) {
  const [filePath] = argv;

  const text = readFileText(filePath, options);

  log.info(`Read text file: ${filePath}`, options);

  return text;
}


export async function cmd_writeText({ argv, options } = {}) {
  const [filePath, text] = argv;

  const file = writeFileText(filePath, text, options);

  log.info(`Write text file: ${file}`, options);

  return file;
}


// -----------------------------------------------------------------------------
// File Operations
// -----------------------------------------------------------------------------

export async function cmd_copyFile({ argv, options } = {}) {
  const [filePath, toFilePath] = argv;

  const file = copyFileTo(filePath, toFilePath, options);

  log.info(`Copied file: ${file}`, options);

  return file;
}


export async function cmd_moveFile({ argv, options } = {}) {
  const [filePath, toFilePath] = argv;

  const file = moveFileTo(filePath, toFilePath, options);

  log.info(`Moved file: ${file}`, options);

  return file;
}


export async function cmd_removeFile({ argv, options } = {}) {
  const [filePath] = argv;

  const result = removeFile(filePath);

  log.info(`Removed file: ${filePath}`, options);

  return result;
}


export async function cmd_renameFile({ argv, options } = {}) {
  const [filePath, name] = argv;

  const file = renameFile(filePath, name);

  log.info(`Renamed file: ${file}`, options);

  return file;
}


// -----------------------------------------------------------------------------
// Scan
// -----------------------------------------------------------------------------

export async function cmd_scanFiles({ argv, options } = {}) {
  const [input] = argv;

  const files = scanFiles(input, options);

  log.info(`Scanned ${files.length} file(s)`, options);

  return files;
}


export async function cmd_scanDirs({ argv, options } = {}) {
  const [dirPath] = argv;

  const dirs = scanDirs(dirPath, options);

  log.info(`Scanned ${dirs.length} director(y|ies)`, options);

  return dirs;
}