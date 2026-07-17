import { assertNonBlankString } from "../infra/assert.js";
import { getClient, closeClients } from "../cdp/client.js";
import { getCdpOptions } from "../cdp/target.js";

const CDP_OPTIONS = "--host --port";

/**
 * CDP client CLI command registry.
 *
 * client get <targetId>
 * client close
 */
export const CLIENT_COMMANDS = {
  "get": {
    handler: cmd_getClient,
    usage: "client get <targetId> [options]",
    description: "Connect to Chrome target and cache CDP client",
    options: CDP_OPTIONS,
  },

  "close": {
    handler: cmd_closeClients,
    usage: "client close",
    description: "Close cached CDP clients in the current process",
  },
};

// -----------------------------------------------------------------------------
// CLI Commands
// -----------------------------------------------------------------------------

/**
 * Connect to a Chrome target and cache its CDP client.
 */
export async function cmd_getClient({ argv, options } = {}) {
  const [targetId] = argv;
  assertNonBlankString(targetId, "targetId");

  await getClient(targetId, options);

  const { host, port } = getCdpOptions(options);
  const info = {
    targetId,
    host,
    port,
    connected: true,
  };

  options.reporter?.info?.(
    `CDP client connected: ${targetId} (${host}:${port})`,
    options,
  );

  return info;
}

/**
 * Close cached CDP clients in the current process.
 */
export async function cmd_closeClients({ options } = {}) {
  await closeClients();

  options.reporter?.info?.("Cached CDP clients closed", options);

  return true;
}
