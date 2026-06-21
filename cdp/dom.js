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

/**
 * 判断元素是否存在。
 */
export async function hasElement(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      return el !== null;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取匹配元素数量。
 */
export async function getElementsCount(
  targetId,
  selector,
  options = {},
) {
  const expression = `
    (() => {
      return document.querySelectorAll(${q(selector)}).length;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取单个元素指定属性的值。
 */
export async function getElementAttribute(
  targetId,
  selector,
  name,
  options = {},
) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

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
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      
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
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

      return el.outerHTML;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取单个元素 innerHTML。
 */
export async function getElementInnerHTML(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};
      
      return el.innerHTML;
    })()
  `;

  return evaluate(targetId, expression, options);
}

/**
 * 获取单个元素 innerText。
 */
export async function getElementInnerText(targetId, selector, options = {}) {
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

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
  const expression = `
    (() => {
      const el = ${buildElementResolver(selector, options)};

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
  const { centerX, centerY } = await getElementBox(targetId, selector, options);

  return {
    x: centerX,
    y: centerY,
  };
}


export async function readClipboard(targetId, options = {}) {
  const expression = `
    (async () => {
      return await navigator.clipboard.readText();
    })()
  `;

  return await evaluate(targetId, expression, options);
}

export async function writeClipboard(targetId, text, options = {}) {
  const expression = `
    (async () => {
      await navigator.clipboard.writeText(
        ${JSON.stringify(text)}
      );

      return true;
    })()
  `;

  return await evaluate(targetId, expression, options);
}