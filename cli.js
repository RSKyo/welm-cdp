#!/usr/bin/env node
import { log } from "./infra/log.js";
import { resolveCommand } from "./infra/cmd.js";
import { run } from "./infra/runner.js";

import { closeCdpClients } from "./cdp/lifecycle.js";

import { CHROME_COMMANDS } from "./cmd/chrome.js";
import { CLIPBOARD_COMMANDS } from "./cmd/clipboard.js";

// 一级命令分组
const COMMAND_GROUPS = {
  chrome: CHROME_COMMANDS,
  clipboard: CLIPBOARD_COMMANDS,
};

const json = process.argv.includes("--json");
const stack = process.argv.includes("--stack");
const runOptions = {
  json,
  stack,
  cleanup: closeCdpClients,
  reporter: log,
};

run(
  async () => {
    const ctx = resolveCommand(process, COMMAND_GROUPS);
    ctx.options.reporter = log;
    return await ctx.handler(ctx);
  },
  runOptions,
);
