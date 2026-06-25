import {

  selectAll,
  enter,


} from "../cdp/input.js";

import { assertNonBlank } from "../infra/validate.js";

const INPUT_OPTIONS = "--host --port";

export const INPUT_COMMANDS = {
 

  enter: {
handler: cmd_enter,
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



export async function cmd_selectAll({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return selectAll(targetId, selector, options);
}
export async function cmd_enter({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return enter(targetId, options);
}
