import CDP from "chrome-remote-interface";
import { DEFAULT_HOST, DEFAULT_PORT } from "../infra/config.js";
import {
  ERROR_CODE,
  createError,
  isClientError,
} from "../infra/error.js";
import { assertNonBlank } from "../infra/validate.js";

/**
 * clientKey -> client
 */
const clientPromiseMap = new Map();

function getClientKey(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;

  return `${host}:${port}:${targetId}`;
}

// 不通过 CDP.List 判断 target 是否存在，保持 client.js 的纯粹性
function isTargetNotFoundError(error) {
  if (!error) return false;

  const code = error?.code || error?.error?.code;
  const message = error?.message || error?.error?.message || String(error);
  const lower = message.toLowerCase();

  if (code === -32000) {
    return (
      lower.includes("no target") ||
      lower.includes("no such target") ||
      lower.includes("target not found")
    );
  }

  return false;
}

async function createClient(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const clientKey = getClientKey(targetId, options);

  try {
    const client = await CDP({
      target: targetId,
      host,
      port,
    });

    client.on("disconnect", () => {
      clientPromiseMap.delete(clientKey);
    });

    return client;
  } catch (error) {
    if (isTargetNotFoundError(error)) {
      throw createError(
        ERROR_CODE.NOT_FOUND,
        "target not found: {targetId}",
        null,
        { targetId },
      );
    }

    if (isClientError(error)) {
      throw error;
    }

    throw createError(
      ERROR_CODE.INTERNAL,
      error?.message || "cdp client error",
      { cause: error },
    );
  }
}

/**
 * 获取 client（自动复用）
 */
export async function getClient(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const clientKey = getClientKey(targetId, options);
  let clientPromise = clientPromiseMap.get(clientKey);

  if (!clientPromise) {
    clientPromise = createClient(targetId, options).catch((error) => {
      clientPromiseMap.delete(clientKey);
      throw error;
    });

    clientPromiseMap.set(clientKey, clientPromise);
  }

  return await clientPromise;
}

/**
 * 关闭 client
 */
export async function closeClient(targetId, options = {}) {
  targetId = assertNonBlank(targetId, "targetId");

  const clientKey = getClientKey(targetId, options);
  const clientPromise = clientPromiseMap.get(clientKey);
  if (!clientPromise) return;

  try {
    const client = await clientPromise;
    await client.close();
  } finally {
    clientPromiseMap.delete(clientKey);
  }
}

/**
 * 清理所有 client
 */
export async function closeAllClients() {
  const promises = [];

  for (const p of clientPromiseMap.values()) {
    promises.push(
      p.then((client) => client.close()).catch(() => {}),
    );
  }

  await Promise.all(promises);
  clientPromiseMap.clear();
}