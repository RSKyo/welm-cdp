// -----------------------------------------------------------------------------
// cdp/client
// -----------------------------------------------------------------------------
// Reusable Chrome DevTools Protocol client management.
//
// Public API:
// - getClient(targetId, options)
// - closeClients()
//
// Features:
// - Create CDP clients for Chrome targets.
// - Cache and reuse clients for the same target.
// - Prevent duplicate connections during concurrent client creation.
// - Remove failed client creation promises from the cache.
// - Remove disconnected clients from the cache automatically.
// - Close all cached clients when an operation is complete.
//
// Design:
// - Clients are identified by CDP host, port, and target ID.
// - Client creation promises are cached before connections are established.
// - Concurrent requests for the same target share one creation promise.
// - Disconnected clients are automatically removed from the cache.
// - Closing clients only closes CDP connections.
// - Closing clients does not close Chrome or its pages.
// - Individual client creation and close errors are ignored during cleanup.
//
// Version: 0.1.0
// Last modified: 2026-07-14
// -----------------------------------------------------------------------------

import CDP from "chrome-remote-interface";

const defaultHost = "127.0.0.1";
const defaultPort = 9222;

// Map<clientKey, Promise<CDP.Client>>
const clientPromiseMap = new Map();

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Get a reusable CDP client for a Chrome target.
 *
 * A new client is created on the first call.
 * Later calls with the same host, port, and target ID
 * return the cached client.
 *
 * Concurrent calls for the same target share
 * the same client creation promise.
 *
 * @example
 * const client = await getClient(targetId);
 *
 * const result = await client.Runtime.evaluate({
 *   expression: "document.title",
 *   returnByValue: true,
 * });
 *
 * @param {string} targetId
 * Chrome target ID.
 *
 * @param {Object} [options]
 * CDP connection options.
 *
 * @param {string} [options.cdpHost="127.0.0.1"]
 * Chrome CDP service host.
 *
 * @param {number} [options.cdpPort=9222]
 * Chrome CDP service port.
 *
 * @returns {Promise<Object>}
 * Reusable CDP client connected to the target.
 */
export async function getClient(targetId, options = {}) {
  const clientKey = getClientKey(targetId, options);

  let clientPromise = clientPromiseMap.get(clientKey);

  if (!clientPromise) {
    clientPromise = createClient(targetId, options);

    clientPromise.catch(() => {
      clientPromiseMap.delete(clientKey);
    });

    clientPromiseMap.set(clientKey, clientPromise);
  }

  return await clientPromise;
}

/**
 * Close all cached CDP clients.
 *
 * The client cache is cleared before the connections
 * are closed. Individual client creation and close
 * errors are ignored so that cleanup can continue.
 *
 * Closing clients only closes CDP connections.
 * It does not close Chrome or its pages.
 *
 * @example
 * try {
 *   await main();
 * } finally {
 *   await closeClients();
 * }
 *
 * @returns {Promise<void>}
 * Resolves after all cached clients have been processed.
 */
export async function closeClients() {
  const clientPromises = [...clientPromiseMap.values()];

  clientPromiseMap.clear();

  await Promise.all(
    clientPromises.map((clientPromise) =>
      clientPromise.then((client) => client.close()).catch(() => {}),
    ),
  );
}

// -----------------------------------------------------------------------------
// Private Helpers
// -----------------------------------------------------------------------------

function getCdpOptions(options = {}) {
  return {
    host: options.cdpHost ?? defaultHost,
    port: options.cdpPort ?? defaultPort,
  };
}

function getClientKey(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  return `${host}:${port}:${targetId}`;
}

async function createClient(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  const clientKey = getClientKey(targetId, options);

  const client = await CDP({
    host,
    port,
    target: targetId,
  });

  client.on("disconnect", () => {
    clientPromiseMap.delete(clientKey);
  });

  return client;
}
