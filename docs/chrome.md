# Chrome API

`welm-cdp/chrome` 提供 Chrome 启动、CDP 服务检查与 Chrome 页面管理能力。

```js
import {
  setCdpHost,
  setCdpPort,
  setCdpTargetType,
  setChromeBin,
  setChromeUserDataDir,
  isChromeReady,
  ensureChrome,
  listChromePages,
  findChromePage,
  findChromePages,
  activateChromePage,
  reloadChromePage,
  openChromePage,
  ensureChromePage,
  closeChromePage,
} from "welm-cdp/chrome";
```

## API 一览

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `setCdpHost(host?)` | `string` | 保存默认 CDP 服务主机地址 |
| `setCdpPort(port?)` | `number` | 保存默认 CDP 服务端口 |
| `setCdpTargetType(targetType?)` | `string` | 保存默认 CDP Target 类型 |
| `setChromeBin(chromeBin)` | `string` | 保存 Chrome 可执行文件路径 |
| `setChromeUserDataDir(userDataDir)` | `string` | 保存 Chrome 用户数据目录 |
| `isChromeReady(options?)` | `Promise<boolean>` | 检查 CDP 服务是否可访问，不启动 Chrome |
| `ensureChrome(options?)` | `Promise<ChromeInfo>` | 必要时启动 Chrome，并等待 CDP 服务就绪 |
| `listChromePages(options?)` | `Promise<Page[]>` | 列出指定类型的 Chrome Target |
| `findChromePage(keyword, options?)` | `Promise<Page \| null>` | 查找第一个匹配页面 |
| `findChromePages(keywords, options?)` | `Promise<Page[]>` | 查找全部匹配页面 |
| `activateChromePage(keyword, options?)` | `Promise<Page>` | 激活第一个匹配页面 |
| `reloadChromePage(keyword, options?)` | `Promise<Page>` | 忽略缓存刷新页面，并等待页面就绪 |
| `openChromePage(url, options?)` | `Promise<Page>` | 新建页面、打开 URL，并等待页面就绪 |
| `ensureChromePage(url, options?)` | `Promise<Page>` | 已存在则返回，否则新建并打开页面 |
| `closeChromePage(keywords, options?)` | `Promise<boolean>` | 关闭全部匹配页面 |

## 返回对象

### `Page`

