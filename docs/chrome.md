# Chrome

`chrome.js` 基于 [`chrome-remote-interface`](https://github.com/cyrus-and/chrome-remote-interface) 封装 Chrome DevTools Protocol（CDP）相关操作，用于：

- 检查或启动带远程调试端口的 Chrome；
- 检查 CDP 服务是否已经就绪；
- 查找、打开、激活、刷新和关闭 Chrome 页面；
- 在打开或刷新页面后等待页面进入可用状态。

## 安装依赖

```bash
npm install chrome-remote-interface
```

如果通过 `welm-cdp` 使用：

```js
import {
  ensureChrome,
  ensureChromePage,
  listChromePages,
} from "welm-cdp/chrome";
```

如果直接使用当前文件：

```js
import {
  ensureChrome,
  ensureChromePage,
  listChromePages,
} from "./chrome.js";
```

## 快速开始

```js
import {
  ensureChrome,
  ensureChromePage,
  activateChromePage,
  reloadChromePage,
  closeChromePage,
} from "welm-cdp/chrome";

await ensureChrome();

const page = await ensureChromePage("https://example.com");

console.log(page);
// {
//   targetId: "...",
//   type: "page",
//   title: "Example Domain",
//   url: "https://example.com/"
// }

await activateChromePage(page.targetId);
await reloadChromePage(page.targetId);
await closeChromePage(page.targetId);
```

## 导出方法

### Chrome 生命周期

#### `ensureChrome(options)`

确保 Chrome CDP 服务可用。

执行过程：

1. 请求 `http://host:port/json/version` 检查 CDP 服务；
2. 如果服务尚未就绪，则启动 Chrome；
3. 轮询 CDP 服务，直到服务可用或等待超时；
4. 如果服务已经就绪，则直接返回当前连接配置，不会再次启动 Chrome。

```js
const info = await ensureChrome();
```

无论 Chrome 是新启动的还是已经存在，返回对象的字段都相同：

```js
{
  host: "127.0.0.1",
  port: 9222,
  targetType: "page",
  userDataDir: "/Users/name/.local/share/welm/chrome-profile",
  chromeBin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  launched: true
}
```

`launched` 表示本次调用是否启动了新的 Chrome：

- `true`：CDP 服务尚未就绪，本次调用启动了 Chrome；
- `false`：CDP 服务已经就绪，没有再次启动 Chrome。

返回结果由内部的 `normalizeChromeInfo()` 统一生成，因此两种情况下都包含 `host`、`port`、`targetType`、`userDataDir`、`chromeBin` 和 `launched`。

#### `isChromeReady(options)`

检查 CDP 服务是否可以访问。

```js
const ready = await isChromeReady();

if (ready) {
  console.log("Chrome CDP service is ready");
}
```

请求成功且 HTTP 状态正常时返回 `true`；请求失败或服务不可访问时返回 `false`。

### Chrome 页面

单个页面的信息使用下面的对象结构：

```js
{
  targetId: "PAGE_TARGET_ID",
  type: "page",
  title: "Page title",
  url: "https://example.com/"
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | CDP Target ID |
| `type` | `string` | Target 类型，默认只返回 `page` |
| `title` | `string` | 页面标题 |
| `url` | `string` | 页面完整 URL |

#### `listChromePages(options)`

返回符合 `targetType` 的所有 Target。默认只返回类型为 `page` 的页面。

```js
const pages = await listChromePages();

for (const page of pages) {
  console.log(page.targetId, page.title, page.url);
}
```

#### `findChromePage(keywords, options)`

根据一个或多个关键字查找页面，返回第一个匹配项。

`keywords` 可以是字符串或字符串数组。匹配会忽略大小写并清除关键字两端的空白。只要页面的 Target ID、标题或 URL 包含任意一个关键字，就视为匹配。

```js
const page = await findChromePage("example");

if (page) {
  console.log(page.targetId);
}
```

默认情况下，找不到页面会抛出异常：

```text
target not found: example
```

如果希望找不到时返回 `null`，可以设置：

```js
const page = await findChromePage("example", {
  throwIfNotFound: false,
});
```

每个关键字都必须是非空字符串，否则会抛出异常。

#### `findChromePages(keywords, options)`

同时查找多个页面，返回所有匹配项。

`keywords` 可以是一个字符串或字符串数组。只要页面的 Target ID、标题或 URL 包含任意一个关键字，就会返回该页面。

```js
const pages = await findChromePages([
  "example",
  "localhost",
]);
```

同一个页面只返回一次。

没有匹配页面时返回空数组，不会抛出“页面不存在”异常。

#### `openChromePage(url, options)`

创建并打开一个 HTTP 或 HTTPS 页面，然后等待页面可用。

```js
const page = await openChromePage("https://example.com");
```

打开页面后，方法会：

1. 等待页面离开 `about:blank`；
2. 轮询 `document.readyState`；
3. 当状态变为 `interactive` 或 `complete` 时返回最新页面信息。

`url` 不是有效的 HTTP 或 HTTPS URL 时会抛出异常：

```text
invalid URL: URL
```

#### `ensureChromePage(url, options)`

确保指定页面存在。

使用 `url` 作为关键字查找页面：如果现有页面的 Target ID、标题或 URL 包含该字符串，则直接返回第一个匹配页面；否则打开新页面。

```js
const page = await ensureChromePage("https://example.com/");
```

#### `activateChromePage(keywords, options)`

查找并激活第一个匹配页面，使其成为 Chrome 当前显示的页面，并返回该页面的信息。

```js
const page = await activateChromePage("example");
```

`keywords` 可以是字符串或字符串数组。找不到页面时会抛出异常。

#### `reloadChromePage(keywords, options)`

查找并刷新第一个匹配页面。刷新时忽略缓存，等待页面可用后返回最新页面信息。

```js
const page = await reloadChromePage("example");
```

内部刷新参数为：

```js
{
  ignoreCache: true
}
```

`keywords` 可以是字符串或字符串数组。找不到页面时会抛出异常。

#### `closeChromePage(keywords, options)`

关闭所有匹配页面，完成后返回 `true`。

```js
await closeChromePage([
  "example",
  "localhost",
]);
```

`keywords` 可以是字符串或字符串数组。没有匹配页面时不会抛出“页面不存在”异常，仍然返回 `true`。

## Options

所有导出方法都接受同一套 `options`。不同方法只读取与自身相关的配置。

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `cdpHost` | `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `9222` | Chrome CDP 服务端口 |
| `targetType` | `"page"` | `list` 和页面查找操作处理的 Target 类型 |
| `userDataDir` | `~/.local/share/welm/chrome-profile` | 启动 Chrome 时使用的独立用户数据目录 |
| `chromeBin` | 根据平台确定 | Chrome 可执行文件路径，优先级高于 `CHROME_BIN` 环境变量 |
| `chromeReadyTimeout` | `15000` | 等待 CDP 服务就绪的最长时间，单位为毫秒 |
| `chromeReadyInterval` | `200` | 检查 CDP 服务的轮询间隔，单位为毫秒 |
| `pageReadyTimeout` | `30000` | 等待页面进入可用状态的最长时间，单位为毫秒 |
| `pageReadyInterval` | `200` | 轮询 `document.readyState` 的间隔，单位为毫秒 |
| `throwIfNotFound` | `true` | `findChromePage` 找不到页面时是否抛出异常 |
| `reporter` | `undefined` | 可选的进度报告对象 |

完整配置示例：

```js
const options = {
  cdpHost: "127.0.0.1",
  cdpPort: 9222,
  targetType: "page",
  userDataDir: "/Users/name/.local/share/welm/chrome-profile",
  chromeBin:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  chromeReadyTimeout: 15000,
  chromeReadyInterval: 200,
  pageReadyTimeout: 30000,
  pageReadyInterval: 200,
  throwIfNotFound: true,
};

await ensureChrome(options);
const page = await openChromePage("https://example.com", options);
```

### Chrome 可执行文件优先级

Chrome 可执行文件按照以下顺序选择：

1. `options.chromeBin`；
2. `CHROME_BIN` 环境变量；
3. 当前平台的默认值。

macOS 默认值：

```text
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

Linux 和 Windows 的源码默认值分别是 `google-chrome` 和 `chrome.exe`。由于文件检查使用 `access()`，它不会自动从系统 `PATH` 中查找命令，因此在 Linux 和 Windows 上应传入绝对路径：

```js
await ensureChrome({
  chromeBin: "/usr/bin/google-chrome",
});
```

```js
await ensureChrome({
  chromeBin: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
});
```

也可以通过环境变量配置：

```bash
export CHROME_BIN="/usr/bin/google-chrome"
```

### Reporter

`ensureChrome`、`openChromePage` 和 `reloadChromePage` 可以通过 `reporter` 输出进度。

`reporter` 可以提供以下方法：

```js
const reporter = {
  progress(message, options) {
    console.log(message);
  },

  progressDone(message, options) {
    console.log(message);
  },
};

await ensureChrome({ reporter });
```

这些方法都是可选的；没有提供 `reporter` 不会影响 Chrome 操作。

## 工作原理

### 启动 Chrome

Chrome 使用以下参数启动：

```text
--remote-debugging-address=127.0.0.1
--remote-debugging-port=9222
--user-data-dir=~/.local/share/welm/chrome-profile
--no-first-run
--no-default-browser-check
```

启动的 Chrome 子进程使用独立进程模式，并忽略标准输入、标准输出和标准错误。调用方进程退出后，不会主动终止这个 Chrome 进程。

### Target 类型过滤

`CDP.List()` 会返回多种 Target，例如页面、iframe、worker 等。当前模块默认只保留：

```js
target.type === "page"
```

如需处理其他类型，可以传入 `targetType`：

```js
const workers = await listChromePages({
  targetType: "service_worker",
});
```

需要注意的是，方法名仍然叫 `listChromePages`，但返回内容会按照指定的 Target 类型过滤。

### 页面关键字匹配

页面查找会将关键字和 Target 的以下字段统一转换为小写后进行包含匹配：

- `targetId`；
- `title`；
- `url`。

`keywords` 可以是字符串或字符串数组。传入数组时，只要任意一个关键字匹配，页面就会被选中。

不同公开方法对匹配结果的处理方式如下：

| 方法 | 匹配结果处理 |
| --- | --- |
| `findChromePage` | 返回第一个匹配页面，默认找不到时抛出异常 |
| `findChromePages` | 返回全部匹配页面，找不到时返回空数组 |
| `activateChromePage` | 激活第一个匹配页面 |
| `reloadChromePage` | 刷新第一个匹配页面 |
| `closeChromePage` | 关闭全部匹配页面 |

### `target` 与 `id`

连接指定 Target 时，`chrome-remote-interface` 使用 `target`：

```js
const client = await CDP({
  target: targetId,
});
```

激活或关闭 Target 时，使用 `id`：

```js
await CDP.Activate({ id: targetId });
await CDP.Close({ id: targetId });
```

`targetId` 是当前模块使用的变量名；传给不同 API 时，需要映射为对应的参数名。

## 注意事项

- 使用页面操作前，应先调用 `ensureChrome()`，确保 CDP 服务已经启动。
- CDP 调试端口默认是 `9222`，同一组调用应使用相同的 `cdpHost` 和 `cdpPort`。
- Chrome 使用独立的 `user-data-dir`，不会直接复用普通 Chrome 窗口的默认用户配置。
- `findChromePage` 和 `findChromePages` 采用忽略大小写的包含匹配；关键字越短，越可能同时匹配多个页面。
- `activateChromePage` 和 `reloadChromePage` 只操作第一个匹配页面，`closeChromePage` 会操作全部匹配页面。
- `openChromePage` 只接受有效的 HTTP 或 HTTPS URL。
- 页面就绪表示 `document.readyState` 已经达到 `interactive` 或 `complete`，不代表页面中的异步请求、动画或延迟渲染已经全部完成。
- `waitLeaveAboutBlank` 的内部超时时间固定为 2000 毫秒，当前不能通过 `options` 修改。
- `reloadChromePage` 使用 `ignoreCache: true`，每次都会忽略缓存刷新页面。
