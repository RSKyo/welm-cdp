import { mouseState, mouseMoveTo, mouseDownAt, mouseUpAt } from "./input";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function distance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function getMouseMoveNextPoint(p1, p2) {
  const radiusRate = 0.5;
  const progressRate = 0.8;

  const d = distance(p1, p2);

  const radius = d * radiusRate;

  while (true) {
    const angle = Math.random() * Math.PI * 2;

    const r = Math.sqrt(Math.random()) * radius;

    const p3 = {
      x: p1.x + Math.cos(angle) * r,
      y: p1.y + Math.sin(angle) * r,
    };

    if (distance(p3, p2) < d * progressRate) {
      return p3;
    }
  }
}

function getMouseMovePoints(p1, p2) {
  const threshold = 10;

  const points = [p1];

  let current = p1;

  while (distance(current, p2) > threshold) {
    current = getMouseMoveNextPoint(current, p2);

    points.push(current);
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
