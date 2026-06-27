import { getClient } from "./client.js";
import { focus, scrollIntoView } from "./dom.js";

import { writeClipboard } from "../utils/clipboard.js";

/**
 * ----------------------------------------------------------------------------
 * Base Utils
 * ----------------------------------------------------------------------------
 */

function q(value) {
  return JSON.stringify(value);
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function prop(key, value) {
  return value === undefined ? {} : { [key]: value };
}

/**
 * Executes one or more browser editing commands.
 * For testing editing commands.
 *
 * Examples:
 * - Paste
 * - Copy
 * - Cut
 * - SelectAll
 * - DeleteBackward
 * - DeleteForward
 * - Undo
 * - Redo
 */
export async function editCommand(targetId, commands, options) {
  commands = Array.isArray(commands) ? commands : [commands];

  const { Input } = await getClient(targetId, options);

  await Input.dispatchKeyEvent({
    type: "rawKeyDown",
    commands,
  });
}

const MODIFIER_KEYS = {
  alt: {
    key: "Alt",
    code: "AltLeft",
  },

  ctrl: {
    key: "Control",
    code: "ControlLeft",
  },

  meta: {
    key: "Meta",
    code: "MetaLeft",
  },

  cmd: {
    key: "Meta",
    code: "MetaLeft",
  },

  win: {
    key: "Meta",
    code: "MetaLeft",
  },

  shift: {
    key: "Shift",
    code: "ShiftLeft",
  },
};

async function pretendPress(Input, keyEventWith, type = "keyDown") {
  if (!keyEventWith) return;

  const keys = Array.isArray(keyEventWith) ? [...keyEventWith] : [keyEventWith];

  if (type === "keyUp") {
    keys.reverse();
  }

  for (const key of keys) {
    const modifier = MODIFIER_KEYS[key.toLowerCase()];
    if (!modifier) continue;

    await Input.dispatchKeyEvent({
      type,
      key: modifier.key,
      code: modifier.code,
    });

    if (type === "keyDown") {
      await sleep(random(20, 50));
    } else {
      await sleep(random(40, 120));
    }
  }
}

function getModifiers(keyEventWith) {
  if (!keyEventWith) {
    return 0;
  }

  const keys = Array.isArray(keyEventWith) ? keyEventWith : [keyEventWith];

  let modifiers = 0;

  for (const k of keys) {
    switch (k.toLowerCase()) {
      case "alt":
        modifiers |= 1;
        break;
      case "ctrl":
        modifiers |= 2;
        break;
      case "meta":
      case "cmd":
      case "win":
        modifiers |= 4;
        break;
      case "shift":
        modifiers |= 8;
        break;
    }
  }

  return modifiers;
}

async function pressKey(targetId, key, code, options = {}) {
  const { Input } = await getClient(targetId, options);

  const modifiers = getModifiers(options.keyEventWith);

  const event = {
    key,
    code,
    modifiers,
    ...prop("windowsVirtualKeyCode", options.keyEventWindowsVirtualKeyCode),
    ...prop("nativeVirtualKeyCode", options.keyEventNativeVirtualKeyCode),
  };

  await pretendPress(Input, options.keyEventWith, "keyDown");

  await Input.dispatchKeyEvent({
    type: modifiers === 0 ? "keyDown" : "rawKeyDown",
    ...event,
    ...prop("text", options.keyEventText),
    ...prop("commands", options.keyEventCommands),
  });

  await sleep(random(20, 50));

  await Input.dispatchKeyEvent({
    type: "keyUp",
    ...event,
  });

  await sleep(random(40, 120));

  await pretendPress(Input, options.keyEventWith, "keyUp");

  return true;
}

export async function keyEnter(targetId, options = {}) {
  await pressKey(targetId, "Enter", "Enter", {
    ...options,
    keyEventText: "\r",
  });
}

export async function keyDelete(targetId, options = {}) {
  await pressKey(targetId, "Delete", "Delete", {
    ...options,
    keyEventCommands: ["Delete"],
  });
}

export async function keyBackspace(targetId, options = {}) {
  await pressKey(targetId, "Backspace", "Backspace", {
    ...options,
    keyEventCommands: ["BackwardDelete"],
  });
}

export async function focusHome(targetId, options = {}) {
  await pressKey(targetId, "ArrowUp", "ArrowUp", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["MoveToBeginningOfDocument"],
  });

  return true;
}

