import { assertNonBlankString } from "../../common/assert.js";
import {
  keyAny,
  keyEnter,
  keyDelete,
  keyBackspace,
  focusHome,
  focusEnd,
  focusLineStart,
  focusLineEnd,
  focusLeft,
  focusRight,
  focusUp,
  focusDown,
  scrollTop,
  scrollBottom,
  copy,
  paste,
  select,
  clear,
  appendText,
  fillText,
} from "../../cdp/input.js";

const CDP_OPTIONS = "--host --port";
const KEY_EVENT_OPTIONS =
  "--key-event-with --key-event-text --key-event-commands " +
  "--key-event-windows-virtual-key-code --key-event-native-virtual-key-code";
const ELEMENT_OPTIONS = "--nth";
const SCROLL_OPTIONS = "--block --inline --behavior";
const POLL_OPTIONS = "--poll-timeout --poll-interval --match-times";
const TEXT_OPTIONS = "--type-limit";

/**
 * Input CLI command registry.
 *
 * input key
 * input enter
 * input delete
 * input backspace
 *
 * input home
 * input end
 * input line-start
 * input line-end
 * input left
 * input right
 * input up
 * input down
 *
 * input scroll-top
 * input scroll-bottom
 *
 * input copy
 * input paste
 * input select
 * input clear
 *
 * input append
 * input fill
 */
