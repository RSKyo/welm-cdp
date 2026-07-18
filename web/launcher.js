/**
 * -----------------------------------------------------------------------------
 * web/launcher.js
 * -----------------------------------------------------------------------------
 * Local web server process and browser page launcher.
 *
 * Public API:
 * - isServerReady(options)
 * - startServer(absoluteServerFilePath, options)
 * - stopServer(options)
 * - reloadServer(absoluteServerFilePath, options)
 * - startServerAndPage(absoluteServerFilePath, url, options)
 *
 * Provides reusable utilities for:
 * - checking whether a local HTTP server is ready;
 * - starting a detached Node.js server process;
 * - stopping processes listening on a configured port;
 * - restarting a server and reloading matching Chrome pages;
 * - ensuring Chrome is running and opening a requested page.
 *
 * The server host and port are passed to the child process through configurable
 * environment variable fields. The server must expose a /__ready endpoint that
 * returns a successful HTTP status when it is ready.
 *
 * Stopping a server currently relies on the lsof command and terminates all
 * processes reported as using the configured port.
 *
 * Version: 0.1.0
 * Last modified: 2026-07-19
 */

import nodePath from "node:path";
import fs from "node:fs";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";

import { log } from "../common/log.js";
import {
  isChromeReady,
  ensureChrome,
  ensureChromePage,
  findChromePages,
  activateChromePage,
  reloadChromePage,
} from "../cdp/chrome.js";

const defaultHost = "localhost";
const defaultPort = 3000;

const defaultHostField = "serverHost";
const defaultPortField = "serverPort";

const defaultTimeout = 20000;
const defaultInterval = 200;
const defaultRequestTimeout = 500;

const execFileAsync = promisify(execFile);

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Check whether the configured web server is ready.
 *
 * Sends a request to the server's /__ready endpoint and returns true only when
 * the request completes within the request timeout and receives a successful
 * HTTP response.
 *
 * Network errors, connection failures, request timeouts, and unsuccessful HTTP
 * responses result in false.
 *
 * @param {Object} [options]
 * Server and runtime options.
 *
 * @param {string} [options.serverHost="localhost"]
 * Hostname used to build the server readiness URL.
 *
 * @param {number} [options.serverPort=3000]
 * Port used to build the server readiness URL.
 *
 * @returns {Promise<boolean>}
 * Whether the server is ready.
 */
