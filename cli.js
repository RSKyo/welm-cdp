#!/usr/bin/env node
import { run } from "./cli/runner.js";
import { closeClients } from "./cdp/client.js";

import { TARGET_COMMANDS } from "./commands/target.js";
import { CHROME_COMMANDS } from "./commands/chrome.js";
import { CLIENT_COMMANDS } from "./commands/client.js";
import { DOM_COMMANDS } from "./commands/dom.js";
import { INPUT_COMMANDS } from "./commands/input.js";
import { MOUSE_COMMANDS } from "./commands/mouse.js";

import { CLIPBOARD_COMMANDS } from "./commands/clipboard.js";
import { DIALOG_COMMANDS } from "./commands/dialog.js";
import { FS_COMMANDS } from "./commands/fs.js";

const COMMAND_GROUPS = {
  target: TARGET_COMMANDS,
  chrome: CHROME_COMMANDS,
  client: CLIENT_COMMANDS,
  dom: DOM_COMMANDS,
  input: INPUT_COMMANDS,
  mouse: MOUSE_COMMANDS,

  clipboard: CLIPBOARD_COMMANDS,
  dialog: DIALOG_COMMANDS,
  fs: FS_COMMANDS,
};

run(COMMAND_GROUPS, {
  cleanup: closeClients,
});
