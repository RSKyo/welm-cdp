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
 * ----------------------------------------------------------------------------
 * Mouse State
 * ----------------------------------------------------------------------------
 */

const mouseState = {
  x: 0,
  y: 0,
  lastUpdate: 0,
};

/**
 * ----------------------------------------------------------------------------
 * Mouse Primitives (CDP)
 * ----------------------------------------------------------------------------
 */

async function mouseMoveTo(targetId, x, y, options = {}) {
  const { Input } = await getClient(targetId, options);

  await Input.dispatchMouseEvent({
    type: "mouseMoved",
    x: Number(x),
    y: Number(y),
    buttons: options.buttons ?? 0,
    modifiers: options.modifiers ?? 0,
  });

  mouseState.x = x;
  mouseState.y = y;
  mouseState.lastUpdate = Date.now();

  return true;
}

async function mouseDownAt(targetId, x, y, options = {}) {
  const { Input } = await getClient(targetId, options);

  await Input.dispatchMouseEvent({
    type: "mousePressed",
    x: Number(x),
    y: Number(y),
    button: options.button ?? "left",
    buttons: options.buttons ?? 1,
    modifiers: options.modifiers ?? 0,
    clickCount: options.clickCount ?? 1,
  });

  return true;
}

async function mouseUpAt(targetId, x, y, options = {}) {
  const { Input } = await getClient(targetId, options);

  await Input.dispatchMouseEvent({
    type: "mouseReleased",
    x: Number(x),
    y: Number(y),
    button: options.button ?? "left",
    buttons: options.buttons ?? 0,
    modifiers: options.modifiers ?? 0,
    clickCount: options.clickCount ?? 1,
  });

  return true;
}

/**
 * 在指定 viewport 坐标触发鼠标滚轮。
 *
 * x、y 基于 viewport 坐标。
 * deltaY > 0 向下滚动，deltaY < 0 向上滚动。
 */
async function wheelAt(targetId, x, y, deltaX = 0, deltaY = 0, options = {}) {
  const { Input } = await getClient(targetId, options);

  await Input.dispatchMouseEvent({
    type: "mouseWheel",
    x: Number(x),
    y: Number(y),
    deltaX: Number(deltaX),
    deltaY: Number(deltaY),
    modifiers: options.modifiers ?? 0,
  });

  return true;
}

/**
 * ----------------------------------------------------------------------------
 * Human Mouse Helpers
 * ----------------------------------------------------------------------------
 */

function distance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function getMouseMoveNextPoint(p1, p2) {
  const scale = 0.5;
  const t = 0.8;

  const d = distance(p1, p2);
  const p1r = d * scale;
  const p2r = d * t;

  while (true) {
    const angle = Math.random() * Math.PI * 2;
    const p3r = Math.sqrt(Math.random()) * p1r;

    const p3 = {
      x: p1.x + Math.cos(angle) * p3r,
      y: p1.y + Math.sin(angle) * p3r,
    };

    if (distance(p3, p2) <= p2r) {
      return p3;
    }
  }
}

function getMouseMovePoints(p1, p2) {
  const threshold = 10;

  const points = [p1];
  let p3 = p1;

  while (distance(p3, p2) > threshold) {
    p3 = getMouseMoveNextPoint(p3, p2);
    points.push(p3);
  }

  points.push(p2);

  return points;
}

function getMouseMoveIntervals(totalTime, stepCount) {
  const result = [];

  for (let i = 0; i < stepCount; i++) {
    const t = stepCount === 1 ? 1 : i / (stepCount - 1);

    // cosine ease-in-out（更自然）
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * t);

    result.push(eased);
  }

  const sum = result.reduce((a, b) => a + b, 0);

  return result.map((v) => (v / sum) * totalTime);
}

function getJitterPoint(x, y) {
  const hasJitter = Math.random() < 0.2;

  return {
    x: x + (hasJitter ? random(-2, 2) : 0),
    y: y + (hasJitter ? random(-2, 2) : 0),
  };
}

