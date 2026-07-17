import { log } from "../common/log.js";
import {
  selectFolder,
  selectFile,
  selectFiles,
  selectSavePath,
} from "../dialog/dialog.js";

export const DIALOG_COMMANDS = {
  folder: {
    handler: cmd_selectFolder,
    usage: "dialog folder",
    description: "Select a folder",
  },

  file: {
    handler: cmd_selectFile,
    usage: "dialog file",
    description: "Select a file",
  },

  files: {
    handler: cmd_selectFiles,
    usage: "dialog files",
    description: "Select multiple files",
  },

  save: {
    handler: cmd_selectSavePath,
    usage: "dialog save",
    description: "Select a save path",
  },
};

export async function cmd_selectFolder({ options = {} } = {}) {
  const folderPath = await selectFolder(options);
  if (folderPath === null) {
    log.info("Folder selection cancelled", options);
    return null;
  }

  log.info(`Selected folder: ${folderPath}`, options);

  return folderPath;
}

export async function cmd_selectFile({ options = {} } = {}) {
  const filePath = await selectFile(options);
  if (filePath === null) {
    log.info("File selection cancelled", options);
    return null;
  }

  log.info(`Selected file: ${filePath}`, options);

  return filePath;
}

export async function cmd_selectFiles({ options = {} } = {}) {
  const filePaths = await selectFiles(options);
  if (filePaths === null) {
    log.info("File selection cancelled", options);
    return null;
  }

  log.info(`Selected ${filePaths.length} file(s)`, options);

  for (const filePath of filePaths) {
    log.info(`Selected file: ${filePath}`, options);
  }

  return filePaths;
}

export async function cmd_selectSavePath({ options = {} } = {}) {
  const filePath = await selectSavePath(options);
  if (filePath === null) {
    log.info("Save path selection cancelled", options);
    return null;
  }

  log.info(`Selected save path: ${filePath}`, options);

  return filePath;
}