export async function focusEnd(targetId, options = {}) {
  await pressKey(targetId, "ArrowDown", "ArrowDown", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["MoveToEndOfDocument"],
  });

  return true;
}

export async function focusLineStart(targetId, options = {}) {
  await pressKey(targetId, "ArrowLeft", "ArrowLeft", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["MoveToBeginningOfLine"],
  });

  return true;
}

export async function focusLineEnd(targetId, options = {}) {
  await pressKey(targetId, "ArrowRight", "ArrowRight", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["MoveToEndOfLine"],
  });

  return true;
}

export async function focusLeft(targetId, options = {}) {
  await pressKey(targetId, "ArrowLeft", "ArrowLeft", {
    ...options,
    keyEventCommands: ["MoveLeft"],
  });

  return true;
}

export async function focusRight(targetId, options = {}) {
  await pressKey(targetId, "ArrowRight", "ArrowRight", {
    ...options,
    keyEventCommands: ["MoveRight"],
  });

  return true;
}

export async function focusUp(targetId, options = {}) {
  await pressKey(targetId, "ArrowUp", "ArrowUp", {
    ...options,
    keyEventCommands: ["MoveUp"],
  });

  return true;
}

export async function focusDown(targetId, options = {}) {
  await pressKey(targetId, "ArrowDown", "ArrowDown", {
    ...options,
    keyEventCommands: ["MoveDown"],
  });

  return true;
}

export async function scrollTop(targetId, options = {}) {
  await pressKey(targetId, "ArrowUp", "ArrowUp", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["ScrollToBeginningOfDocument"],
  });

  return true;
}

export async function scrollBottom(targetId, options = {}) {
  await pressKey(targetId, "ArrowDown", "ArrowDown", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["ScrollToEndOfDocument"],
  });

  return true;
}

export async function copy(targetId, options = {}) {
  await pressKey(targetId, "c", "KeyC", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["Copy"],
  });

  return true;
}

export async function paste(targetId, options = {}) {
  await pressKey(targetId, "v", "KeyV", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["Paste"],
  });

  return true;
}

export async function select(targetId, options = {}) {
  await pressKey(targetId, "a", "KeyA", {
    ...options,
    keyEventWith: "cmd",
    keyEventCommands: ["SelectAll"],
  });

  return true;
}

export async function clear(targetId, options = {}) {
  await select(targetId, options);

  await sleep(random(40, 120));
  await keyDelete(targetId, options);

  return true;
}

/**
 * ----------------------------------------------------------------------------
 * Text Input
 * ----------------------------------------------------------------------------
 */

async function writeText(targetId, text, options = {}) {
  const value = String(text);
  const typeCount = Math.min(value.length, random(5, options.typeCount ?? 15));
  const typeText = value.slice(0, typeCount);

  for (const char of typeText) {
    await pressKey(targetId, "", "", {
      ...options,
      keyEventText: char,
    });
  }

  const restText = value.slice(typeCount);

  if (restText) {
    await writeClipboard(restText);
    await sleep(random(40, 120));
    await paste(targetId, options);
  }

  return true;
}

async function newLine(targetId, options = {}) {
  await pressKey(targetId, "", "", {
    ...options,
    keyEventCommands: ["InsertNewline"],
  });

  return true;
}

export async function appendText(targetId, selector, text, options = {}) {
  await focus(targetId, selector, options);

  await sleep(random(40, 120));
  await focusEnd(targetId, options);

  return writeText(targetId, text, options);
}

export async function fillText(targetId, selector, text, options = {}) {
  await focus(targetId, selector, options);

  await sleep(random(40, 120));
  await clear(targetId, options);

  return writeText(targetId, text, options);
}

export async function newLineText(targetId, selector, text, options = {}) {
  await focus(targetId, selector, options);

  await sleep(random(40, 120));
  await focusLineEnd(targetId, options);

  await sleep(random(40, 120));
  await newLine(targetId, options);

  return writeText(targetId, text, options);
}
