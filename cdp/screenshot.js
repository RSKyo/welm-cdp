import path from "path";
import fs from "fs/promises";

import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";
import { getClient } from "./client.js";
import { SCREENSHOT_DIR } from "../infra/config.js";

/**
 * 获取布局指标
 */
async function getLayoutMetrics(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const { Page } = await getClient(targetId, options);

  const res = await Page.getLayoutMetrics();

  return {
    layout: {
      viewport: res.layoutViewport ?? null,
      visualViewport: res.visualViewport ?? null,
      contentSize: res.contentSize ?? null,
    },

    css: {
      layoutViewport: res.cssLayoutViewport ?? null,
      visualViewport: res.cssVisualViewport ?? null,
      contentSize: res.cssContentSize ?? null,
    },
  };
}

/**
 * 截图（viewport）
 * 
 * @returns base64 encoded image string
 */
export async function captureScreenshot(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const { Page } = await getClient(targetId, options);

  const {
    format = "png",
    quality,
    clip,
  } = options;

  const res = await Page.captureScreenshot({
    format,
    quality,
    clip,

    // 内部固定策略
    fromSurface: true, 
    captureBeyondViewport: true,
    optimizeForSpeed: true,
  });

  return res.data ?? "";
}

/**
 * 整页截图
 */
export async function captureFullPageScreenshot(targetId, options = {}) {
  const metrics = await getLayoutMetrics(targetId, options);

  const size = metrics.css.contentSize ?? metrics.layout.contentSize;

  if (!size) {
    throw createError(ERROR_CODE.INTERNAL, "failed to get page content size");
  }

  return captureScreenshot(targetId, {
    ...options,
    clip: {
      x: 0,
      y: 0,
      width: Math.ceil(size.width),
      height: Math.ceil(size.height),
      scale: 1,
    },
  });
}

/**
 * 截图 + 落盘（能力增强）
 */
export async function saveScreenshot(targetId, options = {}) {
  const {
    dir = SCREENSHOT_DIR,
    fullPage = false,
    format = "png",
  } = options;

  const base64 = fullPage
    ? await captureFullPageScreenshot(targetId, options)
    : await captureScreenshot(targetId, options);

  const finalDir = path.resolve(dir);

  await fs.mkdir(finalDir, { recursive: true });

  const ext = String(format)
    .trim()
    .replace(".", "")
    .toLowerCase();

  const fileName = `screenshot-${Date.now()}.${ext}`;

  const filePath = path.join(finalDir, fileName);

  await fs.writeFile(
    filePath,
    Buffer.from(base64, "base64")
  );

  return filePath;
}
