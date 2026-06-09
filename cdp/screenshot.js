import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";
import { getClient } from "./client.js";

/**
 * 获取 Page 域客户端。
 */
async function getPage(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const { Page } = await getClient(targetId, options);

  return Page;
}

/**
 * 获取布局指标。
 */
async function getLayoutMetrics(targetId, options = {}) {
  const Page = await getPage(targetId, options);

  const res = await Page.getLayoutMetrics();

  return {
    layoutViewport: res.layoutViewport ?? null,
    visualViewport: res.visualViewport ?? null,
    contentSize: res.contentSize ?? null,
    cssLayoutViewport: res.cssLayoutViewport ?? null,
    cssVisualViewport: res.cssVisualViewport ?? null,
    cssContentSize: res.cssContentSize ?? null,
  };
}

/**
 * 截图，返回 base64。
 */
export async function captureScreenshot(targetId, options = {}) {
  const Page = await getPage(targetId, options);

  const {
    format = "png",
    quality,
    clip,
    fromSurface = true,
    captureBeyondViewport = false,
    optimizeForSpeed,
  } = options;

  const params = {
    format,
    fromSurface: Boolean(fromSurface),
    captureBeyondViewport: Boolean(captureBeyondViewport),
  };

  if (quality != null) {
    params.quality = quality;
  }

  if (clip) {
    params.clip = clip;
  }

  if (optimizeForSpeed != null) {
    params.optimizeForSpeed = Boolean(optimizeForSpeed);
  }

  const res = await Page.captureScreenshot(params);

  return res.data ?? "";
}

/**
 * 截取整页，返回 base64。
 */
export async function captureFullPageScreenshot(targetId, options = {}) {
  const metrics = await getLayoutMetrics(targetId, options);

  const size = metrics.cssContentSize ?? metrics.contentSize;

  if (!size) {
    throw createError(
      ERROR_CODE.INTERNAL,
      "failed to get page content size"
    );
  }

  return captureScreenshot(targetId, {
    ...options,
    captureBeyondViewport: true,
    clip: {
      x: 0,
      y: 0,
      width: Math.ceil(size.width),
      height: Math.ceil(size.height),
      scale: 1,
    },
  });
}