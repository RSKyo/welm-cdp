import {
  click,
  doubleClick,
  focus,
  focusAtEnd,
  selectAll,
  clearAll,
  fillText,
  appendText,
  typeText,
  pressKey,
  pressShortcut,
  pressEnter,
  pressTab,
  pressEscape,
  pressBackspace,
  pressDelete,
  pressArrowUp,
  pressArrowDown,
  pressArrowLeft,
  pressArrowRight,
  copy,
  paste,
} from "../cdp/input.js";

import { assertNonBlank } from "../infra/validate.js";

const INPUT_OPTIONS = "--host --port";

/**
 * Input CLI 命令注册表。
 *
 * input click
 * input dblclick
 * input focus
 *
 * input fill
 * input append
 * input type
 *
 * input enter
 * input tab
 * input escape
 * input backspace
 * input delete
 *
 * input up
 * input down
 * input left
 * input right
 *
 * input copy
 * input paste
 */
export const INPUT_COMMANDS = {
  click: {
    handler: cmd_click,
    usage: "input click <targetId> <selector> [options]",
    description: "Click element",
    options: INPUT_OPTIONS,
  },

  dblclick: {
    handler: cmd_doubleClick,
    usage: "input dblclick <targetId> <selector> [options]",
    description: "Double click element",
    options: INPUT_OPTIONS,
  },

  focus: {
    handler: cmd_focus,
    usage: "input focus <targetId> <selector> [options]",
    description: "Focus element",
    options: INPUT_OPTIONS,
  },

  focusend: {
    handler: cmd_focusAtEnd,
    usage: "input focusend <targetId> <selector> [options]",
    description: "Focus element and move caret to end",
    options: INPUT_OPTIONS,
  },

  selall: {
    handler: cmd_selectAll,
    usage: "input selectall <targetId> <selector> [options]",
    description: "Select all text",
    options: INPUT_OPTIONS,
  },

  clear: {
    handler: cmd_clearAll,
    usage: "input clear <targetId> <selector> [options]",
    description: "Clear all text",
    options: INPUT_OPTIONS,
  },

  fill: {
    handler: cmd_fillText,
    usage: "input fill <targetId> <selector> <text> [options]",
    description: "Fill text",
    options: INPUT_OPTIONS,
  },

  append: {
    handler: cmd_appendText,
    usage: "input append <targetId> <selector> <text> [options]",
    description: "Append text",
    options: INPUT_OPTIONS,
  },

  type: {
    handler: cmd_typeText,
    usage: "input type <targetId> <selector> <text> [options]",
    description: "Type text",
    options: INPUT_OPTIONS,
  },

  key: {
    handler: cmd_pressKey,
    usage: "input key <targetId> <key> [options]",
    description: "Press Key",
    options: INPUT_OPTIONS,
  },

  shortcut: {
    handler: cmd_pressShortcut,
    usage: "input shortcut <targetId> <modifier> <key> [options]",
    description: "Press Shortcut",
    options: INPUT_OPTIONS,
  },

  enter: {
    handler: cmd_pressEnter,
    usage: "input enter <targetId> [options]",
    description: "Press Enter",
    options: INPUT_OPTIONS,
  },

  tab: {
    handler: cmd_pressTab,
    usage: "input tab <targetId> [options]",
    description: "Press Tab",
    options: INPUT_OPTIONS,
  },

  escape: {
    handler: cmd_pressEscape,
    usage: "input escape <targetId> [options]",
    description: "Press Escape",
    options: INPUT_OPTIONS,
  },

  backspace: {
    handler: cmd_pressBackspace,
    usage: "input backspace <targetId> [options]",
    description: "Press Backspace",
    options: INPUT_OPTIONS,
  },

  delete: {
    handler: cmd_pressDelete,
    usage: "input delete <targetId> [options]",
    description: "Press Delete",
    options: INPUT_OPTIONS,
  },

  up: {
    handler: cmd_pressArrowUp,
    usage: "input up <targetId> [options]",
    description: "Press ArrowUp",
    options: INPUT_OPTIONS,
  },

  down: {
    handler: cmd_pressArrowDown,
    usage: "input down <targetId> [options]",
    description: "Press ArrowDown",
    options: INPUT_OPTIONS,
  },

  left: {
    handler: cmd_pressArrowLeft,
    usage: "input left <targetId> [options]",
    description: "Press ArrowLeft",
    options: INPUT_OPTIONS,
  },

  right: {
    handler: cmd_pressArrowRight,
    usage: "input right <targetId> [options]",
    description: "Press ArrowRight",
    options: INPUT_OPTIONS,
  },

  copy: {
    handler: cmd_copy,
    usage: "input copy <targetId> [options]",
    description: "Copy selection",
    options: INPUT_OPTIONS,
  },

  paste: {
    handler: cmd_paste,
    usage: "input paste <targetId> <selector> [options]",
    description: "Paste clipboard",
    options: INPUT_OPTIONS,
  },
};

/**
 * ----------------------------------------------------------------------------
 * CLI 命令实现
 * ----------------------------------------------------------------------------
 */

export async function cmd_click({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return click(targetId, selector, options);
}

export async function cmd_doubleClick({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return doubleClick(targetId, selector, options);
}

export async function cmd_focus({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return focus(targetId, selector, options);
}

export async function cmd_focusAtEnd({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return focusAtEnd(targetId, selector, options);
}

export async function cmd_selectAll({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return selectAll(targetId, selector, options);
}

export async function cmd_clearAll({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return clearAll(targetId, selector, options);
}

export async function cmd_fillText({ argv, options } = {}) {
  const [targetId, selector, text] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return fillText(targetId, selector, text ?? "", options);
}

export async function cmd_appendText({ argv, options } = {}) {
  const [targetId, selector, text] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return appendText(targetId, selector, text ?? "", options);
}

export async function cmd_typeText({ argv, options } = {}) {
  const [targetId, selector, text] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return typeText(targetId, selector, text ?? "", options);
}

export async function cmd_pressKey({ argv, options } = {}) {
  const [targetId, key] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(key, "key");

  return pressKey(targetId, key, options);
}

export async function cmd_pressShortcut({ argv, options } = {}) {
  const [targetId, modifier, key] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(modifier, "modifier");
  assertNonBlank(key, "key");

  return pressShortcut(targetId, modifier, key, options);
}

export async function cmd_pressEnter({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressEnter(targetId, options);
}

export async function cmd_pressTab({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressTab(targetId, options);
}

export async function cmd_pressEscape({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressEscape(targetId, options);
}

export async function cmd_pressBackspace({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressBackspace(targetId, options);
}

export async function cmd_pressDelete({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressDelete(targetId, options);
}

export async function cmd_pressArrowUp({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressArrowUp(targetId, options);
}

export async function cmd_pressArrowDown({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressArrowDown(targetId, options);
}

export async function cmd_pressArrowLeft({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressArrowLeft(targetId, options);
}

export async function cmd_pressArrowRight({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return pressArrowRight(targetId, options);
}

export async function cmd_copy({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return copy(targetId, options);
}

export async function cmd_paste({ argv, options } = {}) {
  const [targetId, selector] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");

  return paste(targetId, selector, options);
}
