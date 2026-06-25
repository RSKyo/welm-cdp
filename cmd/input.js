import {
editCommand,
  selectAll,
  


} from "../cdp/input.js";

import { assertNonBlank } from "../infra/validate.js";

const INPUT_OPTIONS = "--host --port";

export const INPUT_COMMANDS = {
 
  command: {
handler: cmd_editCommand,
  },

  selall: {
    handler: cmd_selectAll,
    usage: "input selectall <targetId> <selector> [options]",
    description: "Select all text",
    options: INPUT_OPTIONS,
  },

};

/**
 * ----------------------------------------------------------------------------
 * CLI 命令实现
 * ----------------------------------------------------------------------------
 */

export async function cmd_editCommand({ argv, options } = {}) {
  const [targetId, commands] = argv;

  return editCommand(targetId, commands);
}

export async function cmd_selectAll({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return selectAll(targetId, selector, options);
}