```js
{
  targetId: "PAGE_TARGET_ID",
  type: "page",
  title: "Page title",
  url: "https://example.com/"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | CDP Target ID |
| `type` | `string` | Target 类型 |
| `title` | `string` | 当前页面标题 |
| `url` | `string` | 当前页面 URL |

### `ChromeInfo`

```js
{
  host: "127.0.0.1",
  port: 9222,
  targetType: "page",
  userDataDir: "/Users/name/.local/share/welm/chrome-profile",
  chromeBin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  launched: true,
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `host` | `string` | CDP 服务主机地址 |
| `port` | `number` | CDP 服务端口 |
| `targetType` | `string` | Target 类型 |
| `userDataDir` | `string` | 本次调用使用的 Chrome 用户数据目录 |
| `chromeBin` | `string` | 本次调用使用的 Chrome 可执行文件路径 |
| `launched` | `boolean` | 是否由本次 `ensureChrome()` 启动 Chrome |

## Options 清单

除五个 `set...` 方法外，其他方法都可传入 `options`，但每个方法只读取与自己相关的字段。

| 选项 | 类型 | 默认值 | 使用方法 | 说明 |
| --- | --- | --- | --- | --- |
| `cdpHost` | `string` | `config.cdp.host`，否则 `"127.0.0.1"` | 全部异步方法 | 本次调用的 CDP 服务主机地址；优先于保存配置 |
| `cdpPort` | `number` | `config.cdp.port`，否则 `9222` | 全部异步方法 | 本次调用的 CDP 服务端口；优先于保存配置 |
| `targetType` | `string` | `config.cdp.targetType`，否则 `"page"` | `ensureChrome`、全部页面方法 | 本次调用的 Target 类型；优先于保存配置 |
| `chromeBin` | `string` | `config.cdp.chromeBin` | `ensureChrome` | 本次启动 Chrome 的可执行文件路径；优先于已保存配置 |
| `userDataDir` | `string` | `config.cdp.userDataDir` | `ensureChrome` | 本次启动 Chrome 的用户数据目录；优先于已保存配置 |
| `chromeReadyTimeout` | `number` | `15000` | `ensureChrome` | 等待 CDP 服务就绪的最长时间，毫秒 |
| `chromeReadyInterval` | `number` | `200` | `ensureChrome` | 检查 CDP 服务的轮询间隔，毫秒 |
| `throwIfNotFound` | `boolean` | `true` | `findChromePage` | 找不到页面时是否抛出异常；设为 `false` 时返回 `null` |
| `leaveAboutBlankTimeout` | `number` | `5000` | `openChromePage`、`reloadChromePage`；间接用于 `ensureChromePage` | 等待新页面离开 `about:blank` 的最长时间，毫秒 |
| `leaveAboutBlankInterval` | `number` | `50` | 同上 | 等待页面离开 `about:blank` 的轮询间隔，毫秒 |
| `pageReadyTimeout` | `number` | `30000` | `openChromePage`、`reloadChromePage`；间接用于 `ensureChromePage` | 等待 `document.readyState` 就绪的最长时间，毫秒 |
| `pageReadyInterval` | `number` | `200` | 同上 | 轮询 `document.readyState` 的间隔，毫秒 |

## API 详情

### `setCdpHost(host = "127.0.0.1")`

```js
const host = setCdpHost("127.0.0.1");
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `host` | `string` | 否 | 非空的 Chrome CDP 服务主机地址 |

- 未传入时保存 `"127.0.0.1"`。
- 返回保存后的主机地址。
- 保存到共享 `config.json` 的 `cdp.host`。
- 后续调用未传入 `options.cdpHost` 时，`getCdpOptions()` 使用此值。
- 不检查主机是否可访问；如需检查，调用 `isChromeReady()`。

### `setCdpPort(port = 9222)`

```js
const port = setCdpPort(9222);
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `port` | `number` | 否 | 正数的 Chrome CDP 服务端口 |

- 未传入时保存 `9222`。
- 返回保存后的端口。
- 保存到共享 `config.json` 的 `cdp.port`。
- 后续调用未传入 `options.cdpPort` 时，`getCdpOptions()` 使用此值。
- 不检查该端口是否已被 Chrome 监听；如需检查，调用 `isChromeReady()`。

### `setCdpTargetType(targetType = "page")`

```js
const targetType = setCdpTargetType("page");
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `targetType` | `string` | 否 | 非空的 Chrome CDP Target 类型 |

- 未传入时保存 `"page"`。
- 返回保存后的 Target 类型。
- 保存到共享 `config.json` 的 `cdp.targetType`。
- 后续页面操作未传入 `options.targetType` 时，`getCdpOptions()` 使用此值。
- 常用值为 `"page"`；也可设为 `"service_worker"` 等 CDP Target 类型。

### `setChromeBin(chromeBin)`

```js
const chromeBin = setChromeBin(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
);
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `chromeBin` | `string` | 是 | 非空的 Chrome 可执行文件路径 |

- 返回保存后的路径。
- 保存到共享 `config.json` 的 `cdp.chromeBin`。
- 不检查文件是否存在，不启动 Chrome。

### `setChromeUserDataDir(userDataDir)`

```js
const userDataDir = setChromeUserDataDir(
  "/Users/name/.local/share/welm/chrome-profile",
);
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userDataDir` | `string` | 是 | 非空的 Chrome 用户数据目录路径 |

- 返回保存后的路径。
- 保存到共享 `config.json` 的 `cdp.userDataDir`。
- 此目录应当专供自动化 Chrome 使用，不应与日常 Chrome 默认 Profile 混用。

### `isChromeReady(options?)`

```js
const ready = await isChromeReady({
  cdpHost: "127.0.0.1",
  cdpPort: 9222,
});
```

- 使用 options：`cdpHost`、`cdpPort`。
- 返回 `true` 表示 `http://<host>:<port>/json/version` 可正常访问；否则返回 `false`。
- 只检查服务状态，**不会**启动 Chrome。
- 服务不存在、连接失败或请求异常时不会抛错，直接返回 `false`。

### `ensureChrome(options?)`

```js
const chrome = await ensureChrome({
  chromeBin:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  userDataDir: "/Users/name/.local/share/welm/chrome-profile",
});
```

- 使用 options：`cdpHost`、`cdpPort`、`targetType`、`chromeBin`、`userDataDir`、`chromeReadyTimeout`、`chromeReadyInterval`。
- 返回 `ChromeInfo`。
- CDP 服务不可用时，启动 Chrome 并等待服务就绪；已就绪时不重复启动。
- `chromeBin` 与 `userDataDir` 的来源优先级：本次 `options` → `config.json` 中的 `cdp.chromeBin` / `cdp.userDataDir`。
- 即使 CDP 服务已经就绪，方法仍需解析这两个路径以返回 `ChromeInfo`；因此两者必须已配置，或在本次 options 中提供。
- Chrome 以 detached 子进程启动，调用方退出后不会主动关闭它。

### `listChromePages(options?)`

```js
const pages = await listChromePages({
  targetType: "page",
});
```

- 使用 options：`cdpHost`、`cdpPort`、`targetType`。
- 返回 `Page[]`；没有页面时返回空数组。
- 默认只返回 `type === "page"` 的 Target；传入其他 `targetType` 时，方法名虽仍为 `listChromePages`，返回的可能是 worker 等其他 Target。

### `findChromePage(keyword, options?)`

```js
const page = await findChromePage("example", {
  throwIfNotFound: false,
});
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | `string` | 是 | Target ID、标题或 URL 的查找关键字 |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`、`throwIfNotFound`。
- 返回第一个匹配的 `Page`。
- Target ID 精确匹配；标题和 URL 为包含匹配；全部忽略大小写。
- 默认找不到时抛出异常。传入 `{ throwIfNotFound: false }` 时返回 `null`。

### `findChromePages(keywords, options?)`

```js
const pages = await findChromePages([
  "example",
  "localhost",
]);
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keywords` | `string \| string[]` | 是 | 一个或多个 Target ID、标题或 URL 关键字 |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`。
- 返回全部匹配的 `Page[]`；无匹配时返回空数组。
- 每个页面最多返回一次；页面匹配任意一个关键字即可。
- 匹配规则与 `findChromePage()` 相同。

### `activateChromePage(keyword, options?)`

```js
const page = await activateChromePage("example");
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | `string` | 是 | Target ID、标题或 URL 的查找关键字 |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`。
- 返回被激活的 `Page`。
- 操作第一个匹配页面；找不到时抛出异常。
- 匹配规则与 `findChromePage()` 相同。

### `reloadChromePage(keyword, options?)`

```js
const page = await reloadChromePage("example", {
  pageReadyTimeout: 30000,
});
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | `string` | 是 | Target ID、标题或 URL 的查找关键字 |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`、`leaveAboutBlankTimeout`、`leaveAboutBlankInterval`、`pageReadyTimeout`、`pageReadyInterval`。
- 返回刷新完成后的最新 `Page`。
- 操作第一个匹配页面；找不到时抛出异常。
- 刷新固定使用 `{ ignoreCache: true }`，即忽略缓存。
- 等待 URL 离开 `about:blank`，再等待 `document.readyState` 为 `interactive` 或 `complete`。

### `openChromePage(url, options?)`

```js
const page = await openChromePage("https://example.com", {
  leaveAboutBlankTimeout: 5000,
  pageReadyTimeout: 30000,
});
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 有效的 HTTP 或 HTTPS URL |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`、`leaveAboutBlankTimeout`、`leaveAboutBlankInterval`、`pageReadyTimeout`、`pageReadyInterval`。
- 返回新页面就绪后的最新 `Page`。
- URL 不是 HTTP 或 HTTPS 时抛出异常。
- 依次等待 URL 离开 `about:blank`，以及 `document.readyState` 为 `interactive` 或 `complete`。

### `ensureChromePage(url, options?)`

```js
const page = await ensureChromePage("https://example.com/");
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 是 | 有效的 HTTP 或 HTTPS URL，同时用作查找关键字 |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`、`leaveAboutBlankTimeout`、`leaveAboutBlankInterval`、`pageReadyTimeout`、`pageReadyInterval`。
- 返回已有或新建后的 `Page`。
- 先按 `url` 查找第一个匹配页面；只有找不到时才调用 `openChromePage()` 新建页面。
- 这是关键字匹配而不是 URL 严格相等；较短 URL 可能匹配到其他页面。
- 找到已有页面时，不等待其加载完成，也不刷新页面；只有新建页面时才执行页面就绪等待。

### `closeChromePage(keywords, options?)`

```js
const closed = await closeChromePage([
  "example",
  "localhost",
]);
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keywords` | `string \| string[]` | 是 | 一个或多个 Target ID、标题或 URL 关键字 |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`。
- 完成后返回 `true`。
- 关闭全部匹配页面；没有匹配项时不抛错，仍返回 `true`。
- 页面按顺序逐个关闭；某次关闭失败时会停止并抛出异常。

## 页面就绪的含义

`openChromePage()` 与 `reloadChromePage()` 将页面视为就绪的条件是：

1. Target URL 已不再是 `about:blank`；
2. `document.readyState` 为 `interactive` 或 `complete`。

这表示 DOM 已可使用，不代表异步请求、动画或延迟渲染全部结束。需要等待具体页面元素时，应在返回后使用 `welm-cdp/dom` 的等待方法。
