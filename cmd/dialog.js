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
  const { reporter } = options;

  if (folderPath === null) {
    reporter?.info?.("Folder selection cancelled", options);
    return null;
  }

  reporter?.info?.(`Selected folder: ${folderPath}`, options);

  return folderPath;
}

export async function cmd_selectFile({ options = {} } = {}) {
  const filePath = await selectFile(options);
  const { reporter } = options;

  if (filePath === null) {
    reporter?.info?.("File selection cancelled", options);
    return null;
  }

  reporter?.info?.(`Selected file: ${filePath}`, options);

  return filePath;
}

export async function cmd_selectFiles({ options = {} } = {}) {
  const filePaths = await selectFiles(options);
  const { reporter } = options;

  if (filePaths === null) {
    reporter?.info?.("File selection cancelled", options);
    return null;
  }

  reporter?.info?.(`Selected ${filePaths.length} file(s)`, options);

  for (const filePath of filePaths) {
    reporter?.info?.(`Selected file: ${filePath}`, options);
  }

  return filePaths;
}

export async function cmd_selectSavePath({ options = {} } = {}) {
  const filePath = await selectSavePath(options);
  const { reporter } = options;

  if (filePath === null) {
    reporter?.info?.("Save path selection cancelled", options);
    return null;
  }

  reporter?.info?.(`Selected save path: ${filePath}`, options);

  return filePath;
}
