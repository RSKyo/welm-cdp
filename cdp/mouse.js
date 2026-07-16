/**
 * CDP mouse interaction utilities.
 *
 * Provides human-like mouse movement, single-click, and
 * double-click operations for elements in a Chrome Target.
 *
 * Mouse positions are tracked separately by CDP address,
 * port, and Target ID. Associated state can be removed
 * when the corresponding CDP Client is closed.
 *
 * Closing a Client does not automatically remove its mouse
 * state. Pass removeMouseState to closeClients when cleanup
 * is required.
 */

import { getCdpOptions } from "./target.js";
import { getClient } from "./client.js";
import { scrollIntoView, getElementBox, waitElementClickable } from "./dom.js";

const mouseStateMap = new Map();

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * CDP mouse interaction utilities.
 *
 * Provides human-like mouse movement, single-click, and
 * double-click operations for elements in a Chrome Target.
 *
 * Mouse positions are tracked separately by CDP address,
 * port, and Target ID. Associated state can be removed
 * when the corresponding CDP Client is closed.
 *
 * Closing a Client does not automatically remove its mouse
 * state. Pass removeMouseState to closeClients when cleanup
 * is required.
 */
export function removeMouseState(targetId, options = {}) {
  const key = getMouseStateKey(targetId, options);

  return mouseStateMap.delete(key);
}

/**
 * Move the mouse to the specified viewport coordinates.
 *
 * The mouse follows a generated multi-point path with
 * variable delays to simulate natural movement.
 *
 * The final position is cached for subsequent movements.
 *
 * @param {string} targetId
 * Target ID where the mouse should be moved.
 *
 * @param {number} x
 * Destination X coordinate relative to the viewport.
 *
 * @param {number} y
 * Destination Y coordinate relative to the viewport.
 *
 * @param {Object} [options]
 * CDP connection and mouse event options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the movement is complete.
 */
export async function mouseMove(targetId, x, y, options = {}) {
  const state = getMouseState(targetId, options);

  const p1 = {
    x: state.x,
    y: state.y,
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

/**
 * Click an element using simulated mouse movement.
 *
 * The element is scrolled into view and checked for
 * clickability before its interaction point is calculated.
 * The mouse then moves to the element and performs a
 * single click with small randomized delays and jitter.
 *
 * @param {string} targetId
 * Target ID containing the element.
 *
 * @param {string} selector
 * CSS selector of the element to click.
 *
 * @param {Object} [options]
 * CDP connection, DOM polling, and mouse event options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the click is complete.
 */
export async function click(targetId, selector, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitElementClickable(targetId, selector, options);

  const box = await getElementBox(targetId, selector, options);
  const { x, y } = getElementInteractionPoint(box);

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

/**
 * Double-click an element using simulated mouse movement.
 *
 * The element is scrolled into view and checked for
 * clickability before its interaction point is calculated.
 * Two clicks are then dispatched with the appropriate CDP
 * click counts and randomized timing.
 *
 * @param {string} targetId
 * Target ID containing the element.
 *
 * @param {string} selector
 * CSS selector of the element to double-click.
 *
 * @param {Object} [options]
 * CDP connection, DOM polling, and mouse event options.
 *
 * @returns {Promise<boolean>}
 * Resolves to true after the double-click is complete.
 */
export async function doubleClick(targetId, selector, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitElementClickable(targetId, selector, options);

  const box = await getElementBox(targetId, selector, options);
  const { x, y } = getElementInteractionPoint(box);

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

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMouseStateKey(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  return `${host}:${port}:${targetId}`;
}

function getMouseState(targetId, options = {}) {
  const key = getMouseStateKey(targetId, options);

  let state = mouseStateMap.get(key);

  if (!state) {
    state = {
      x: 0,
      y: 0,
      lastUpdate: 0,
    };

    mouseStateMap.set(key, state);
  }

  return state;
}

function updateMouseState(targetId, x, y, options = {}) {
  const state = getMouseState(targetId, options);

  state.x = x;
  state.y = y;
  state.lastUpdate = Date.now();
}

// -----------------------------------------------------------------------------
// Private Helpers: Mouse Primitives (CDP)
// -----------------------------------------------------------------------------

async function mouseMoveTo(targetId, x, y, options = {}) {
  const { Input } = await getClient(targetId, options);

  await Input.dispatchMouseEvent({
    type: "mouseMoved",
    x: Number(x),
    y: Number(y),
    buttons: options.buttons ?? 0,
    modifiers: options.modifiers ?? 0,
  });

  updateMouseState(targetId, x, y, options);

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

  updateMouseState(targetId, x, y, options);

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

  updateMouseState(targetId, x, y, options);

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

  updateMouseState(targetId, x, y, options);

  return true;
}

// -----------------------------------------------------------------------------
// Private Helpers: Human Mouse Helpers
// -----------------------------------------------------------------------------

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
