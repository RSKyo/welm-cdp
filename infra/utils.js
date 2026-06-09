export function normalizeUrl(url) {
  try {
    return new URL(url).href;
  } catch {
    return String(url || '').trim();
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 将任意值转为布尔值。
 * 支持：
 *   true, "true", "1", 1  → true
 *   false, "false", "0", 0 → false
 * @param {*} value 输入值
 * @param {boolean} defaultValue 默认值
 * @returns {boolean}
 */
export function toBool(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;

  if (typeof value === "boolean") return value;

  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
    return defaultValue;
  }

  return defaultValue;
}

/**
 * 扁平键值数组转对象。
 *
 * ["id", "1", "name", "tom"]
 * =>
 * { id: "1", name: "tom" }
 */
export function pairArrayToObject(array = []) {
  const object = {};

  for (let i = 0; i < array.length; i += 2) {
    const key = array[i];
    const value = array[i + 1];

    object[key] = value;
  }

  return object;
}

/**
 * 对象转扁平键值数组。
 *
 * { id: "1", name: "tom" }
 * =>
 * ["id", "1", "name", "tom"]
 */
export function objectToPairArray(object = {}) {
  const array = [];

  for (const [key, value] of Object.entries(object)) {
    array.push(key, value);
  }

  return array;
}
