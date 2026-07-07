// -----------------------------------------------------------------------------
// clipboard.js
// -----------------------------------------------------------------------------
// Local clipboard capability facade.
//
// Exports:
//   - readClipboardText
//   - writeClipboardText
//   - readClipboardFile
//   - writeClipboardFile
//   - readClipboardImage
//   - writeClipboardImage
//
// This module only aggregates clipboard capabilities. Implementation details live
// in the corresponding text/file/image clipboard modules.
// -----------------------------------------------------------------------------

export * from "./text-clipboard.js";
export * from "./file-clipboard.js";
export * from "./image-clipboard.js";