export const INPUT_COMMANDS = {
  key: {
    handler: cmd_keyAny,
    usage: "input key <targetId> <key> <code> [options]",
    description: "Press an arbitrary key",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  enter: {
    handler: cmd_keyEnter,
    usage: "input enter <targetId> [options]",
    description: "Press Enter",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  delete: {
    handler: cmd_keyDelete,
    usage: "input delete <targetId> [options]",
    description: "Press Delete",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  backspace: {
    handler: cmd_keyBackspace,
    usage: "input backspace <targetId> [options]",
    description: "Press Backspace",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  home: {
    handler: cmd_focusHome,
    usage: "input home <targetId> [options]",
    description: "Move cursor to document beginning",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  end: {
    handler: cmd_focusEnd,
    usage: "input end <targetId> [options]",
    description: "Move cursor to document end",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  "line-start": {
    handler: cmd_focusLineStart,
    usage: "input line-start <targetId> [options]",
    description: "Move cursor to line beginning",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  "line-end": {
    handler: cmd_focusLineEnd,
    usage: "input line-end <targetId> [options]",
    description: "Move cursor to line end",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  left: {
    handler: cmd_focusLeft,
    usage: "input left <targetId> [options]",
    description: "Move cursor left",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  right: {
    handler: cmd_focusRight,
    usage: "input right <targetId> [options]",
    description: "Move cursor right",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  up: {
    handler: cmd_focusUp,
    usage: "input up <targetId> [options]",
    description: "Move cursor up",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  down: {
    handler: cmd_focusDown,
    usage: "input down <targetId> [options]",
    description: "Move cursor down",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  "scroll-top": {
    handler: cmd_scrollTop,
    usage: "input scroll-top <targetId> [options]",
    description: "Scroll to document beginning",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  "scroll-bottom": {
    handler: cmd_scrollBottom,
    usage: "input scroll-bottom <targetId> [options]",
    description: "Scroll to document end",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  copy: {
    handler: cmd_copy,
    usage: "input copy <targetId> [options]",
    description: "Copy current selection",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  paste: {
    handler: cmd_paste,
    usage: "input paste <targetId> [options]",
    description: "Paste clipboard text",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  select: {
    handler: cmd_select,
    usage: "input select <targetId> [options]",
    description: "Select all content",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  clear: {
    handler: cmd_clear,
    usage: "input clear <targetId> [options]",
    description: "Clear selected editing content",
    options: `${CDP_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  append: {
    handler: cmd_appendText,
    usage: "input append <targetId> <selector> <text> [options]",
    description: "Append text to an editable element",
    options:
      `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${SCROLL_OPTIONS} ` +
      `${POLL_OPTIONS} ${TEXT_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },

  fill: {
    handler: cmd_fillText,
    usage: "input fill <targetId> <selector> <text> [options]",
    description: "Replace editable element text",
    options:
      `${CDP_OPTIONS} ${ELEMENT_OPTIONS} ${SCROLL_OPTIONS} ` +
      `${POLL_OPTIONS} ${TEXT_OPTIONS} ${KEY_EVENT_OPTIONS}`,
  },
};

// -----------------------------------------------------------------------------
// CLI Commands: Key
// -----------------------------------------------------------------------------

export function cmd_keyAny({ argv, options } = {}) {
  const [targetId, key, code] = argv;

  assertTargetId(targetId);
  assertNonBlankString(key, "key");
  assertNonBlankString(code, "code");

  return keyAny(targetId, key, code, options);
}

export function cmd_keyEnter({ argv, options } = {}) {
  return runTargetCommand(keyEnter, argv, options);
}

export function cmd_keyDelete({ argv, options } = {}) {
  return runTargetCommand(keyDelete, argv, options);
}

export function cmd_keyBackspace({ argv, options } = {}) {
  return runTargetCommand(keyBackspace, argv, options);
}

// -----------------------------------------------------------------------------
// CLI Commands: Cursor
// -----------------------------------------------------------------------------

export function cmd_focusHome({ argv, options } = {}) {
  return runTargetCommand(focusHome, argv, options);
}

export function cmd_focusEnd({ argv, options } = {}) {
  return runTargetCommand(focusEnd, argv, options);
}

export function cmd_focusLineStart({ argv, options } = {}) {
  return runTargetCommand(focusLineStart, argv, options);
}

export function cmd_focusLineEnd({ argv, options } = {}) {
  return runTargetCommand(focusLineEnd, argv, options);
}

export function cmd_focusLeft({ argv, options } = {}) {
  return runTargetCommand(focusLeft, argv, options);
}

export function cmd_focusRight({ argv, options } = {}) {
  return runTargetCommand(focusRight, argv, options);
}

export function cmd_focusUp({ argv, options } = {}) {
  return runTargetCommand(focusUp, argv, options);
}

export function cmd_focusDown({ argv, options } = {}) {
  return runTargetCommand(focusDown, argv, options);
}

// -----------------------------------------------------------------------------
// CLI Commands: Scroll
// -----------------------------------------------------------------------------

export function cmd_scrollTop({ argv, options } = {}) {
  return runTargetCommand(scrollTop, argv, options);
}

export function cmd_scrollBottom({ argv, options } = {}) {
  return runTargetCommand(scrollBottom, argv, options);
}

// -----------------------------------------------------------------------------
// CLI Commands: Shortcuts
// -----------------------------------------------------------------------------

export function cmd_copy({ argv, options } = {}) {
  return runTargetCommand(copy, argv, options);
}

export function cmd_paste({ argv, options } = {}) {
  return runTargetCommand(paste, argv, options);
}

export function cmd_select({ argv, options } = {}) {
  return runTargetCommand(select, argv, options);
}

export function cmd_clear({ argv, options } = {}) {
  return runTargetCommand(clear, argv, options);
}

// -----------------------------------------------------------------------------
// CLI Commands: Text Input
// -----------------------------------------------------------------------------

export function cmd_appendText({ argv, options } = {}) {
  return runTextCommand(appendText, argv, options);
}

export function cmd_fillText({ argv, options } = {}) {
  return runTextCommand(fillText, argv, options);
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function assertTargetId(targetId) {
  assertNonBlankString(targetId, "targetId");
}

function runTargetCommand(method, argv = [], options = {}) {
  const [targetId] = argv;

  assertTargetId(targetId);

  return method(targetId, options);
}

function runTextCommand(method, argv = [], options = {}) {
  const [targetId, selector, text] = argv;

  assertTargetId(targetId);
  assertNonBlankString(selector, "selector");

  if (text === undefined) {
    throw new Error("text is required");
  }

  return method(targetId, selector, text, options);
}
