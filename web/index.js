/**
 * -----------------------------------------------------------------------------
 * web/index.js
 * -----------------------------------------------------------------------------
 * Public Web utilities entry point.
 *
 * Re-exports:
 * - local web server and Chrome page launcher utilities from launcher.js;
 * - Express request handler utilities from handler.js.
 *
 * Public API:
 * - isServerReady(options)
 * - startServer(absoluteServerFilePath, options)
 * - stopServer(options)
 * - reloadServer(absoluteServerFilePath, options)
 * - startServerAndPage(absoluteServerFilePath, url, options)
 * - withOptions(handler)
 *
 * Version: 0.1.0
 * Last modified: 2026-07-19
 */

export * from "./launcher.js";
export * from "./handler.js";