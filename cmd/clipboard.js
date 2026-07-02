import { log } from "../infra/log.js";
import { assertNonBlank } from "../infra/validate.js";

import { readClipboardText, writeClipboardText } from "../clipboard/text.js";

export const CLIPBOARD_COMMANDS = {
  readClipboardText: {
    handler: cmd_readClipboardText,
    usage: "clipboard read",
    description: "Read text from clipboard",
  },

  writeClipboardText: {
    handler: cmd_writeClipboardText,
    usage: "clipboard write <text>",
    description: "Write text to clipboard",
  },
};

export async function cmd_readClipboardText({ argv, options } = {}) {
  const text = await readClipboardText(options);

  log.info(text, options);

  return text;
}

export async function cmd_writeClipboardText({ argv, options } = {}) {
  const [text] = argv;
  assertNonBlank(text, "text");

  await writeClipboardText(text, options);

  log.info(`Wrote text to clipboard`, options);

  return true;
}
