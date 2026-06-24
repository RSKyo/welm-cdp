import { type, click } from "../../cdp/input.js";
import { waitElementAppear, waitElementDisappear } from "../../cdp/wait.js";
import { ensureChrome, ensureChromePage } from "../../cdp/chrome.js";

import { log } from "../../infra/log.js";
import { sleep } from "../../infra/utils.js";
import { CHATGPT_URL } from "../../infra/config.js";
import { readClipboard } from "../../utils/clipboard.js"

import {
  TEXTAREA_SELECTOR,
  SEND_BUTTON_SELECTOR,
  STOP_BUTTON_SELECTOR,
  COPY_BUTTON_SELECTOR,
} from "./selector.js";

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function ask(prompt, options = {}) {
  await ensureChrome(options);
  const { id } = await ensureChromePage(CHATGPT_URL, options);

  const startTime = Date.now();

  // 写入
  log.progress("Preparing prompt...");
  await type(id, TEXTAREA_SELECTOR, prompt, options);

  // 提交
  log.progress("Submitting prompt...");
  await click(id, SEND_BUTTON_SELECTOR, options);

  // 等待回复
  log.progress("Waiting for response...");
  await waitElementAppear(id, STOP_BUTTON_SELECTOR, options);
  await sleep(3000);
  await waitElementDisappear(id, STOP_BUTTON_SELECTOR, options);

  // 复制回复
  log.progress("Copying response...");
  await click(id, COPY_BUTTON_SELECTOR, {
    ...options,
    nth: -1,
  });

  await sleep(500);

  // 获取回复
  const answer = await readClipboard(id, options);

  const lines = answer.trim().split("\n");
  let summary = lines[0];

  if (lines.length > 1) {
    summary += "...";
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  log.progressDone(`Done (${elapsed}s): ${summary}`);

  return answer;
}
