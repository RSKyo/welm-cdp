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

// #region Public API

// Read/write text to/from the clipboard
export {
  readClipboardText,
  writeClipboardText,
} from "./text-clipboard.js";

// Read/write file(s) to/from the clipboard
export {
  readClipboardFile,
  writeClipboardFile,
} from "./file-clipboard.js";

// Read/write image to/from the clipboard
export {
  readClipboardImage,
  writeClipboardImage,
} from "./image-clipboard.js";

// #endregion