function gaussian() {
  return (
    (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2
  );
}

function getElementInteractionPoint(box) {
  const jitterRadius = Math.min(10, Math.min(box.width, box.height) * 0.2);

  const x = box.centerX + gaussian() * jitterRadius;
  const y = box.centerY + gaussian() * jitterRadius;

  return { x, y, box };
}

/**
 * ----------------------------------------------------------------------------
 * Human Mouse Actions
 * ----------------------------------------------------------------------------
 */

export async function mouseMove(targetId, x, y, options = {}) {
  const p1 = {
    x: mouseState.x,
    y: mouseState.y,
  };
  const p2 = { x, y };

  const points = getMouseMovePoints(p1, p2);
  const count = points.length;
  const totalTime = random(500, 1000);
  const delays = getMouseMoveIntervals(totalTime, count - 1);

  for (let i = 0; i < count; i++) {
    const p = points[i];
    await mouseMoveTo(targetId, p.x, p.y, options);

    if (i < count - 1) {
      await sleep(delays[i]);
    }
  }

  return true;
}

export async function clickAt(targetId, x, y, options = {}) {
  // move 到目标点（带轨迹系统）
  await mouseMove(targetId, x, y, options);
  await sleep(random(80, 220));

  let p = getJitterPoint(x, y);

  await mouseDownAt(targetId, p.x, p.y, options);
  await sleep(random(30, 120));
  await mouseUpAt(targetId, p.x, p.y, options);
  await sleep(random(50, 180));

  return true;
}

export async function doubleClickAt(targetId, x, y, options = {}) {
  // move 到目标点（带轨迹系统）
  await mouseMove(targetId, x, y, options);
  await sleep(random(80, 220));

  const p1 = getJitterPoint(x, y);

  await mouseDownAt(targetId, p1.x, p1.y, {
    ...options,
    buttons: 1,
    clickCount: 1,
  });
  await sleep(random(30, 120));
  await mouseUpAt(targetId, p1.x, p1.y, {
    ...options,
    buttons: 0,
    clickCount: 1,
  });

  await sleep(random(80, 180));

  const p2 = getJitterPoint(x, y);

  await mouseDownAt(targetId, p2.x, p2.y, {
    ...options,
    buttons: 1,
    clickCount: 2,
  });
  await sleep(random(30, 120));
  await mouseUpAt(targetId, p2.x, p2.y, {
    ...options,
    buttons: 0,
    clickCount: 2,
  });

  return true;
}

export async function click(targetId, selector, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitClickable(targetId, selector, options);

  const box = await getElementBox(targetId, selector, options);
  const { x, y } = getElementInteractionPoint(box);

  return clickAt(targetId, x, y, options);
}

export async function doubleClick(targetId, selector, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitClickable(targetId, selector, options);

  const box = await getElementBox(targetId, selector, options);
  const { x, y } = getElementInteractionPoint(box);

  return doubleClickAt(targetId, x, y, options);
}

/**
 * ----------------------------------------------------------------------------
 * Keyboard Primitives (CDP)
 * ----------------------------------------------------------------------------
 */

const KEY_MAP = {
  Enter: {
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  },
  Tab: {
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  },
  Escape: {
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  },
  Backspace: {
    code: "Backspace",
    windowsVirtualKeyCode: 8,
    nativeVirtualKeyCode: 8,
  },
  Delete: {
    code: "Delete",
    windowsVirtualKeyCode: 46,
    nativeVirtualKeyCode: 46,
  },
  ArrowUp: {
    code: "ArrowUp",
    windowsVirtualKeyCode: 38,
    nativeVirtualKeyCode: 38,
  },
  ArrowDown: {
    code: "ArrowDown",
    windowsVirtualKeyCode: 40,
    nativeVirtualKeyCode: 40,
  },
  ArrowLeft: {
    code: "ArrowLeft",
    windowsVirtualKeyCode: 37,
    nativeVirtualKeyCode: 37,
  },
  ArrowRight: {
    code: "ArrowRight",
    windowsVirtualKeyCode: 39,
    nativeVirtualKeyCode: 39,
  },
  Home: {
    code: "Home",
    windowsVirtualKeyCode: 36,
    nativeVirtualKeyCode: 36,
  },
  End: {
    code: "End",
    windowsVirtualKeyCode: 35,
    nativeVirtualKeyCode: 35,
  },
  PageUp: {
    code: "PageUp",
    windowsVirtualKeyCode: 33,
    nativeVirtualKeyCode: 33,
  },
  PageDown: {
    code: "PageDown",
    windowsVirtualKeyCode: 34,
    nativeVirtualKeyCode: 34,
  },
  Meta: {
    code: "MetaLeft",
    windowsVirtualKeyCode: 91,
    nativeVirtualKeyCode: 91,
  },
};

for (const char of "abcdefghijklmnopqrstuvwxyz") {
  KEY_MAP[char] = {
    code: `Key${char.toUpperCase()}`,
    windowsVirtualKeyCode: char.toUpperCase().charCodeAt(0),
    nativeVirtualKeyCode: char.toUpperCase().charCodeAt(0),
  };
}

for (const char of "0123456789") {
  KEY_MAP[char] = {
    code: `Digit${char}`,
    windowsVirtualKeyCode: char.charCodeAt(0),
    nativeVirtualKeyCode: char.charCodeAt(0),
  };
}

function buildKeyEvent(key, options = {}) {
  const preset = KEY_MAP[key] ?? {};

  return {
    key,
    code: options.code ?? preset.code,
    windowsVirtualKeyCode:
      options.windowsVirtualKeyCode ?? preset.windowsVirtualKeyCode,
    nativeVirtualKeyCode:
      options.nativeVirtualKeyCode ?? preset.nativeVirtualKeyCode,
    modifiers: options.modifiers ?? 0,
  };
}

async function keyDown(targetId, key, options = {}) {
  const { Input } = await getClient(targetId, options);

  await Input.dispatchKeyEvent({
    type: "keyDown",
    ...buildKeyEvent(key, options),
    text: options.text,
    unmodifiedText: options.unmodifiedText,
  });

  return true;
}

async function keyUp(targetId, key, options = {}) {
  const { Input } = await getClient(targetId, options);

  await Input.dispatchKeyEvent({
    type: "keyUp",
    ...buildKeyEvent(key, options),
  });

  return true;
}

/**
 * ----------------------------------------------------------------------------
 * Human Keyboard Actions
 * ----------------------------------------------------------------------------
 */

async function pressKey(targetId, key, options = {}) {
  await sleep(random(50, 130));
  await keyDown(targetId, key, options);

  await sleep(random(10, 50));
  await keyUp(targetId, key, options);

  return true;
}

async function pressShortcut(targetId, modifier, key, options = {}) {
  await keyDown(targetId, modifier, options);

  await sleep(random(10, 40));

  await pressKey(targetId, key, options);

  await sleep(random(10, 50));

  await keyUp(targetId, modifier, options);

  return true;
}

export async function pressEnter(targetId, options = {}) {
  return pressKey(targetId, "Enter", options);
}

export async function pressTab(targetId, options = {}) {
  return pressKey(targetId, "Tab", options);
}

export async function pressEscape(targetId, options = {}) {
  return pressKey(targetId, "Escape", options);
}

export async function pressBackspace(targetId, options = {}) {
  return pressKey(targetId, "Backspace", options);
}

export async function pressDelete(targetId, options = {}) {
  return pressKey(targetId, "Delete", options);
}

export async function pressArrowUp(targetId, options = {}) {
  return pressKey(targetId, "ArrowUp", options);
}

export async function pressArrowDown(targetId, options = {}) {
  return pressKey(targetId, "ArrowDown", options);
}

export async function pressArrowLeft(targetId, options = {}) {
  return pressKey(targetId, "ArrowLeft", options);
}

export async function pressArrowRight(targetId, options = {}) {
  return pressKey(targetId, "ArrowRight", options);
}

export async function pressHome(targetId, options = {}) {
  return pressKey(targetId, "Home", options);
}

export async function pressEnd(targetId, options = {}) {
  return pressKey(targetId, "End", options);
}

export async function pressPageUp(targetId, options = {}) {
  return pressKey(targetId, "PageUp", options);
}

export async function pressPageDown(targetId, options = {}) {
  return pressKey(targetId, "PageDown", options);
}

export async function copy(targetId, options = {}) {
  await sleep(random(50, 130));
  return pressShortcut(targetId, "Meta", "c", options);
}

export async function paste(targetId, options = {}) {
  await sleep(random(50, 130));
  return pressShortcut(targetId, "Meta", "v", options);
}

/**
 * ----------------------------------------------------------------------------
 * Text Editing
 * ----------------------------------------------------------------------------
 */

export async function focus(targetId, selector, options = {}) {
  return click(targetId, selector, options);
}

export async function focusAtEnd(targetId, selector, options = {}) {
  await focus(targetId, selector, options);

  await sleep(random(50, 130));

  await pressShortcut(targetId, "Meta", "ArrowDown", options);

  return true;
}

export async function selectAll(targetId, selector, options = {}) {
  await focus(targetId, selector, options);

  await sleep(random(50, 130));
  await pressShortcut(targetId, "Meta", "a", options);

  return true;
}

export async function clearAll(targetId, selector, options = {}) {
  await selectAll(targetId, selector, options);

  await sleep(random(40, 120));
  await pressKey(targetId, "Backspace", options);

  return true;
}

/**
 * ----------------------------------------------------------------------------
 * Typing Helpers
 * ----------------------------------------------------------------------------
 */

function randomTypoChar() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
  return chars[random(0, chars.length - 1)];
}

