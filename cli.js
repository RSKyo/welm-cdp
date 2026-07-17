import { run } from "./cmd/runner.js";
import { COMMAND_GROUPS } from "./cmd/registry.js";
import { closeClients } from "./cdp/client.js";

run(COMMAND_GROUPS, {
  cleanup: closeClients,
});
