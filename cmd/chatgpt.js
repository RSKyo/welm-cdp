import { log } from "../infra/log.js";
import { assertNonBlank } from "../infra/validate.js";
import { ask } from "../flow/chatgpt/ask.js";

const CONNECTION_OPTIONS = "--host --port";
const WAIT_OPTIONS = "--timeout --interval";

export const CHATGPT_COMMANDS = {
  ask: {
    handler: cmd_ask,
    usage: "chatgpt ask <prompt> [options]",
    description: "Send a prompt to ChatGPT",
    options: `--clear ${CONNECTION_OPTIONS} ${WAIT_OPTIONS}`,
  },
};

export async function cmd_ask(ctx) {
  const { argv, options } = ctx;
  const [prompt] = argv;

  assertNonBlank(prompt, "prompt");

  await ask(prompt, options);
}
