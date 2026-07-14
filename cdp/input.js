import { getClient } from "./client.js";
import { focus, scrollIntoView, waitElementEditable } from "./dom.js";

import { writeClipboardText } from "../clipboard/text-clipboard.js";

const MODIFIER_KEYS = {
  alt: {
    key: "Alt",
    code: "AltLeft",
    modifiers: 1,
  },

  ctrl: {
    key: "Control",
    code: "ControlLeft",
    modifiers: 2,
  },

  meta: {
    key: "Meta",
    code: "MetaLeft",
    modifiers: 4,
  },

  shift: {
    key: "Shift",
    code: "ShiftLeft",
    modifiers: 8,
  },
};

// -----------------------------------------------------------------------------
// Public API: Key
// -----------------------------------------------------------------------------

export async function keyAny(targetId, key, code, options = {}) {
  return await pressKey(targetId, key, code, options);
}

export async function keyEnter(targetId, options = {}) {
  return await pressKey(targetId, "Enter", "Enter", {
    ...options,
    keyEventText: "\r\n",
  });
}

export async function keyDelete(targetId, options = {}) {
  return await pressKey(targetId, "Delete", "Delete", {
    ...options,
    keyEventCommands: ["Delete"],
  });
}

export async function keyBackspace(targetId, options = {}) {
  return await pressKey(targetId, "Backspace", "Backspace", {
    ...options,
    keyEventCommands: ["BackwardDelete"],
  });
}

// -----------------------------------------------------------------------------
// Public API: Cursor
// -----------------------------------------------------------------------------

export async function focusHome(targetId, options = {}) {
  await pressKey(targetId, "ArrowUp", "ArrowUp", {
    ...options,
    keyEventWith: "meta",
    keyEventCommands: ["MoveToBeginningOfDocument"],
  });

  return true;
}

export async function focusEnd(targetId, options = {}) {
  await pressKey(targetId, "ArrowDown", "ArrowDown", {
    ...options,
    keyEventWith: "meta",
    keyEventCommands: ["MoveToEndOfDocument"],
  });

  return true;
}

export async function focusLineStart(targetId, options = {}) {
  await pressKey(targetId, "ArrowLeft", "ArrowLeft", {
    ...options,
    keyEventWith: "meta",
    keyEventCommands: ["MoveToBeginningOfLine"],
  });

  return true;
}

export async function focusLineEnd(targetId, options = {}) {
  await pressKey(targetId, "ArrowRight", "ArrowRight", {
    ...options,
    keyEventWith: "meta",
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

// -----------------------------------------------------------------------------
// Public API: Scroll
// -----------------------------------------------------------------------------

export async function scrollTop(targetId, options = {}) {
  await pressKey(targetId, "ArrowUp", "ArrowUp", {
    ...options,
    keyEventWith: "meta",
    keyEventCommands: ["ScrollToBeginningOfDocument"],
  });

  return true;
}

export async function scrollBottom(targetId, options = {}) {
  await pressKey(targetId, "ArrowDown", "ArrowDown", {
    ...options,
    keyEventWith: "meta",
    keyEventCommands: ["ScrollToEndOfDocument"],
  });

  return true;
}

// -----------------------------------------------------------------------------
// Public API: Shortcuts
// -----------------------------------------------------------------------------

export async function copy(targetId, options = {}) {
  await pressKey(targetId, "c", "KeyC", {
    ...options,
    keyEventWith: "meta",
    keyEventCommands: ["Copy"],
  });

  return true;
}

export async function paste(targetId, options = {}) {
  await pressKey(targetId, "v", "KeyV", {
    ...options,
    keyEventWith: "meta",
    keyEventCommands: ["Paste"],
  });

  return true;
}

export async function select(targetId, options = {}) {
  await pressKey(targetId, "a", "KeyA", {
    ...options,
    keyEventWith: "meta",
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

// -----------------------------------------------------------------------------
// Public API: Text Input
// -----------------------------------------------------------------------------

export async function appendText(targetId, selector, text, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitElementEditable(targetId, selector, options);

  await focus(targetId, selector, options);

  await sleep(random(40, 120));
  await focusEnd(targetId, options);

  return textInput(targetId, text, options);
}

export async function fillText(targetId, selector, text, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitElementEditable(targetId, selector, options);

  await focus(targetId, selector, options);

  await sleep(random(40, 120));
  await clear(targetId, options);

  return textInput(targetId, text, options);
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

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

function resolveModifiers(modifierKeys) {
  if (!modifierKeys) {
    return { entries: [], modifiers: 0 };
  }

  const keys = Array.isArray(modifierKeys) ? modifierKeys : [modifierKeys];

  const entries = [];
  let modifiers = 0;

  for (const k of keys) {
    const entry = MODIFIER_KEYS[k.toLowerCase()];
    if (!entry) continue;

    entries.push(entry);
    modifiers |= entry.modifiers;
  }

  return { entries, modifiers };
}

async function pressKey(targetId, key, code, options = {}) {
  const { Input } = await getClient(targetId, options);

  const { entries, modifiers } = resolveModifiers(options.keyEventWith);

  const event = {
    key,
    code,
    modifiers,
    ...prop("windowsVirtualKeyCode", options.keyEventWindowsVirtualKeyCode),
    ...prop("nativeVirtualKeyCode", options.keyEventNativeVirtualKeyCode),
  };

  try {
    for (const entry of entries) {
      await Input.dispatchKeyEvent({
        type: "keyDown",
        key: entry.key,
        code: entry.code,
      });

      await sleep(random(10, 30));
    }

    await Input.dispatchKeyEvent({
      type: modifiers === 0 ? "keyDown" : "rawKeyDown",
      ...event,
      ...prop("text", options.keyEventText),
      ...prop("commands", options.keyEventCommands),
    });

    await sleep(random(10, 30));
  } finally {
    await Input.dispatchKeyEvent({
      type: "keyUp",
      ...event,
    });

    await sleep(random(10, 40));

    const reversed = [...entries].reverse();
    for (const entry of reversed) {
      await Input.dispatchKeyEvent({
        type: "keyUp",
        key: entry.key,
        code: entry.code,
      });

      await sleep(random(10, 40));
    }
  }

  return true;
}

async function textInput(targetId, text, options = {}) {
  const value = String(text);
  const characters = Array.from(value);
  const typeLimit = options.typeCount ?? 15;

  if (!Number.isInteger(typeLimit) || typeLimit < 0) {
    throw new Error("typeCount must be a non-negative integer");
  }

  const max = Math.min(characters.length, typeLimit);
  const min = Math.min(5, max);
  const typeCount = random(min, max);

  const typedCharacters = characters.slice(0, typeCount);

  for (const character of typedCharacters) {
    await pressKey(targetId, "", "", {
      ...options,
      keyEventText: character,
    });
  }

  const remainingText = characters.slice(typeCount).join("");

  if (remainingText !== "") {
    await writeClipboardText(remainingText);
    await sleep(random(40, 120));
    await paste(targetId, options);
  }

  return true;
}
