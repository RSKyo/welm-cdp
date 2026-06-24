#!/usr/bin/env node

import { run } from "./infra/protocol.js";
import { resolveCommand } from "./infra/cmd-resolver.js";
import { closeAllClients } from "./cdp/client.js";

import { CHROME_COMMANDS } from "./cmd/chrome.js";
import { CHATGPT_COMMANDS } from "./cmd/chatgpt.js";

// 一级命令分组
const COMMAND_GROUPS = {
  chrome: CHROME_COMMANDS,
  chatgpt: CHATGPT_COMMANDS,
};

const { execute, argv, options } = resolveCommand(process.argv, COMMAND_GROUPS);

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