async function makeTypo(targetId, options = {}) {
  const key = randomTypoChar();

  await pressKey(targetId, key, options);

  await sleep(random(80, 220));

  await pressKey(targetId, "Backspace", options);

  await sleep(random(40, 120));

  return true;
}

function splitTextByTypoIndexes(text, typoIndexes) {
  const result = [];

  let start = 0;
  for (const index of typoIndexes) {
    result.push(text.slice(start, index));

    start = index;
  }

  result.push(text.slice(start));

  return result;
}

/**
 * ----------------------------------------------------------------------------
 * Text Input
 * ----------------------------------------------------------------------------
 */

export async function typeText(targetId, selector, text, options = {}) {
  if (options.clear) {
    await clearAll(targetId, selector, options);
  } else {
    await focusAtEnd(targetId, selector, options);
  }

  const { Input } = await getClient(targetId, options);

  const value = String(text);

  const typoCount = options.typoCount ?? 2;
  const indexes = new Set();

  while (indexes.size < Math.min(value.length, typoCount)) {
    indexes.add(random(0, value.length - 1));
  }

  const typoIndexes = [...indexes].sort((a, b) => a - b);

  const segments = splitTextByTypoIndexes(value, typoIndexes);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (segment) {
      await Input.insertText({
        text: segment,
      });
    }

    if (i < segments.length - 1) {
      await makeTypo(targetId, options);
    }
  }

  return true;
}

async function inputTextByPaste(targetId, selector, text, options = {}) {
  const value = String(text);
  const typeNum = options.typeNum ?? 0;

  if (typeNum > 0) {
    const headText = value.slice(0, typeNum);
    const restText = value.slice(typeNum);

    await typeText(targetId, selector, headText, {
      ...options,
      clear: false,
    });

    if (!restText) return true;

    await writeClipboard(restText);
    await paste(targetId, options);

    return true;
  }

  await writeClipboard(value);
  await paste(targetId, options);

  return true;
}

export async function appendText(targetId, selector, text, options = {}) {
  await focusAtEnd(targetId, selector, options);
  return inputTextByPaste(targetId, selector, text, options);
}

export async function fillText(targetId, selector, text, options = {}) {
  await clearAll(targetId, selector, options);
  return inputTextByPaste(targetId, selector, text, options);
}
