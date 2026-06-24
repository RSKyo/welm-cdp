import { ensureChrome, ensureChromePage, activateChromePage } from "../../cdp/chrome.js";
import { fillText, click, selectAll } from "../../cdp/input.js";
import { waitElementAppear, waitElementDisappear } from "../../cdp/dom.js";

import { log } from "../../infra/log.js";
import { readClipboard } from "../../utils/clipboard.js";

import {
  TEXTAREA_SELECTOR,
  SEND_BUTTON_SELECTOR,
  STOP_BUTTON_SELECTOR,
  COPY_BUTTON_SELECTOR,
} from "./selector.js";

const chatgpt_url = "https://chatgpt.com";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ask(prompt, options = {}) {
;


  await ensureChrome(options);

  const url = options.temp
    ? `${chatgpt_url}/?temporary-chat=true`
    : chatgpt_url;
  const { targetId } = await ensureChromePage(url, options);

  const startTime = Date.now();

  // 写入
  log.progress("Preparing prompt...");
await activateChromePage(targetId, options);

  await fillText(targetId, TEXTAREA_SELECTOR, prompt, options);

  // // 提交
  // log.progress("Submitting prompt...");
  // await click(targetId, SEND_BUTTON_SELECTOR, options);

  // // 等待回复
  // log.progress("Waiting for response...");
  // await waitElementAppear(targetId, STOP_BUTTON_SELECTOR, options);
  // await sleep(3000);
  // await waitElementDisappear(targetId, STOP_BUTTON_SELECTOR, options);

  // // 复制回复
  // log.progress("Copying response...");
  // await click(targetId, COPY_BUTTON_SELECTOR, {
  //   ...options,
  //   nth: -1,
  // });

  // await sleep(500);

  // // 获取回复
  // const answer = await readClipboard(targetId, options);

  // const lines = answer.trim().split("\n");
  // let summary = lines[0];

  // if (lines.length > 1) {
  //   summary += "...";
  // }

  // const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // log.progressDone(`Done (${elapsed}s): ${summary}`);

  // return answer;
}
