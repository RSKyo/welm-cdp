// -----------------------------------------------------------------------------
// fs
// -----------------------------------------------------------------------------
// Local file system utilities.
//
// Public API:
//
// From ./path.js:
// - exists(filePath)
// - isFile(filePath)
// - isDirectory(dirPath)
// - joinPath(...segments)
// - ensureDir(dirPath)
// - removeDir(dirPath)
//
// From ./file.js:
// - readFileText(filePath, options)
// - writeFileText(filePath, text, options)
// - readFileJson(filePath, options)
// - writeFileJson(filePath, value, options)
// - readFileBuffer(filePath)
// - writeFileBuffer(filePath, buffer)
// - readFileBase64(filePath)
// - writeFileBase64(filePath, base64)
// - moveFileTo(filePath, toFilePath, options)
// - copyFileTo(filePath, toFilePath, options)
// - removeFile(filePath)
// - renameFile(filePath, name)
//
// From ./scan.js:
// - scanFiles(input, options)
// - scanDirs(dirPath, options)
//
// Design:
// - This file is only a public export hub.
// - No implementation logic should be added here.
// - Keep concrete implementations in path.js, file.js, and scan.js.
//
// Version: 0.1.0
// Last modified: 2026-07-07
// -----------------------------------------------------------------------------

export * from "./path.js";
export * from "./file.js";
export * from "./scan.js";