// -----------------------------------------------------------------------------
// cdp/screenshot
// -----------------------------------------------------------------------------
// Page screenshot utilities based on the CDP Page domain.
//
// Public API:
// - captureScreenshot(targetId, options)
//
// Features:
// - Capture an entire Chrome page by default.
// - Capture a specified viewport region.
// - Read full-page dimensions from page layout metrics.
// - Capture content beyond the current viewport.
// - Return screenshot data as a PNG Buffer.
//
// Design:
// - CDP clients are obtained and reused through client.js.
// - Full-page dimensions prefer CSS content metrics.
// - Screenshot clip coordinates use CSS pixels.
// - A default scale factor of 1 is applied when omitted.
// - This module only captures image data.
// - Saving files and copying images are handled by callers.
//
// Version: 0.1.0
// Last modified: 2026-07-15
// -----------------------------------------------------------------------------

import { getClient } from "./client.js";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Capture a PNG screenshot from a Chrome target.
 *
 * By default, captures the entire page.
 * If clip is provided, captures the specified viewport region.
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * Screenshot and CDP options.
 *
 * @param {Object} [options.clip]
 * Screenshot region relative to the viewport.
 *
 * @param {number} options.clip.x
 * Region X coordinate.
 *
 * @param {number} options.clip.y
 * Region Y coordinate.
 *
 * @param {number} options.clip.width
 * Region width.
 *
 * @param {number} options.clip.height
 * Region height.
 *
 * @param {number} [options.clip.scale=1]
 * Screenshot scale factor.
 *
 * @returns {Promise<Buffer>}
 * PNG image data.
 */
export async function captureScreenshot(targetId, options = {}) {
  const { Page } = await getClient(targetId, options);

  const clip = options.clip
    ? {
        ...options.clip,
        scale: options.clip.scale ?? 1,
      }
    : await getFullPageClip(Page);

  const { data } = await Page.captureScreenshot({
    format: "png",
    clip,
    fromSurface: true,
    captureBeyondViewport: true,
    optimizeForSpeed: true,
  });

  if (typeof data !== "string" || data === "") {
    throw new Error("missing screenshot data");
  }

  return Buffer.from(data, "base64");
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

/**
 * Get the full-page screenshot clip region.
 */
async function getFullPageClip(Page) {
  const metrics = await Page.getLayoutMetrics();

  const size =
    metrics.cssContentSize ??
    metrics.contentSize;

  if (!size) {
    throw new Error("failed to get page content size");
  }

  return {
    x: 0,
    y: 0,
    width: Math.ceil(size.width),
    height: Math.ceil(size.height),
    scale: 1,
  };
}