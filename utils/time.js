/**
 * Parse a media time value into seconds.
 *
 * Accepts a non-negative number or a time string in `HH:mm:ss.SSS` format.
 * Hours may contain more than two digits. Milliseconds are optional and may
 * contain one to three digits.
 *
 * `null`, `undefined`, and an empty string are returned as `null`.
 *
 * @param {number|string|null|undefined} value
 * Media time value to parse.
 *
 * @returns {number|null}
 * Parsed time in seconds, or `null` when no value is provided.
 *
 * @throws {Error}
 * Thrown when the value is invalid or the time string has an invalid format.
 *
 * @example
 * parseTime("01:02:03.450"); // 3723.45
 * parseTime("120:00:00");    // 432000
 * parseTime(12.5);            // 12.5
 * parseTime(null);            // null
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
  const match = text.match(/^(\d+):([0-5]\d):([0-5]\d)(?:\.(\d{1,3}))?$/);

  if (!match) {
    throw new Error(`invalid time format: ${value}`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const milliseconds = Number((match[4] ?? "0").padEnd(3, "0"));

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Format seconds as a media time string.
 *
 * The result uses `HH:mm:ss.SSS` format. Hours may contain more than two
 * digits, and the value is rounded to the nearest millisecond.
 *
 * `null` and `undefined` are returned as `null`.
 *
 * @param {number|null|undefined} seconds
 * Non-negative time value in seconds.
 *
 * @returns {string|null}
 * Formatted media time, or `null` when no value is provided.
 *
 * @throws {Error}
 * Thrown when the value is not a finite, non-negative number.
 *
 * @example
 * formatTime(3723.45); // "01:02:03.450"
 * formatTime(432000);  // "120:00:00.000"
 * formatTime(null);    // null
 */
export function formatTime(seconds) {
  if (seconds == null) {
    return null;
  }

  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    throw new Error(`invalid time value: ${seconds}`);
  }

  const totalMilliseconds = Math.round(seconds * 1000);

  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const second = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minute = totalMinutes % 60;
  const hour = Math.floor(totalMinutes / 60);

  const hourText = String(hour).padStart(2, "0");
  const minuteText = String(minute).padStart(2, "0");
  const secondText = String(second).padStart(2, "0");
  const millisecondText = String(milliseconds).padStart(3, "0");

  return `${hourText}:${minuteText}:${secondText}.${millisecondText}`;
}
