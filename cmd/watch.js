import { log } from "../infra/log.js";

import { watchOuterHTML } from "../cdp/watch.js";

const CLIENT_OPTIONS = "--host --port";

/**
 *   watch html
 */
export const WATCH_COMMANDS = {
  outerhtml: {
    handler: cmd_watchOuterHTML,
    usage: "watch outerhtml <targetId> <selector> [options]",
    description: "观察元素 outerHTML 变化",
    options: `--timeout --interval ${CLIENT_OPTIONS}`,
  },
};

export async function cmd_watchOuterHTML(ctx) {
  const { argv, options } = ctx;
  const [targetId, selector] = argv;

  log.info("[WATCH START] outerHTML");
  await watchOuterHTML(targetId, selector, options);
  log.info("[WATCH END] outerHTML");
}