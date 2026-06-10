import CDP from "chrome-remote-interface";
import { DEFAULT_HOST, DEFAULT_PORT } from "../infra/config.js";
import { ERROR_CODE, createError } from "../infra/error.js";
import { isHttpUrl, assertNonBlank } from "../infra/validate.js";

export const TARGET_TYPE = {
  PAGE: "page",
  WEBPAGE: "webpage",
};

function normalizeTarget(target) {
  return {
    id: target.id,
    type: target.type ?? "",
    title: target.title ?? "",
    url: target.url ?? "",
    attached: Boolean(target.attached),
  };
}

export async function listTargets(options = {}) {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  let targets;
  targets = await CDP.List({ host, port });

  switch (options.type) {
    case TARGET_TYPE.PAGE:
      targets = targets.filter((target) => target.type === TARGET_TYPE.PAGE);
      break;

    case TARGET_TYPE.WEBPAGE:
      targets = targets.filter(
        (target) => target.type === TARGET_TYPE.PAGE && isHttpUrl(target.url ?? ""),
      );
      break;

  }

  return targets.map(normalizeTarget);
}

export async function getTarget(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const targets = await listTargets(options);
  const target = targets.find((target) => target.id === targetId);

  if (!target) {
    throw createError(ERROR_CODE.NOT_FOUND, "target not found", { targetId });
  }

  return target;
}

export async function findTarget(keyword, options = {}) {
  keyword = assertNonBlank(keyword, "keyword");

  const search = keyword.toLowerCase();
  const targets = await listTargets(options);

  return (
    targets.find(
      (target) =>
        target.title.toLowerCase().includes(search) ||
        target.url.toLowerCase().includes(search),
    ) ?? null
  );
}

export async function activateTarget(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  await CDP.Activate({
    host,
    port,
    id: targetId,
  });
}

export async function openTarget(url, options = {}) {
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

export async function closeTarget(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  await CDP.Close({
    host,
    port,
    id: targetId,
  });
}
