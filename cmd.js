#!/usr/bin/env node

import { run } from "./infra/protocol.js";
import { ERROR_CODE, createError } from "./infra/error.js";
import { CHROME_COMMANDS } from "./cmd/chrome.js";
import { closeAllClients } from "./cdp/client.js";

// 一级命令分组
const COMMAND_GROUPS = {
  chrome: CHROME_COMMANDS,
};

const { execute, argv, options } = resolveCommand(process.argv, COMMAND_GROUPS);

run(
  async () => {
    return await execute({
      argv,
      options,
    });
  },
  {
    json: options.json,
    cleanup: closeAllClients,
  },
);

function resolveCommand(processArgv, commandGroups) {
  const [, , groupName, commandName, ...rest] = processArgv;

  const groupNames = Object.keys(commandGroups).join(", ");

  if (!groupName) {
    throw createError(
      ERROR_CODE.MISSING_CMD,
      `missing command group, expected one of: ${groupNames}`,
    );
  }

  if (!Object.hasOwn(commandGroups, groupName)) {
    throw createError(
      ERROR_CODE.INVALID_CMD,
      `unknown command group: ${groupName}, expected one of: ${groupNames}`,
    );
  }

  const group = commandGroups[groupName];
  const commandNames = Object.keys(group).join(", ");

  if (!commandName) {
    throw createError(
      ERROR_CODE.MISSING_CMD,
      `missing command, expected one of: ${commandNames}`,
    );
  }

  if (!Object.hasOwn(group, commandName)) {
    throw createError(
      ERROR_CODE.INVALID_CMD,
      `unknown command: ${commandName}, expected one of: ${commandNames}`,
    );
  }

  const command = group[commandName];

  if (!command || typeof command.handler !== "function") {
    throw createError(
      ERROR_CODE.INVALID_CMD,
      `invalid command handler: ${groupName} ${commandName}`,
    );
  }

  const { argv, options } = splitArgvAndOptions(rest);

  return {
    groupName,
    commandName,

    argv,
    options,

    group,
    command,

    execute: command.handler,
  };
}

function optionNameToKey(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function splitArgvAndOptions(input = []) {
  const argv = [];
  const options = {};

  for (const part of input) {
    if (part.startsWith("--")) {
      const body = part.slice(2);
      const eqIndex = body.indexOf("=");

      if (eqIndex === -1) {
        options[optionNameToKey(body)] = true;
        continue;
      }

      const key = body.slice(0, eqIndex);
      const value = body.slice(eqIndex + 1);
      options[optionNameToKey(key)] = value;
      continue;
    }

    argv.push(part);
  }

  return { argv, options };
}
