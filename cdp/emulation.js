import { getClient } from "./client.js";

/**
 * 获取 Emulation 域客户端。
 */
async function getEmulation(targetId, options = {}) {

  const { Emulation } = await getClient(targetId, options);

  return Emulation;
}

/**
 * 设置设备指标。
 */
async function setDeviceMetrics(targetId, metrics, options = {}) {
  const Emulation = await getEmulation(targetId, options);

  await Emulation.setDeviceMetricsOverride(metrics);

  return true;
}

/**
 * 设置视口。
 */
export async function setViewport(
  targetId,
  width,
  height,
  options = {},
) {
  width = Number(width);
  height = Number(height);

  if (!Number.isFinite(width) || width <= 0) {
    throw new Error("invalid width");
  }

  if (!Number.isFinite(height) || height <= 0) {
    throw new Error("invalid height");
  }

  return setDeviceMetrics(
    targetId,
    {
      width,
      height,
      deviceScaleFactor: options.deviceScaleFactor ?? 1,
      mobile: Boolean(options.mobile),
    },
    options,
  );
}

/**
 * 设置桌面视口。
 */
export async function setDesktopViewport(
  targetId,
  width = 1440,
  height = 900,
  options = {},
) {
  return setViewport(targetId, width, height, {
    ...options,
    mobile: false,
    deviceScaleFactor: options.deviceScaleFactor ?? 1,
  });
}

/**
 * 设置移动端视口。
 */
export async function setMobileViewport(
  targetId,
  width = 390,
  height = 844,
  options = {},
) {
  const orientation =
    height >= width
      ? { type: "portraitPrimary", angle: 0 }
      : { type: "landscapePrimary", angle: 90 };

  return setDeviceMetrics(
    targetId,
    {
      width: Number(width),
      height: Number(height),
      mobile: true,
      deviceScaleFactor: options.deviceScaleFactor ?? 3,
      screenWidth: options.screenWidth ?? Number(width),
      screenHeight: options.screenHeight ?? Number(height),
      screenOrientation: options.screenOrientation ?? orientation,
    },
    options,
  );
}

/**
 * 设置 User-Agent。
 */
export async function setUserAgent(
  targetId,
  userAgent,
  options = {},
) {

  const Emulation = await getEmulation(targetId, options);

  const params = {
    userAgent,
  };

  if (options.acceptLanguage != null) {
    params.acceptLanguage = options.acceptLanguage;
  }

  if (options.platform != null) {
    params.platform = options.platform;
  }

  if (options.userAgentMetadata != null) {
    params.userAgentMetadata = options.userAgentMetadata;
  }

  await Emulation.setUserAgentOverride(params);

  return true;
}

/**
 * 设置触摸模拟。
 */
async function setTouchEmulation(
  targetId,
  enabled = true,
  maxTouchPoints = 1,
  options = {},
) {
  const Emulation = await getEmulation(targetId, options);

  await Emulation.setTouchEmulationEnabled({
    enabled: Boolean(enabled),
    maxTouchPoints,
  });

  return true;
}

/**
 * 一键切到桌面端环境。
 */
export async function emulateDesktop(targetId, options = {}) {
  const {
    width = 1440,
    height = 900,
    deviceScaleFactor = 1,
    userAgent,
  } = options;

  await setDesktopViewport(targetId, width, height, {
    ...options,
    deviceScaleFactor,
  });

  await setTouchEmulation(targetId, false, 1, options);

  if (userAgent) {
    await setUserAgent(targetId, userAgent, {
      ...options,
      platform: options.platform ?? "MacIntel",
    });
  }

  return true;
}

/**
 * 一键切到移动端环境。
 */
export async function emulateMobile(targetId, options = {}) {
  const {
    width = 390,
    height = 844,
    deviceScaleFactor = 3,
    maxTouchPoints = 5,
    userAgent,
  } = options;

  await setMobileViewport(targetId, width, height, {
    ...options,
    deviceScaleFactor,
  });

  await setTouchEmulation(targetId, true, maxTouchPoints, options);

  if (userAgent) {
    await setUserAgent(targetId, userAgent, {
      ...options,
      platform: options.platform ?? "iPhone",
    });
  }

  return true;
}