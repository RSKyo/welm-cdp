import { log } from "../infra/log.js";

import { saveScreenshot } from "../cdp/screenshot.js";

const CLIENT_OPTIONS = "--host --port";

/**
 *   screenshot save
 */
export const SCREENSHOT_COMMANDS = {
  save: {
    handler: cmd_saveScreenshot,
    usage: "screenshot capture <targetId> [options]",
    description: "Capture page screenshot",
    options: `--fullPage --dir --format --quality --clip ${CLIENT_OPTIONS}`,
  },
};

export async function cmd_saveScreenshot(ctx) {
  const { argv, options } = ctx;
  const [targetId] = argv;

  const result = await saveScreenshot(targetId, options);

  log.info(`Screenshot: ${result}`, options);

  return result;
}