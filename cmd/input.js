import {
  keyEnter,
  keyDelete,
  keyBackspace,
  copy,
  paste,
  select,
  clear,
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
  appendText,
  fillText,
  newLineText,
} from "../cdp/input.js";

import { assertNonBlank } from "../infra/validate.js";

const INPUT_OPTIONS = "--host --port";

export const PRESS_COMMANDS = {
  enter: {
    handler: cmd_keyEnter,
  },

  delete: {
    handler: cmd_keyDelete,
  },

  backspace: {
    handler: cmd_keyBackspace,
  },
};

export const FOCUS_COMMANDS = {
  home: {
    handler: cmd_focusHome,
  },

  end: {
    handler: cmd_focusEnd,
  },

  lineStart: {
    handler: cmd_focusLineStart,
  },

  lineEnd: {
    handler: cmd_focusLineEnd,
  },

  left: {
    handler: cmd_focusLeft,
  },

  right: {
    handler: cmd_focusRight,
  },

  up: {
    handler: cmd_focusUp,
  },

  down: {
    handler: cmd_focusDown,
  },
};

export const SCROLL_COMMANDS = {
  top: {
    handler: cmd_scrollTop,
  },

  bottom: {
    handler: cmd_scrollBottom,
  },
};

export const SHORTCUT_COMMANDS = {
  copy: {
    handler: cmd_copy,
  },

  paste: {
    handler: cmd_paste,
  },

  select: {
    handler: cmd_select,
  },

  clear: {
    handler: cmd_clear,
  },
};

export const TEXT_COMMANDS = {
  append: {
    handler: cmd_appendText,
  },

  fill: {
    handler: cmd_fillText,
  },

  newLine: {
    handler: cmd_newLineText,
  },
};

/**
 * ----------------------------------------------------------------------------
 * CLI 命令实现
 * ----------------------------------------------------------------------------
 */

export async function cmd_keyEnter({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return keyEnter(targetId, options);
}

export async function cmd_keyDelete({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return keyDelete(targetId, options);
}

export async function cmd_keyBackspace({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return keyBackspace(targetId, options);
}

export async function cmd_focusHome({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return focusHome(targetId, options);
}

export async function cmd_focusEnd({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return focusEnd(targetId, options);
}

export async function cmd_focusLineStart({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return focusLineStart(targetId, options);
}

export async function cmd_focusLineEnd({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return focusLineEnd(targetId, options);
}

export async function cmd_focusLeft({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return focusLeft(targetId, options);
}

export async function cmd_focusRight({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return focusRight(targetId, options);
}

export async function cmd_focusUp({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return focusUp(targetId, options);
}

export async function cmd_focusDown({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return focusDown(targetId, options);
}

export async function cmd_scrollTop({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return scrollTop(targetId, options);
}

export async function cmd_scrollBottom({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return scrollBottom(targetId, options);
}

export async function cmd_copy({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return copy(targetId, options);
}

export async function cmd_paste({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return paste(targetId, options);
}

export async function cmd_select({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return select(targetId, options);
}

export async function cmd_clear({ argv, options } = {}) {
  const [targetId] = argv;

  assertNonBlank(targetId, "targetId");

  return clear(targetId, options);
}

export async function cmd_appendText({ argv, options } = {}) {
  const [targetId, selector, text] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");
  assertNonBlank(text, "text");

  return appendText(targetId, selector, text, options);
}

export async function cmd_fillText({ argv, options } = {}) {
  const [targetId, selector, text] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");
  assertNonBlank(text, "text");

  return fillText(targetId, selector, text, options);
}

export async function cmd_newLineText({ argv, options } = {}) {
  const [targetId, selector, text] = argv;

  assertNonBlank(targetId, "targetId");
  assertNonBlank(selector, "selector");
  assertNonBlank(text, "text");

  return newLineText(targetId, selector, text, options);
}
