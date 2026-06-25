import { getClient } from "./client.js";
import { scrollIntoView, getElementBox, waitClickable } from "./dom.js";

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


/**
 * Executes one or more browser editing commands.
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

export async function selectAll(targetId, selector, options = {}) {
  const { Input } = await getClient(targetId, options);

  await Input.dispatchKeyEvent({
    type: "rawKeyDown",
    text: "你好",
  });

  await Input.dispatchKeyEvent({
    type: "rawKeyDown",
    commands: ["Delete"],
  });
}

/**
 * ----------------------------------------------------------------------------
 * Human Keyboard Actions
 * ----------------------------------------------------------------------------
 */

/**
 * ----------------------------------------------------------------------------
 * Text Editing
 * ----------------------------------------------------------------------------
 */

// export async function focusAtEnd(targetId, selector, options = {}) {
//   await focus(targetId, selector, options);

//   await sleep(random(50, 130));

//   await pressShortcut(targetId, "Meta", "ArrowDown", options);

//   return true;
// }

// export async function clearAll(targetId, selector, options = {}) {
//   await focus(targetId, selector, options);

//   await sleep(random(50, 130));
//   await pressShortcut(targetId, "Meta", "a", options);

//   await sleep(random(40, 120));
//   await pressKey(targetId, "Backspace", options);

//   return true;
// }

/**
 * ----------------------------------------------------------------------------
 * Typing Helpers
 * ----------------------------------------------------------------------------
 */

// function randomTypoChar() {
//   const chars = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
//   return chars[random(0, chars.length - 1)];
// }

// async function makeTypo(targetId, options = {}) {
//   const key = randomTypoChar();

//   await pressKey(targetId, key, options);

//   await sleep(random(80, 220));

//   await pressKey(targetId, "Backspace", options);

//   await sleep(random(40, 120));

//   return true;
// }

// function splitTextByTypoIndexes(text, typoIndexes) {
//   const result = [];

//   let start = 0;
//   for (const index of typoIndexes) {
//     result.push(text.slice(start, index));

//     start = index;
//   }

//   result.push(text.slice(start));

//   return result;
// }

// /**
//  * ----------------------------------------------------------------------------
//  * Text Input
//  * ----------------------------------------------------------------------------
//  */

// export async function typeText(targetId, selector, text, options = {}) {
//   if (options.clear) {
//     await clearAll(targetId, selector, options);
//   } else {
//     await focusAtEnd(targetId, selector, options);
//   }

//   const { Input } = await getClient(targetId, options);

//   const value = String(text);

//   const typoCount = options.typoCount ?? 2;
//   const indexes = new Set();

//   while (indexes.size < Math.min(value.length, typoCount)) {
//     indexes.add(random(0, value.length - 1));
//   }

//   const typoIndexes = [...indexes].sort((a, b) => a - b);

//   const segments = splitTextByTypoIndexes(value, typoIndexes);

//   for (let i = 0; i < segments.length; i++) {
//     const segment = segments[i];

//     if (segment) {
//       await Input.insertText({
//         text: segment,
//       });
//     }

//     if (i < segments.length - 1) {
//       await makeTypo(targetId, options);
//     }
//   }

//   return true;
// }

// async function inputTextByPaste(targetId, selector, text, options = {}) {
//   const value = String(text);
//   const typeNum = options.typeNum ?? 0;

//   // if (typeNum > 0) {
//   //   const headText = value.slice(0, typeNum);
//   //   const restText = value.slice(typeNum);

//   //   await typeText(targetId, selector, headText, {
//   //     ...options,
//   //     clear: false,
//   //   });

//   //   if (!restText) return true;

//   //   await writeClipboard(restText);
//   //   await paste(targetId, selector, options);

//   //   return true;
//   // }

//   await writeClipboard(value);
//   await paste(targetId, selector, options);

//   return true;
// }

// export async function appendText(targetId, selector, text, options = {}) {
//   await focusAtEnd(targetId, selector, options);
//   return inputTextByPaste(targetId, selector, text, options);
// }

// export async function fillText(targetId, selector, text, options = {}) {
//   await clearAll(targetId, selector, options);
//   // return inputTextByPaste(targetId, selector, text, options);
// }
