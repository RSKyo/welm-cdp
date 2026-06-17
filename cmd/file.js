import { log } from "../infra/log.js";

import {
  exists,
  isFile,
  isDirectory,
  ensureDir,
  getFiles,
  readText,
  writeText,
} from "../utils/file.js";

export const FILE_COMMANDS = {
  exists: {
    handler: cmd_exists,
    usage: "file exists <path>",
    description: "Check whether path exists",
  },

  isfile: {
    handler: cmd_isFile,
    usage: "file isfile <file>",
    description: "Check whether path is a file",
  },

  isdir: {
    handler: cmd_isDirectory,
    usage: "file isdir <dir>",
    description: "Check whether path is a directory",
  },

  mkdir: {
    handler: cmd_ensureDir,
    usage: "file mkdir <dir>",
    description: "Ensure directory exists",
  },

  list: {
    handler: cmd_getFiles,
    usage: "file list <path> [options]",
    description: "List files",
    options: "--ext --exclude --recursive --hidden",
  },

  read: {
    handler: cmd_readText,
    usage: "file read <file>",
    description: "Read text file",
  },

  write: {
    handler: cmd_writeText,
    usage: "file write <file> <text>",
    description: "Write text file",
  },
};

// -----------------------------------------------------------------------------
// path
// -----------------------------------------------------------------------------

/**
 * 检查路径是否存在。
 */
export async function cmd_exists(ctx) {
  const { argv, options } = ctx;
  const [input] = argv;

  const result = exists(input);

  log.info(`Path exists: ${result}`, options);

  return result;
}

/**
 * 检查路径是否为文件。
 */
export async function cmd_isFile(ctx) {
  const { argv, options } = ctx;
  const [file] = argv;

  const result = isFile(file);

  log.info(`Is file: ${result}`, options);

  return result;
}

/**
 * 检查路径是否为目录。
 */
export async function cmd_isDirectory(ctx) {
  const { argv, options } = ctx;
  const [dir] = argv;

  const result = isDirectory(dir);

  log.info(`Is directory: ${result}`, options);

  return result;
}

// -----------------------------------------------------------------------------
// dir
// -----------------------------------------------------------------------------

/**
 * 确保目录存在。
 */
export async function cmd_ensureDir(ctx) {
  const { argv, options } = ctx;
  const [dir] = argv;

  const result = await ensureDir(dir);

  log.info(`Directory ready: ${result}`, options);

  return result;
}

// -----------------------------------------------------------------------------
// list
// -----------------------------------------------------------------------------

/**
 * 获取文件列表。
 *
 * options:
 *   ext:
 *     扩展名过滤。
 *
 *     支持：
 *       .ass
 *       ass
 *       .ass,.srt
 *
 *   exclude:
 *     排除规则。
 *
 *     支持：
 *       .git
 *       node_modules
 *       *.tmp
 *       *.bak
 *
 *   recursive:
 *     是否递归目录，默认 true
 *
 *   hidden:
 *     是否包含隐藏文件，默认 false
 */
export async function cmd_getFiles(ctx) {
  const { argv, options } = ctx;
  const [input] = argv;

  const files = getFiles(input, {
    ext: options.ext,
    exclude: options.exclude,

    recursive: options.recursive ?? true,
    hidden: options.hidden ?? false,
  });

  const total = files.length;

  for (const [index, file] of files.entries()) {
    log.info(`(${index + 1}/${total}) ${file}`, options);
  }

  return files;
}

// -----------------------------------------------------------------------------
// text
// -----------------------------------------------------------------------------

/**
 * 读取文本文件。
 */
export async function cmd_readText(ctx) {
  const { argv, options } = ctx;
  const [file] = argv;

  const result = readText(file);

  log.info(result, options);

  return result;
}

/**
 * 写入文本文件。
 */
export async function cmd_writeText(ctx) {
  const { argv, options } = ctx;
  const [file, text] = argv;

  const result = await writeText(file, text);

  log.info(`Text written: ${result}`, options);

  return result;
}
