#!/usr/bin/env node

import { run } from "./infra/protocol.js";
import { resolveCommand } from "./infra/cmd-resolver.js";
import { closeAllClients } from "./cdp/client.js";

import { CHROME_COMMANDS } from "./cmd/chrome.js";
import {
  PRESS_COMMANDS,
  SHORTCUT_COMMANDS,
  FOCUS_COMMANDS,
  SCROLL_COMMANDS,
  TEXT_COMMANDS,
} from "./cmd/input.js";
import { CHATGPT_COMMANDS } from "./cmd/chatgpt.js";

// 一级命令分组
const COMMAND_GROUPS = {
  chrome: CHROME_COMMANDS,
  press: PRESS_COMMANDS,
  shortcut: SHORTCUT_COMMANDS,
  focus: FOCUS_COMMANDS,
  scroll: SCROLL_COMMANDS,
  text: TEXT_COMMANDS,
  chatgpt: CHATGPT_COMMANDS,
};

const json = process.argv.includes("--json");

run(
  async () => {
    const ctx = resolveCommand(process.argv, COMMAND_GROUPS);
    return await ctx.handler(ctx);
  },
  {
    json,
    cleanup: closeAllClients,
  },
);
