import {
  getInput,
  mouseState,
  mouseMoveTo,
  mouseDownAt,
  mouseUpAt,
  scrollIntoView,
  keyDown,
  keyUp,
} from "./input";

import { waitClickable } from "./wait.js";
import { getElementBox } from "./dom.js";

import { writeClipboard } from "../utils/clipboard.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    p3 = getMouseMoveNextPoint(current, p2);
    points.push(p3);
  }

  points.push(p2);

  return points;
}

export function getMouseMoveIntervals(totalTime, stepCount) {
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

function getJitterPoint(x, y) {
  const hasJitter = Math.random() < 0.2;

  return {
    x: x + (hasJitter ? random(-2, 2) : 0),
    y: y + (hasJitter ? random(-2, 2) : 0),
  };
}

async function clickAt(targetId, x, y, options = {}) {
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

async function doubleClickAt(targetId, x, y, options = {}) {
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
 * 按一次按键。
 */
async function keyPress(targetId, key, options = {}) {
  await sleep(random(50, 130));
  await keyDown(targetId, key, options);

  await sleep(random(10, 50));
  await keyUp(targetId, key, options);

  return true;
}

export async function pressEnter(targetId, options = {}) {
  return keyPress(targetId, "Enter", options);
}

export async function pressTab(targetId, options = {}) {
  return keyPress(targetId, "Tab", options);
}

export async function pressEscape(targetId, options = {}) {
  return keyPress(targetId, "Escape", options);
}

export async function pressBackspace(targetId, options = {}) {
  return keyPress(targetId, "Backspace", options);
}

export async function pressDelete(targetId, options = {}) {
  return keyPress(targetId, "Delete", options);
}

export async function pressArrowUp(targetId, options = {}) {
  return keyPress(targetId, "ArrowUp", options);
}

export async function pressArrowDown(targetId, options = {}) {
  return keyPress(targetId, "ArrowDown", options);
}

export async function pressArrowLeft(targetId, options = {}) {
  return keyPress(targetId, "ArrowLeft", options);
}

export async function pressArrowRight(targetId, options = {}) {
  return keyPress(targetId, "ArrowRight", options);
}

export async function pressHome(targetId, options = {}) {
  return keyPress(targetId, "Home", options);
}

export async function pressEnd(targetId, options = {}) {
  return keyPress(targetId, "End", options);
}

export async function pressPageUp(targetId, options = {}) {
  return keyPress(targetId, "PageUp", options);
}

export async function pressPageDown(targetId, options = {}) {
  return keyPress(targetId, "PageDown", options);
}

export async function copy(targetId, options = {}) {
  await sleep(random(50, 130));
  await keyDown(targetId, "Meta", options);

  await sleep(random(10, 40));
  await keyPress(targetId, "c", {
    ...options,
    modifiers: 4,
  });

  await sleep(random(10, 50));
  await keyUp(targetId, "Meta", options);

  return true;
}

export async function paste(targetId, options = {}) {
  await sleep(random(50, 130));
  await keyDown(targetId, "Meta", options);

  await sleep(random(10, 40));
  await keyPress(targetId, "v", {
    ...options,
    modifiers: 4,
  });

  await sleep(random(10, 50));
  await keyUp(targetId, "Meta", options);

  return true;
}

export async function focus(targetId, selector, options = {}) {
  return click(targetId, selector, options);
}

export async function focusAtEnd(targetId, selector, options = {}) {
  await focus(targetId, selector, options);

  await sleep(random(50, 130));
  await keyDown(targetId, "Meta", options);

  await keyPress(targetId, "ArrowDown", {
    ...options,
    modifiers: 4,
  });

  await sleep(random(10, 50));
  await keyUp(targetId, "Meta", options);

  return true;
}

export async function selectAll(targetId, selector, options = {}) {
  await focus(targetId, selector, options);

  await sleep(random(50, 130));
  await keyDown(targetId, "Meta", options);

  await sleep(random(10, 40));
  await keyPress(targetId, "a", {
    ...options,
    modifiers: 4,
  });

  await sleep(random(10, 50));
  await keyUp(targetId, "Meta", options);

  return true;
}

export async function clearAll(targetId, selector, options = {}) {
  await selectAll(targetId, selector, options);

  await sleep(random(40, 120));
  await keyPress(targetId, "Backspace", options);

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

function getTypeDelay(char, options = {}) {
  if (/\s/.test(char)) {
    return random(options.minSpaceDelay ?? 60, options.maxSpaceDelay ?? 180);
  }

  if (/[,.!?;:，。！？；：]/.test(char)) {
    return random(
      options.minPunctuationDelay ?? 120,
      options.maxPunctuationDelay ?? 300,
    );
  }

  return random(options.minDelay ?? 30, options.maxDelay ?? 120);
}

function randomTypoChar() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return chars[Math.floor(Math.random() * chars.length)];
}

function getTypoRate(text, options = {}) {
  const length = String(text).length;

  if (options.typoRate !== undefined) {
    return options.typoRate;
  }

  if (length <= 15) return 0.15;
  if (length <= 40) return 0.08;
  if (length <= 100) return 0.04;

  return 0.02;
}

function shouldMakeTypo(value, options = {}) {
  return Math.random() < getTypoRate(value, options);
}

async function makeTypo(targetId, Input, options = {}) {
  await Input.insertText({
    text: randomTypoChar(),
  });

  await sleep(random(80, 220));
  await keyPress(targetId, "Backspace", options);
  await sleep(random(40, 120));

  return true;
}

export async function typeText(targetId, selector, text, options = {}) {
  if (options.clear) {
    await clearAll(targetId, selector, options);
  } else {
    await focusAtEnd(targetId, selector, options);
  }

  const Input = await getInput(targetId, options);
  const value = String(text);

  for (const char of value) {
    await sleep(getTypeDelay(char, options));

    if (shouldMakeTypo(value, options)) {
      await makeTypo(targetId, Input, options);
    }

    await Input.insertText({
      text: char,
    });
  }

  return true;
}


