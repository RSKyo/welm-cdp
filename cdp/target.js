import CDP from "chrome-remote-interface";
import { DEFAULT_HOST, DEFAULT_PORT } from "../infra/config.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";

function normalizeTarget(target) {
  return {
    id: target.id,
    type: target.type ?? "",
    title: target.title ?? "",
    url: target.url ?? "",
    attached: Boolean(target.attached),
  };
}

/**
 * 判断是否为 page 类型 target。
 */
export function isPageTarget(target) {
  return target?.type === "page";
}

/**
 * 判断是否为普通网页 target。
 */
export function isWebPageTarget(target) {
  return (
    isPageTarget(target) &&
    /^https?:\/\//.test(target?.url ?? "")
  );
}

/**
 * 获取所有 CDP targets。
 */
export async function listTargets(options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  const targets = await CDP.List({ host, port });

  return targets.map(normalizeTarget);
}

/**
 * 获取所有普通网页 targets。
 */
export async function listWebPageTargets(options = {}) {
  const targets = await listTargets(options);

  return targets.filter(isWebPageTarget);
}

/**
 * 创建 CDP target。
 */
export async function createTarget(url, options = {}) {
  url = assertNonBlank(url, "url");

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  const target = await CDP.New({
    host,
    port,
    url,
  });

  return normalizeTarget(target);
}

/**
 * 激活 CDP target。
 */
export async function activateTarget(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  await CDP.Activate({
    host,
    port,
    id: targetId,
  });

  return true;
}

/**
 * 关闭 CDP target。
 */
export async function closeTarget(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  await CDP.Close({
    host,
    port,
    id: targetId,
  });

  return true;
}

/**
 * 根据 id 获取 target。
 */
export async function getTarget(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  const targets = await listTargets({ host, port });

  const target = targets.find(
    target => target.id === targetId
  );

  if (!target) {
    throw createError(
      ERROR_CODE.NOT_FOUND,
      "target not found",
      { targetId }
    );
  }

  return target;
}

/**
 * 根据关键词查找 target。
 */
export async function findTarget(keyword, options = {}) {
  keyword = assertNonBlank(keyword, "keyword");

  const targets = await listTargets(options);

  const target = targets.find(target => (
    target.title.includes(keyword) ||
    target.url.includes(keyword)
  ));

  if (!target) {
    throw createError(
      ERROR_CODE.NOT_FOUND,
      "target not found",
      { keyword }
    );
  }

  return target;
}