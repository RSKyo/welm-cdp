import { TARGET_COMMANDS } from "./groups/target.js";
import { CHROME_COMMANDS } from "./groups/chrome.js";
import { CLIENT_COMMANDS } from "./groups/client.js";
import { DOM_COMMANDS } from "./groups/dom.js";
import { INPUT_COMMANDS } from "./groups/input.js";
import { MOUSE_COMMANDS } from "./groups/mouse.js";

import { CLIPBOARD_COMMANDS } from "./groups/clipboard.js";
import { DIALOG_COMMANDS } from "./groups/dialog.js";
import { FILE_COMMANDS } from "./groups/file.js";

export const COMMAND_GROUPS = {
  target: TARGET_COMMANDS,
  chrome: CHROME_COMMANDS,
  client: CLIENT_COMMANDS,
  dom: DOM_COMMANDS,
  input: INPUT_COMMANDS,
  mouse: MOUSE_COMMANDS,

  clipboard: CLIPBOARD_COMMANDS,
  dialog: DIALOG_COMMANDS,
  file: FILE_COMMANDS,
};
