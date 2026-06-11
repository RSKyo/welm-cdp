export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 9222;

export const DEFAULT_TIMEOUT = 10000;
export const DEFAULT_INTERVAL = 200;

export const NETWORK_CHECK_URL = "https://www.google.com"; // 或任何可靠可访问的地址
export const DEFAULT_NETWORK_CHECK_TIMEOUT = 5000; // 毫秒

export const WELM_HOME =
  process.env.WELM_HOME ?? `${process.env.HOME}/.local/share/welm`;

export const CHROME_USER_DATA_DIR =
  process.env.CHROME_USER_DATA_DIR ?? `${WELM_HOME}/chrome-profile`;

export const CACHE_DIR = `${WELM_HOME}/cache`;

export const TEMP_DIR = `${WELM_HOME}/temp`;
