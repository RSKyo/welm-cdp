// -----------------------------------------------------------------------------
// cdp/input
// -----------------------------------------------------------------------------
// Keyboard input and text editing utilities based on the CDP Input domain.
//
// Public API:
// - keyAny(targetId, key, code, options)
// - keyEnter(targetId, options)
// - keyDelete(targetId, options)
// - keyBackspace(targetId, options)
// - focusHome(targetId, options)
// - focusEnd(targetId, options)
// - focusLineStart(targetId, options)
// - focusLineEnd(targetId, options)
// - focusLeft(targetId, options)
// - focusRight(targetId, options)
// - focusUp(targetId, options)
// - focusDown(targetId, options)
// - scrollTop(targetId, options)
// - scrollBottom(targetId, options)
// - copy(targetId, options)
// - paste(targetId, options)
// - select(targetId, options)
// - clear(targetId, options)
// - appendText(targetId, selector, text, options)
// - fillText(targetId, selector, text, options)
//
// Features:
// - Dispatch keyboard events to a Chrome target.
// - Execute CDP editing commands with simulated keyboard shortcuts.
// - Support Alt, Control, Meta, and Shift modifier keys.
// - Move the editing cursor within text and documents.
// - Copy, paste, select, and clear focused content.
// - Append or replace editable element text.
// - Combine simulated typing with clipboard paste for longer text.
// - Release pressed keys even when an input operation fails.
//
// Design:
// - CDP clients are obtained and reused through client.js.
// - The primary shortcut modifier is Meta on macOS and Control elsewhere.
// - Editing commands perform the requested action; key events simulate the
//   corresponding physical shortcut.
// - Text input types a randomized prefix and pastes the remaining content.
// - Unicode text is split by code point to avoid breaking surrogate pairs.
//
// Version: 0.1.0
// Last modified: 2026-07-15
// -----------------------------------------------------------------------------

import { getClient } from "./client.js";
import { focus, scrollIntoView, waitElementEditable } from "./dom.js";

import { writeClipboardText } from "../clipboard/text-clipboard.js";

const primaryModifier = process.platform === "darwin" ? "meta" : "ctrl";

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


/**
 * Dispatch an arbitrary key press to a Chrome target.
 *
 * Optional editing commands, text, modifiers, and virtual
 * key codes can be provided through options.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {string} key
 * DOM key value.
 *
 * @param {string} code
 * DOM code value.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the key has been pressed and released.
 */
export async function keyAny(targetId, key, code, options = {}) {
  return await pressKey(targetId, key, code, {
    ...options,
  });
}

/**
 * Press the Enter key.
 *
 * The key event includes line-break text so that Enter
 * can insert a new line in editable elements.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the key has been pressed and released.
 */
export async function keyEnter(targetId, options = {}) {
  return await pressKey(targetId, "Enter", "Enter", {
    ...options,
    keyEventText: "\r\n",
  });
}

/**
 * Press the Delete key and execute the Delete editing command.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the operation is complete.
 */
export async function keyDelete(targetId, options = {}) {
  return await pressKey(targetId, "Delete", "Delete", {
    ...options,
    keyEventCommands: ["Delete"],
  });
}

/**
 * Press the Backspace key and execute the BackwardDelete
 * editing command.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the operation is complete.
 */
export async function keyBackspace(targetId, options = {}) {
  return await pressKey(targetId, "Backspace", "Backspace", {
    ...options,
    keyEventCommands: ["BackwardDelete"],
  });
}

// -----------------------------------------------------------------------------
// Public API: Cursor
// -----------------------------------------------------------------------------

/**
 * Move the editing cursor to the beginning of the document.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the cursor has been moved.
 */
export async function focusHome(targetId, options = {}) {
  await pressKey(targetId, "ArrowUp", "ArrowUp", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["MoveToBeginningOfDocument"],
  });

  return true;
}

/**
 * Move the editing cursor to the end of the document.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the cursor has been moved.
 */
export async function focusEnd(targetId, options = {}) {
  await pressKey(targetId, "ArrowDown", "ArrowDown", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["MoveToEndOfDocument"],
  });

  return true;
}

/**
 * Move the editing cursor to the beginning of the current line.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the cursor has been moved.
 */
export async function focusLineStart(targetId, options = {}) {
  await pressKey(targetId, "ArrowLeft", "ArrowLeft", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["MoveToBeginningOfLine"],
  });

  return true;
}

/**
 * Move the editing cursor to the end of the current line.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the cursor has been moved.
 */
export async function focusLineEnd(targetId, options = {}) {
  await pressKey(targetId, "ArrowRight", "ArrowRight", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["MoveToEndOfLine"],
  });

  return true;
}

/**
 * Move the editing cursor one position to the left.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the cursor has been moved.
 */
export async function focusLeft(targetId, options = {}) {
  await pressKey(targetId, "ArrowLeft", "ArrowLeft", {
    ...options,
    keyEventCommands: ["MoveLeft"],
  });

  return true;
}

/**
 * Move the editing cursor one position to the right.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the cursor has been moved.
 */
export async function focusRight(targetId, options = {}) {
  await pressKey(targetId, "ArrowRight", "ArrowRight", {
    ...options,
    keyEventCommands: ["MoveRight"],
  });

  return true;
}

/**
 * Move the editing cursor upward.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the cursor has been moved.
 */
export async function focusUp(targetId, options = {}) {
  await pressKey(targetId, "ArrowUp", "ArrowUp", {
    ...options,
    keyEventCommands: ["MoveUp"],
  });

  return true;
}

/**
 * Move the editing cursor downward.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the cursor has been moved.
 */
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