export async function isServerReady(options = {}) {
  const { testUrl } = getServerOptions(options);

  try {
    const res = await fetch(testUrl, {
      signal: AbortSignal.timeout(defaultRequestTimeout),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ensure that a local web server process is running and ready.
 *
 * If the configured server is already ready, no new process is created.
 * Otherwise, the provided Node.js server file is started as a detached child
 * process. The configured host and port are passed through environment
 * variables, and the function waits until /__ready responds successfully.
 *
 * @param {string} absoluteServerFilePath
 * Absolute path to the executable Node.js server entry file.
 *
 * @param {Object} [options]
 * Server, process, logging, and readiness options.
 *
 * @param {string} [options.serverHost="localhost"]
 * Host passed to the server process and used for readiness checks.
 *
 * @param {number} [options.serverPort=3000]
 * Port passed to the server process and used for readiness checks.
 *
 * @param {string} [options.serverHostField="serverHost"]
 * Environment variable field used to pass the host to the child process.
 *
 * @param {string} [options.serverPortField="serverPort"]
 * Environment variable field used to pass the port to the child process.
 *
 * @param {number} [options.serverReadyTimeout=20000]
 * Maximum time in milliseconds to wait for the server to become ready.
 *
 * @param {number} [options.serverReadyInterval=200]
 * Delay in milliseconds between readiness checks.
 *
 * @param {boolean} [options.verbose=false]
 * Whether the child process inherits the current process standard streams.
 *
 * @returns {Promise<boolean>}
 * Resolves to true when the server is ready.
 *
 * @throws {Error}
 * If the server file is invalid or the server does not become ready in time.
 */
export async function startServer(absoluteServerFilePath, options = {}) {
  assertExistingFile(absoluteServerFilePath, "absoluteServerFilePath");

  const { host, port } = getServerOptions(options);

  log.progress("Ensuring web server is running...", options);

  if (await isServerReady(options)) {
    log.progressDone("Web server is already running.", options);
    return true;
  }

  log.progress("Starting web server...", options);

  const stdio = options.verbose ? "inherit" : "ignore";
  const serverHostField = options.serverHostField ?? defaultHostField;
  const serverPortField = options.serverPortField ?? defaultPortField;

  const child = spawn(process.execPath, [absoluteServerFilePath], {
    cwd: nodePath.dirname(absoluteServerFilePath),
    env: {
      ...process.env,
      [serverHostField]: String(host),
      [serverPortField]: String(port),
    },
    detached: true,
    stdio,
  });

  log.progressDone(`Web server process started (PID: ${child.pid}).`, options);
  child.unref();

  await waitServerReady(options);
  log.progressDone("Web server is ready.", options);

  return true;
}

/**
 * Stop processes listening on the configured server port.
 *
 * Uses lsof to find process IDs associated with the port and sends SIGTERM to
 * each matching process. If no matching process is found, an empty array is
 * returned.
 *
 * This function stops every process reported as using the configured port; it
 * does not verify that the process was originally started by startServer().
 *
 * @param {Object} [options]
 * Server and logging options.
 *
 * @param {string} [options.serverHost="localhost"]
 * Server host. Included for consistency with other server functions.
 *
 * @param {number} [options.serverPort=3000]
 * Port whose listening processes should be stopped.
 *
 * @returns {Promise<string[]>}
 * Process IDs that received SIGTERM.
 */
export async function stopServer(options = {}) {
  const { port } = getServerOptions(options);

  let stdout = "";

  log.progress(`Stopping web server on port ${port}...`, options);

  try {
    const result = await execFileAsync("lsof", ["-ti", `:${port}`]);
    stdout = result.stdout;
  } catch {
    log.progressDone(`Web server on port ${port} is not running.`, options);
    return [];
  }

  const pids = stdout
    .split("\n")
    .map((pid) => pid.trim())
    .filter(Boolean);

  for (const pid of pids) {
    log.progress(`Stopping web server process (PID: ${pid})...`, options);
    process.kill(Number(pid), "SIGTERM");
  }

  log.progressDone(`Web server on port ${port} stopped.`, options);
  return pids;
}

/**
 * Restart a local web server and reload matching Chrome pages.
 *
 * Stops processes listening on the configured port, starts the specified server
 * entry file, and waits until the server is ready. If Chrome is already running,
 * pages whose URL matches the configured server port are reloaded.
 *
 * @param {string} absoluteServerFilePath
 * Absolute path to the executable Node.js server entry file.
 *
 * @param {Object} [options]
 * Server, Chrome, process, logging, and readiness options.
 *
 * @returns {Promise<void>}
 * Resolves after the server has restarted and matching pages have been reloaded.
 */
export async function reloadServer(absoluteServerFilePath, options = {}) {
  const { port } = getServerOptions(options);

  await stopServer(options);
  await startServer(absoluteServerFilePath, options);

  if (await isChromeReady(options)) {
    const targets = await findChromePages(`:${port}/`, options);

    for (const { targetId } of targets) {
      await reloadChromePage(targetId, options);
    }
  }
}

/**
 * Ensure that a local web server and its Chrome page are available.
 *
 * Starts the server when necessary, ensures Chrome is running, opens or reuses
 * the requested page, and activates the resulting Chrome target.
 *
 * @param {string} absoluteServerFilePath
 * Absolute path to the executable Node.js server entry file.
 *
 * @param {string} url
 * URL of the page to open or reuse.
 *
 * @param {Object} [options]
 * Server, Chrome, process, logging, and readiness options.
 *
 * @returns {Promise<Object>}
 * Opened page information.
 *
 * @returns {string} return.url
 * Requested page URL.
 *
 * @returns {string} return.targetId
 * Chrome DevTools Protocol target ID of the opened or reused page.
 */
export async function startServerAndPage(
  absoluteServerFilePath,
  url,
  options = {},
) {
  // Ensure the web server is running.
  await startServer(absoluteServerFilePath, options);

  // Ensure Chrome is running, then open and activate the requested page.
  await ensureChrome(options);
  const { targetId } = await ensureChromePage(url, options);
  await activateChromePage(targetId, options);

  return {
    url,
    targetId,
  };
}

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

function assertNonBlankString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
}

function assertPort(port) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("port must be an integer between 1 and 65535");
  }

  return port;
}

function assertExistingFile(filePath, fieldName = "filePath") {
  if (
    typeof filePath !== "string" ||
    filePath.length === 0 ||
    filePath.includes("\0")
  ) {
    throw new Error(`invalid ${fieldName}: ${filePath}`);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`path does not exist: ${filePath}`);
  }

  if (!fs.statSync(filePath).isFile()) {
    throw new Error(`not a file: ${filePath}`);
  }

  return filePath;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getServerOptions(options = {}) {
  const host = options.serverHost ?? defaultHost;
  const port = options.serverPort ?? defaultPort;

  assertNonBlankString(host, "host");
  assertPort(port);

  const serverUrl = `http://${host}:${port}/`;
  const testUrl = `${serverUrl}__ready`;

  return {
    host,
    port,
    serverUrl,
    testUrl,
  };
}

async function waitServerReady(options = {}) {
  const { serverUrl } = getServerOptions(options);

  const timeout = options.serverReadyTimeout ?? defaultTimeout;
  const interval = options.serverReadyInterval ?? defaultInterval;

  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await isServerReady(options)) {
      return true;
    }

    const remaining = timeout - (Date.now() - start);
    if (remaining <= 0) break;

    await sleep(Math.min(interval, remaining));
  }

  throw new Error(`Web server not ready: ${serverUrl}`);
}
