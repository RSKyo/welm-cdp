# Target API

`welm-cdp/target` 提供 CDP Target 的底层连接、查询与操作能力。`chrome` 模块面向“Chrome 页面”；本模块直接处理任意 Chrome Target。

```js
import {
  getCdpOptions,
  listTargets,
  getTarget,
  findTarget,
  findTargets,
  activateTarget,
  reloadTarget,
  openTarget,
  closeTarget,
} from "welm-cdp/target";
```

## API 一览

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `getCdpOptions(options?)` | `CdpOptions` | 解析本次调用实际使用的 CDP 配置 |
| `listTargets(options?)` | `Promise<Target[]>` | 列出指定类型的 Target |
| `getTarget(targetId, options?)` | `Promise<Target>` | 按 Target ID 获取一个 Target |
| `findTarget(keyword, options?)` | `Promise<Target \| null>` | 查找第一个匹配 Target |
| `findTargets(keywords, options?)` | `Promise<Target[]>` | 查找全部匹配 Target |
| `activateTarget(targetId, options?)` | `Promise<void>` | 激活 Target |
| `reloadTarget(targetId, options?)` | `Promise<void>` | 忽略缓存刷新 Target |
| `openTarget(url, options?)` | `Promise<Target>` | 新建 Target 并打开 URL |
| `closeTarget(targetId, options?)` | `Promise<void>` | 关闭 Target |

## 返回对象

### `CdpOptions`

```js
{
  host: "127.0.0.1",
  port: 9222,
  targetType: "page",
}
```

### `Target`

```js
{
  targetId: "PAGE_TARGET_ID",
  type: "page",
  title: "Page title",
  url: "https://example.com/",
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |
| `type` | `string` | Target 类型 |
| `title` | `string` | Target 标题 |
| `url` | `string` | Target URL |

## Options 清单

| 选项 | 类型 | 默认值 | 使用方法 | 说明 |
| --- | --- | --- | --- | --- |
| `cdpHost` | `string` | `config.cdp.host`，否则 `"127.0.0.1"` | 全部方法 | 本次调用的 CDP 服务主机地址；优先于保存配置 |
| `cdpPort` | `number` | `config.cdp.port`，否则 `9222` | 全部方法 | 本次调用的 CDP 服务端口；优先于保存配置 |
| `targetType` | `string` | `config.cdp.targetType`，否则 `"page"` | `getCdpOptions`、`listTargets`、`getTarget`、`findTarget`、`findTargets` | 要包含或查找的 Target 类型；优先于保存配置 |
| `throwIfNotFound` | `boolean` | `true` | `findTarget` | 找不到 Target 时是否抛出异常；设为 `false` 时返回 `null` |

## API 详情

### `getCdpOptions(options?)`

```js
const cdp = getCdpOptions({
  cdpPort: 9333,
  targetType: "page",
});
```

- 返回解析后的 `CdpOptions`。
- 优先级：本次 `options` → 模块加载时读取的 `config.json` 值 → 内置默认值。
- `config.json` 的值为 `cdp.host`、`cdp.port`、`cdp.targetType`。

### `listTargets(options?)`

```js
const targets = await listTargets({
  targetType: "page",
});
```

- 使用 options：`cdpHost`、`cdpPort`、`targetType`。
- 返回符合 `targetType` 的 `Target[]`；没有匹配项时返回空数组。
- 所有返回项均标准化为 `targetId`、`type`、`title`、`url`。

### `getTarget(targetId, options?)`

```js
const target = await getTarget(targetId);
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `targetId` | `string` | 是 | 完整 Chrome Target ID |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`。
- 返回匹配的 `Target`。
- 仅按 Target ID 精确匹配，忽略大小写。
- 找不到时抛出 `target not found: <targetId>`。

### `findTarget(keyword, options?)`

```js
const target = await findTarget("example", {
  throwIfNotFound: false,
});
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | `string` | 是 | Target ID、标题或 URL 关键字 |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`、`throwIfNotFound`。
- 返回第一个匹配的 `Target`；设定 `throwIfNotFound: false` 且找不到时返回 `null`。
- 32 位十六进制 Target ID 使用精确匹配；其他关键字对标题和 URL 使用包含匹配；全部忽略大小写。

### `findTargets(keywords, options?)`

```js
const targets = await findTargets([
  "example",
  "localhost",
]);
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keywords` | `string \| string[]` | 是 | 一个或多个 Target ID、标题或 URL 关键字 |

- 使用 options：`cdpHost`、`cdpPort`、`targetType`。
- 返回全部匹配的 `Target[]`；没有匹配项时返回空数组。
- 每个 Target 最多返回一次；匹配任意一个关键字即可。
- 匹配规则与 `findTarget()` 相同。

### `activateTarget(targetId, options?)`

```js
await activateTarget(targetId);
```

- 参数：`targetId` 为必填 Target ID。
- 使用 options：`cdpHost`、`cdpPort`。
- Target 不存在或 CDP 请求失败时抛出异常。

### `reloadTarget(targetId, options?)`

```js
await reloadTarget(targetId);
```

- 参数：`targetId` 为必填 Target ID。
- 使用 options：`cdpHost`、`cdpPort`。
- 固定使用 `Page.reload({ ignoreCache: true })`。
- 仅表示刷新请求已发送，不等待页面加载完成。

### `openTarget(url, options?)`

```js
const target = await openTarget("https://example.com");
```

- 参数：`url` 为要打开的 URL。
- 使用 options：`cdpHost`、`cdpPort`。
- 返回标准化后的新 `Target`。
- 本方法本身不校验 URL，也不等待页面加载完成。

### `closeTarget(targetId, options?)`

```js
await closeTarget(targetId);
```

- 参数：`targetId` 为必填 Target ID。
- 使用 options：`cdpHost`、`cdpPort`。
- 仅表示关闭请求已被 CDP 接受；Target 不存在或请求失败时抛出异常。
