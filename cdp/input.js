import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";
import { getClient } from "./client.js";
import { evaluate } from "./runtime.js";
import { waitSelector, waitEditable, waitClickable } from "./wait.js";
import { getElementCenter } from "./dom.js";

function q(value) {
  return JSON.stringify(value);
}

/**
 * 获取 Input 域客户端。
 */
async function getInput(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

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

/**
 * 鼠标移动。
 */
async function mouseMoveTo(targetId, x, y, options = {}) {
  const Input = await getInput(targetId, options);

  await Input.dispatchMouseEvent({
    type: "mouseMoved",
    x: Number(x),
    y: Number(y),
    buttons: options.buttons ?? 0,
    modifiers: options.modifiers ?? 0,
  });

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
 * 坐标点击。
 */
async function clickAt(targetId, x, y, options = {}) {
  await mouseMoveTo(targetId, x, y, {
    ...options,
    buttons: 0,
  });

  await mouseDownAt(targetId, x, y, {
    ...options,
    clickCount: 1,
  });

  await mouseUpAt(targetId, x, y, {
    ...options,
    clickCount: 1,
  });

  return true;
}

/**
 * 坐标双击。
 */
async function doubleClickAt(targetId, x, y, options = {}) {
  await mouseMoveTo(targetId, x, y, {
    ...options,
    button: "none",
    buttons: 0,
  });

  await mouseDownAt(targetId, x, y, {
    ...options,
    clickCount: 1,
  });

  await mouseUpAt(targetId, x, y, {
    ...options,
    clickCount: 1,
  });

  await mouseDownAt(targetId, x, y, {
    ...options,
    clickCount: 2,
  });

  await mouseUpAt(targetId, x, y, {
    ...options,
    clickCount: 2,
  });

  return true;
}

/**
 * 滚动到元素进入视口。
 */
async function scrollIntoView(targetId, selector, options = {}) {
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }

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
  await waitClickable(targetId, selector, options);
  await scrollIntoView(targetId, selector, options);
  const point = await getElementCenter(targetId, selector, options);

  return clickAt(targetId, point.x, point.y, options);
}

/**
 * 双击元素。
 */
export async function doubleClick(targetId, selector, options = {}) {
  await waitClickable(targetId, selector, options);
  await scrollIntoView(targetId, selector, options);
  const point = await getElementCenter(targetId, selector, options);

  return doubleClickAt(targetId, point.x, point.y, options);
}

/**
 * 鼠标滚轮。
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
 * 键盘按下。
 */
async function keyDown(targetId, key, options = {}) {
  key = assertNonBlank(key, "key");

  const Input = await getInput(targetId, options);

  await Input.dispatchKeyEvent({
    type: "keyDown",
    key,
    code: options.code,
    text: options.text,
    unmodifiedText: options.unmodifiedText,
    windowsVirtualKeyCode: options.windowsVirtualKeyCode,
    nativeVirtualKeyCode: options.nativeVirtualKeyCode,
    modifiers: options.modifiers ?? 0,
  });

  return true;
}

/**
 * 键盘抬起。
 */
async function keyUp(targetId, key, options = {}) {
  key = assertNonBlank(key, "key");

  const Input = await getInput(targetId, options);

  await Input.dispatchKeyEvent({
    type: "keyUp",
    key,
    code: options.code,
    modifiers: options.modifiers ?? 0,
  });

  return true;
}

/**
 * 按一次键。
 */
export async function press(targetId, key, options = {}) {
  await keyDown(targetId, key, options);
  await keyUp(targetId, key, options);

  return true;
}

/**
 * 回车。
 */
export async function enter(targetId, options = {}) {
  return press(targetId, "Enter", {
    ...options,
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });
}

/**
 * Tab。
 */
export async function tab(targetId, options = {}) {
  return press(targetId, "Tab", {
    ...options,
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  });
}

/**
 * Escape。
 */
export async function escape(targetId, options = {}) {
  return press(targetId, "Escape", {
    ...options,
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  });
}

/**
 * 聚焦元素。
 */
async function focusElement(targetId, selector, options = {}) {
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }

      el.focus();

      return true;
    })()
  `;

  await evaluate(targetId, expression, options);
  return true;
}

/**
 * 清空元素值。
 */
async function clearElementValue(targetId, selector, options = {}) {
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }

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
 * 模拟真人输入。
 */
export async function type(targetId, selector, text, options = {}) {
  selector = assertNonBlank(selector, "selector");

  if (text == null) {
    throw createError(ERROR_CODE.INVALID, "missing text");
  }

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
 * 直接填充输入框值。
 */
export async function fill(targetId, selector, text, options = {}) {
  selector = assertNonBlank(selector, "selector");

  if (text == null) {
    throw createError(ERROR_CODE.INVALID, "missing text");
  }

  await waitEditable(targetId, selector, options);
  await scrollIntoView(targetId, selector, options);
  await focusElement(targetId, selector, options);

  const textBase64 = Buffer
    .from(String(text), "utf8")
    .toString("base64");

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
      const element = document.querySelector(${q(selector)});

      if (!element) {
        throw new Error("element not found");
      }

      if (element.isContentEditable) {
        element.textContent = text;
      } else if ("value" in element) {
        setFormValue(element, text);
      } else {
        throw new Error("element is not an input or contenteditable element");
      }

      element.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: text,
      }));

      element.dispatchEvent(new Event("change", {
        bubbles: true,
      }));

      return true;
    })()
  `;

  await evaluate(targetId, expression, options);
  return true;
}