/**
 * Scroll to the beginning of the document.
 *
 * Dispatches the platform shortcut together with the
 * ScrollToBeginningOfDocument editing command.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the operation is complete.
 */
export async function scrollTop(targetId, options = {}) {
  await pressKey(targetId, "ArrowUp", "ArrowUp", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["ScrollToBeginningOfDocument"],
  });

  return true;
}

/**
 * Scroll to the end of the document.
 *
 * Dispatches the platform shortcut together with the
 * ScrollToEndOfDocument editing command.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the operation is complete.
 */
export async function scrollBottom(targetId, options = {}) {
  await pressKey(targetId, "ArrowDown", "ArrowDown", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["ScrollToEndOfDocument"],
  });

  return true;
}

// -----------------------------------------------------------------------------
// Public API: Shortcuts
// -----------------------------------------------------------------------------

/**
 * Copy the current selection to the system clipboard.
 *
 * Dispatches the platform copy shortcut together with
 * the Copy editing command.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the copy operation is complete.
 */
  export async function copy(targetId, options = {}) {
  await pressKey(targetId, "c", "KeyC", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["Copy"],
  });

  return true;
}

/**
 * Paste system clipboard text into the focused element.
 *
 * Dispatches the platform paste shortcut together with
 * the Paste editing command.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the paste operation is complete.
 */
export async function paste(targetId, options = {}) {
  await pressKey(targetId, "v", "KeyV", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["Paste"],
  });

  return true;
}

/**
 * Select all content in the current editing context.
 *
 * Dispatches the platform select-all shortcut together
 * with the SelectAll editing command.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the selection is complete.
 */
export async function select(targetId, options = {}) {
  await pressKey(targetId, "a", "KeyA", {
    ...options,
    keyEventWith: primaryModifier,
    keyEventCommands: ["SelectAll"],
  });

  return true;
}

/**
 * Clear all content in the current editing context.
 *
 * The current content is selected first and then removed
 * using the Delete editing command.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Keyboard event and CDP options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the content has been cleared.
 */
export async function clear(targetId, options = {}) {
  await select(targetId, options);

  await sleep(random(40, 120));
  await keyDelete(targetId, options);

  return true;
}

// -----------------------------------------------------------------------------
// Public API: Text Input
// -----------------------------------------------------------------------------

/**
 * Append text to an editable element.
 *
 * The element is scrolled into view, checked for editability,
 * focused, and moved to the end before text is inserted.
 *
 * A randomized prefix is entered with key events. Any
 * remaining text is written to the system clipboard and
 * pasted into the element.
 *
 * @param {string} targetId
 * Chrome target ID containing the element.
 *
 * @param {string} selector
 * CSS selector of the editable element.
 *
 * @param {*} text
 * Text to append. The value is converted to a string.
 *
 * @param {Object} [options]
 * Input, DOM polling, and CDP options.
 *
 * @param {number} [options.typeLimit=15]
 * Maximum number of leading Unicode characters eligible
 * for simulated typing. Must be a non-negative integer.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the text has been appended.
 */
export async function appendText(targetId, selector, text, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitElementEditable(targetId, selector, options);

  await focus(targetId, selector, options);

  await sleep(random(40, 120));
  await focusEnd(targetId, options);

  return textInput(targetId, text, options);
}

/**
 * Replace the content of an editable element.
 *
 * The element is scrolled into view, checked for editability,
 * focused, and cleared before text is inserted.
 *
 * A randomized prefix is entered with key events. Any
 * remaining text is written to the system clipboard and
 * pasted into the element.
 *
 * @param {string} targetId
 * Chrome target ID containing the element.
 *
 * @param {string} selector
 * CSS selector of the editable element.
 *
 * @param {*} text
 * Replacement text. The value is converted to a string.
 *
 * @param {Object} [options]
 * Input, DOM polling, and CDP options.
 *
 * @param {number} [options.typeLimit=15]
 * Maximum number of leading Unicode characters eligible
 * for simulated typing. Must be a non-negative integer.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the element content has been replaced.
 */
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

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function prop(key, value) {
  return value === undefined ? {} : { [key]: value };
}

function resolveModifiers(withKeys) {
  if (!withKeys) {
    return { entries: [], modifiers: 0 };
  }

  const modifierKeys = Object.keys(MODIFIER_KEYS);
  const keys = Array.isArray(withKeys) ? withKeys : [withKeys];
  const entries = [];
  let modifiers = 0;

  for (const key of keys) {
    if (typeof key !== "string" || !modifierKeys.includes(key.toLowerCase())) {
      throw new Error("keyEventWith must be a string or an array of strings");
    }

    const entry = MODIFIER_KEYS[key.toLowerCase()];

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

  let caughtError;

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
  } catch (error) {
    caughtError = error;
  } finally {
    try {
      await Input.dispatchKeyEvent({
        type: "keyUp",
        ...event,
      });
    } catch (error) {
      caughtError ??= error;
    }

    await sleep(random(10, 40));

    const reversed = [...entries].reverse();

    for (const entry of reversed) {
      try {
        await Input.dispatchKeyEvent({
          type: "keyUp",
          key: entry.key,
          code: entry.code,
        });
      } catch (error) {
        caughtError ??= error;
      }

      await sleep(random(10, 40));
    }
  }

  if (caughtError) {
    throw caughtError;
  }

  return true;
}

async function textInput(targetId, text, options = {}) {
  const value = String(text);
  const characters = Array.from(value);
  const typeLimit = options.typeLimit ?? 15;

  if (!Number.isInteger(typeLimit) || typeLimit < 0) {
    throw new Error("typeLimit must be a non-negative integer");
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
