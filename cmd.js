#!/usr/bin/env node

import { run } from "./infra/protocol.js";
import { resolveCommand } from "./infra/cmd-resolver.js";
import { closeAllClients } from "./cdp/client.js";

import { CHROME_COMMANDS } from "./cmd/chrome.js";
import { INPUT_COMMANDS } from "./cmd/input.js";
import { CHATGPT_COMMANDS } from "./cmd/chatgpt.js";

// 一级命令分组
const COMMAND_GROUPS = {
  chrome: CHROME_COMMANDS,
  input: INPUT_COMMANDS,
  chatgpt: CHATGPT_COMMANDS,
};

const { handler, argv, options } = resolveCommand(process.argv, COMMAND_GROUPS);

run(
  async () => {
    return await handler({
      argv,
      options,
    });
  },
  {
    json: options.json,
    cleanup: closeAllClients,
  },
);

