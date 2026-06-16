import { assertNonBlank } from "../infra/validate.js";
import { evaluate } from "./runtime.js";

function q(value) {
  return JSON.stringify(value);
}

/**
 * 获取单个元素指定属性的值。
 */
export async function getElementAttribute(targetId, selector, name, options = {}) {
  selector = assertNonBlank(selector, "selector");
  name = assertNonBlank(name, "attribute name");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }

      if (!el.hasAttribute(${q(name)})) {
        throw new Error("attribute not found");
      }

      return el.getAttribute(${q(name)});
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取单个元素 attributes 对象
 */
export async function getElementAttributes(targetId, selector, options = {}) {
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }
      
      const out = {};
      for (const attr of el.attributes) {
        out[attr.name] = attr.value;
      }
      return out;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取单个元素 outerHTML。
 */
export async function getElementOuterHTML(targetId, selector, options = {}) {
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }

      return el.outerHTML;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取单个元素 innerHTML。
 */
export async function getElementInnerHTML(targetId, selector, options = {}) {
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }
      
      return el.innerHTML;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取单个元素 innerText。
 */
export async function getElementInnerText(targetId, selector, options = {}) {
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }

      return el.innerText;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取元素位置。
 * getBoundingClientRect 返回的坐标是相对于视口（viewport）的坐标，而不是相对于页面的坐标
 */
export async function getElementBox(targetId, selector, options = {}) {
  selector = assertNonBlank(selector, "selector");

  const expression = `
    (() => {
      const el = document.querySelector(${q(selector)});
      if (!el) {
        throw new Error("element not found");
      }

      const rect = el.getBoundingClientRect();

      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };
    })()
  `;

  return evaluate(targetId, expression, options);
}

export async function getElementCenter(targetId, selector, options = {}) {
  const {centerX, centerY} = await getElementBox(targetId, selector, options);

  return {
    x: centerX,
    y: centerY,
  };
}