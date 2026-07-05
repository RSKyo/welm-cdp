// -----------------------------------------------------------------------------
// lifecycle.js
// -----------------------------------------------------------------------------
// CDP lifecycle management.
//
// Exports:
//   - closeCdpClients
// -----------------------------------------------------------------------------

import { closeAllClients } from "./client.js";

export async function closeCdpClients() {
  await closeAllClients();
}