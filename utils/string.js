/**
 * Replace date tokens in a string template.
 *
 * Supported tokens:
 * - {yyyy}  Four-digit year
 * - {yy}    Two-digit year
 * - {M}     Month
 * - {MM}    Two-digit month
 * - {d}     Day of month
 * - {dd}    Two-digit day of month
 * - {H}     Hour
 * - {HH}    Two-digit hour
 * - {m}     Minute
 * - {mm}    Two-digit minute
 * - {s}     Second
 * - {ss}    Two-digit second
 * - {SSS}   Three-digit millisecond
 *
 * Unknown tokens are preserved.
 *
 * @param {string} template
 * String containing date tokens.
 *
 * @param {Date} [date]
 * Date used to resolve tokens.
 *
 * @param {Object} [options]
 * Formatting options.
 *
 * @param {boolean} [options.utc=false]
 * Use UTC date components.
 *
 * @returns {string}
 * Formatted string.
 */
export function formatDateTemplate(template, date = new Date(), options = {}) {
  if (typeof template !== "string") {
    throw new Error("template must be a string");
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("date must be a valid Date");
  }

  const utc = options.utc ?? false;

  if (typeof utc !== "boolean") {
    throw new Error("utc must be a boolean");
  }

  const year = utc ? date.getUTCFullYear() : date.getFullYear();

  const month = (utc ? date.getUTCMonth() : date.getMonth()) + 1;

  const day = utc ? date.getUTCDate() : date.getDate();

  const hour = utc ? date.getUTCHours() : date.getHours();

  const minute = utc ? date.getUTCMinutes() : date.getMinutes();

  const second = utc ? date.getUTCSeconds() : date.getSeconds();

  const millisecond = utc ? date.getUTCMilliseconds() : date.getMilliseconds();

  const pad2 = (value) => String(value).padStart(2, "0");

  const pad3 = (value) => String(value).padStart(3, "0");

  const tokens = {
    yyyy: String(year),
    yy: String(year).slice(-2).padStart(2, "0"),

    M: String(month),
    MM: pad2(month),

    d: String(day),
    dd: pad2(day),

    H: String(hour),
    HH: pad2(hour),

    m: String(minute),
    mm: pad2(minute),

    s: String(second),
    ss: pad2(second),

    SSS: pad3(millisecond),
  };

  return template.replace(/\{([a-zA-Z]+)\}/g, (placeholder, token) => {
    if (!Object.hasOwn(tokens, token)) {
      return placeholder;
    }

    return tokens[token];
  });
}