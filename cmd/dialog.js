import { selectFolder, selectFile, selectFiles, selectSaveFile } from "../dialog/dialog.js";

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
    handler: cmd_selectSaveFile,
    usage: "dialog save",
    description: "Select a save file",
  },
};

export async function cmd_selectFolder({ argv, options } = {}) {
  const folder = await selectFolder(options);

  const { reporter } = options;
  reporter?.info?.(`Selected folder: ${folder}`, options);

  return folder;
}

export async function cmd_selectFile({ argv, options } = {}) {
  const file = await selectFile(options);

  const { reporter } = options;
  reporter?.info?.(`Selected file: ${file}`, options);

  return file;
}

export async function cmd_selectFiles({ argv, options } = {}) {
  const files = await selectFiles(options);

  const { reporter } = options;
  reporter?.info?.(`Selected ${files.length} file(s)`, options);

  for (const file of files) {
    reporter?.info?.(`Selected file: ${file}`, options);
  }

  return files;
}

export async function cmd_selectSaveFile({ argv, options } = {}) {
  const file = await selectSaveFile(options);

  const { reporter } = options;
  reporter?.info?.(`Selected save file: ${file}`, options);

  return file;
}