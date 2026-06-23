import { getClient } from "./client.js";
import { evaluate } from "./runtime.js";

function q(value) {
  return JSON.stringify(value);
}

function buildElementResolver(selector, options = {}) {
  return `
    (() => {
      const elements = document.querySelectorAll(${q(selector)});
      const count = elements.length;

      if (count === 0) {
        throw new Error("element not found");
      }

      let index = ${options.nth ?? 0};

      if (index < 0) {
        index = count + index;
      }

      if (index < 0 || index >= count) {
        throw new Error(\`element index out of range: \${index}\`);
      }

      return elements[index];
    })()
  `;
}

export async function getInput(targetId, options = {}) {
  const { Input } = await getClient(targetId, options);

  return Input;
}

export const mouseState = {
  x: 0,
  y: 0,
  lastUpdate: 0,
};

export async function mouseMoveTo(targetId, x, y, options = {}) {
  const Input = await getInput(targetId, options);

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

export async function mouseDownAt(targetId, x, y, options = {}) {
  const Input = await getInput(targetId, options);

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

export async function mouseUpAt(targetId, x, y, options = {}) {
  const Input = await getInput(targetId, options);

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
 * 滚动到元素进入视口。
 */
export async function scrollIntoView(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      el.scrollIntoView({
        block: ${q(options.block ?? "center")},
        inline: ${q(options.inline ?? "center")},
        behavior: ${q(options.behavior ?? "instant")},
      });

      return true;
    })()
  `;

  await evaluate(targetId, expression, options);

  return true;
}

/**
 * 在指定 viewport 坐标触发鼠标滚轮。
 *
 * x、y 基于 viewport 坐标。
 * deltaY > 0 向下滚动，deltaY < 0 向上滚动。
 */
export async function wheelAt(
  targetId,
  x,
  y,
  deltaX = 0,
  deltaY = 0,
  options = {},
) {
  const Input = await getInput(targetId, options);

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
  c: {
    code: "KeyC",
    windowsVirtualKeyCode: 67,
    nativeVirtualKeyCode: 67,
  },

  v: {
    code: "KeyV",
    windowsVirtualKeyCode: 86,
    nativeVirtualKeyCode: 86,
  },
};

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

export async function keyDown(targetId, key, options = {}) {
  const Input = await getInput(targetId, options);

  await Input.dispatchKeyEvent({
    type: "keyDown",
    ...buildKeyEvent(key, options),
    text: options.text,
    unmodifiedText: options.unmodifiedText,
  });

  return true;
}

export async function keyUp(targetId, key, options = {}) {
  const Input = await getInput(targetId, options);

  await Input.dispatchKeyEvent({
    type: "keyUp",
    ...buildKeyEvent(key, options),
  });

  return true;
}

export async function keyPress(targetId, key, options = {}) {
  await keyDown(targetId, key, options);
  await keyUp(targetId, key, options);
  return true;
}

export async function focus(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      el.focus();
      return true;
    })()
  `;

  await evaluate(targetId, expression, options);
  return true;
}
