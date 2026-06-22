import { ERROR_CODE, createError } from "../infra/error.js";
import { getClient } from "./client.js";
import { evaluate } from "./runtime.js";
import { waitEditable, waitClickable } from "./wait.js";
import { getElementCenter } from "./dom.js";
import { log } from "../infra/log.js";



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

/**
 * 获取 Input 域客户端。
 */
async function getInput(targetId, options = {}) {
  const { Input } = await getClient(targetId, options);

  return Input;
}

/**
 * Input.dispatchMouseEvent
 * x、y 基于 viewport（视口）的坐标，而不是基于页面的坐标
 * button: 表示触发本次鼠标事件的按钮；（left、right、middle、back、forward、none）
 * buttons: 表示当前有哪些鼠标按钮正处于按住状态；（left=1, right=2, middle=4, back=8, forward=16，left+right=3...）
 * modifiers: 表示当前有哪些键盘修饰键正在按住；（alt=1, ctrl=2, meta(Command / Win)=4, shift=8），它是 bitmask（位掩码），可以同时表示多个修饰键的状态，例如 Ctrl + Shift 就是 2 | 8 = 10
 * clickCount: 表示当前这是连续点击中的第几次（第一次点击为1，第二次点击为2，依此类推），不是执行几次点击
 */

export const mouseState = {
  x: 0,
  y: 0,
  lastUpdate: 0,
};

/**
 * 移动鼠标到指定 viewport 坐标。
 *
 * x、y 基于 viewport 坐标。
 */
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

/**
 * 鼠标按下不松开
 */
async function mouseDownAt(targetId, x, y, options = {}) {
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

/**
 * 鼠标抬起。
 */
async function mouseUpAt(targetId, x, y, options = {}) {
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
async function scrollIntoView(targetId, selector, options = {}) {
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
 * 点击元素。
 */
export async function click(targetId, selector, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitClickable(targetId, selector, options);

  const point = await getElementCenter(targetId, selector, options);
  return clickAt(targetId, point.x, point.y, options);
}

/**
 * 双击元素。
 */
export async function doubleClick(targetId, selector, options = {}) {
  await scrollIntoView(targetId, selector, options);
  await waitClickable(targetId, selector, options);

  const point = await getElementCenter(targetId, selector, options);
  return doubleClickAt(targetId, point.x, point.y, options);
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

/**
 * 常用功能键映射。
 *
 * 普通文本输入使用 type() / fill()，
 * 不通过 press() 模拟字符键。
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

/**
 * 键盘按下。
 */
async function keyDown(targetId, key, options = {}) {
  const Input = await getInput(targetId, options);

  await Input.dispatchKeyEvent({
    type: "keyDown",
    ...buildKeyEvent(key, options),
    text: options.text,
    unmodifiedText: options.unmodifiedText,
  });

  return true;
}

/**
 * 键盘抬起。
 */
async function keyUp(targetId, key, options = {}) {
  const Input = await getInput(targetId, options);

  await Input.dispatchKeyEvent({
    type: "keyUp",
    ...buildKeyEvent(key, options),
  });

  return true;
}

/**
 * 按一次按键。
 */
async function press(targetId, key, options = {}) {
  await keyDown(targetId, key, options);
  await keyUp(targetId, key, options);

  return true;
}

export async function enter(targetId, options = {}) {
  return press(targetId, "Enter", options);
}

export async function tab(targetId, options = {}) {
  return press(targetId, "Tab", options);
}

export async function escape(targetId, options = {}) {
  return press(targetId, "Escape", options);
}

export async function backspace(targetId, options = {}) {
  return press(targetId, "Backspace", options);
}

/**
 * Delete。
 *
 * JS 中 delete 是关键字，因此函数命名为 deleteKey。
 */
export async function deleteKey(targetId, options = {}) {
  return press(targetId, "Delete", options);
}

export async function arrowUp(targetId, options = {}) {
  return press(targetId, "ArrowUp", options);
}

export async function arrowDown(targetId, options = {}) {
  return press(targetId, "ArrowDown", options);
}

export async function arrowLeft(targetId, options = {}) {
  return press(targetId, "ArrowLeft", options);
}

export async function arrowRight(targetId, options = {}) {
  return press(targetId, "ArrowRight", options);
}

export async function home(targetId, options = {}) {
  return press(targetId, "Home", options);
}

export async function end(targetId, options = {}) {
  return press(targetId, "End", options);
}

export async function pageUp(targetId, options = {}) {
  return press(targetId, "PageUp", options);
}

export async function pageDown(targetId, options = {}) {
  return press(targetId, "PageDown", options);
}

/**
 * 聚焦元素。
 */
export async function focusElement(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      el.focus();

      // input / textarea
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement
      ) {
        const len = el.value.length;
        el.setSelectionRange(len, len);

        return {
          type: "input",
          length: len,
        };
      }

      // contenteditable
      if (el.isContentEditable) {
        const selection = window.getSelection();
        const range = document.createRange();

        range.selectNodeContents(el);
        range.collapse(false);

        selection.removeAllRanges();
        selection.addRange(range);

        return {
          type: "contenteditable",
        };
      }

      return true;
    })()
  `;

  await evaluate(targetId, expression, options);
  return true;
}

/**
 * 清空元素值。
 */
export async function clearElementValue(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      el.focus();

      if ("value" in el) {
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }

      if (el.isContentEditable) {
        el.textContent = "";
        el.dispatchEvent(new InputEvent("input", {
          bubbles: true,
          inputType: "deleteContentBackward",
          data: null,
        }));

        return true;
      }

      throw new Error("element is not an input or contenteditable element");
    })()
  `;

  await evaluate(targetId, expression, options);
  return true;
}

/**
 * 模拟输入文本。
 * 更接近真实键盘输入，适合触发输入法/前端监听。
 */
export async function type(targetId, selector, text, options = {}) {
  await waitEditable(targetId, selector, options);
  await scrollIntoView(targetId, selector, options);
  await focusElement(targetId, selector, options);

  if (options.clear) {
    await clearElementValue(targetId, selector, options);
  }

  const Input = await getInput(targetId, options);

  await Input.insertText({
    text: String(text),
  });

  return true;
}

/**
 * 直接设置元素值。
 * 比 type 更快，但更偏 DOM 写入。
 * 会覆盖原值，不需要 clear。
 */
export async function fill(targetId, selector, text, options = {}) {
  await waitEditable(targetId, selector, options);
  await scrollIntoView(targetId, selector, options);
  await focusElement(targetId, selector, options);

  const textBase64 = Buffer.from(String(text), "utf8").toString("base64");

  const expression = `
    (() => {
      const decodeBase64Utf8 = value => {
        const binary = atob(value);
        const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));

        return new TextDecoder("utf-8").decode(bytes);
      };

      const setFormValue = (element, value) => {
        const proto =
          element instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;

        const descriptor =
          Object.getOwnPropertyDescriptor(proto, "value");

        if (
          descriptor &&
          typeof descriptor.set === "function"
        ) {
          descriptor.set.call(element, value);
          return;
        }

        element.value = value;
      };

      const text = decodeBase64Utf8(${q(textBase64)});

      const el = ${buildElementResolver(selector, options)};

      if (el.isContentEditable) {
        el.textContent = text;
      } else if ("value" in el) {
        setFormValue(el, text);
      } else {
        throw new Error("element is not an input or contenteditable element");
      }

      el.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text,
      }));

      el.dispatchEvent(new Event("change", {
        bubbles: true,
      }));

      return true;
    })()
  `;

  await evaluate(targetId, expression, options);
  return true;
}
