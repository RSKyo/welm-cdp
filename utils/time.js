/**
 * Parse a time value into seconds.
 *
 * Accepts:
 * - A non-negative finite number, returned as-is.
 * - A time string in one of these formats:
 *   - SS
 *   - SS.mmm
 *   - MM:SS
 *   - MM:SS.mmm
 *   - HH:MM:SS
 *   - HH:MM:SS.mmm
 *
 * Minutes and seconds must be within 00-59 when they are not
 * the highest-order unit.
 *
 * Milliseconds may contain 1 to 3 digits and are padded to
 * millisecond precision.
 *
 * Returns null when the input is null, undefined, or an empty string.
 *
 * @param {number|string|null|undefined} value
 * Time value to parse.
 *
 * @returns {number|null}
 * Parsed time in seconds, or null when no time value is provided.
 *
 * @throws {Error}
 * Throws if the value type, numeric value, or time format is invalid.
 */
export function parseTime(value) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`invalid time value: ${value}`);
    }

    return value;
  }

  if (typeof value !== "string") {
    throw new Error(`invalid time value: ${value}`);
  }

  const text = value.trim();

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let milliseconds = 0;

  let match = text.match(/^(\d+):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?$/);

  if (match) {
    hours = Number(match[1]);
    minutes = Number(match[2]);
    seconds = Number(match[3]);
    milliseconds = Number((match[4] ?? "0").padEnd(3, "0"));

    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }

  match = text.match(/^(\d+):([0-5]\d)(?:\.(\d{1,3}))?$/);

  if (match) {
    minutes = Number(match[1]);
    seconds = Number(match[2]);
    milliseconds = Number((match[3] ?? "0").padEnd(3, "0"));

    return minutes * 60 + seconds + milliseconds / 1000;
  }

  match = text.match(/^(\d+)(?:\.(\d{1,3}))?$/);

  if (match) {
    seconds = Number(match[1]);
    milliseconds = Number((match[2] ?? "0").padEnd(3, "0"));

    return seconds + milliseconds / 1000;
  }

  throw new Error(`invalid time format: ${value}`);
}

/**
 * Format a non-negative time value in seconds.
 *
 * By default, returns the shortest meaningful time representation:
 * - 2.805      -> "2.805"
 * - 62.805     -> "1:02.805"
 * - 3662.805   -> "1:01:02.805"
 *
 * When `full` is true, always returns the full
 * HH:MM:SS.mmm representation:
 * - 2.805      -> "00:00:02.805"
 * - 62.805     -> "00:01:02.805"
 * - 3662.805   -> "01:01:02.805"
 *
 * The value is rounded to the nearest millisecond before formatting.
 *
 * Returns null when `seconds` is null or undefined.
 *
 * @param {number|null|undefined} seconds
 * Time value in seconds.
 *
 * @param {boolean} [full=false]
 * Whether to use the full HH:MM:SS.mmm format.
 *
 * @returns {string|null}
 * Formatted time string, or null when no time value is provided.
 *
 * @throws {Error}
 * Throws if `seconds` is not a non-negative finite number.
 */
export function formatTime(seconds, full = false) {
  if (seconds == null) {
    return null;
  }

  if (
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    throw new Error(`invalid time value: ${seconds}`);
  }

  const totalMilliseconds = Math.round(seconds * 1000);

  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const second = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minute = totalMinutes % 60;
  const hour = Math.floor(totalMinutes / 60);

  const millisecondText = String(milliseconds).padStart(3, "0");

  if (full) {
    const hourText = String(hour).padStart(2, "0");
    const minuteText = String(minute).padStart(2, "0");
    const secondText = String(second).padStart(2, "0");

    return `${hourText}:${minuteText}:${secondText}.${millisecondText}`;
  }

  const fractionText =
    milliseconds > 0
      ? `.${millisecondText}`
      : "";

  if (hour > 0) {
    return (
      `${hour}:` +
      `${String(minute).padStart(2, "0")}:` +
      `${String(second).padStart(2, "0")}` +
      fractionText
    );
  }

  if (minute > 0) {
    return (
      `${minute}:` +
      `${String(second).padStart(2, "0")}` +
      fractionText
    );
  }

  return `${second}${fractionText}`;
}