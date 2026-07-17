# Client API

`welm-cdp/client` 管理连接到指定 Chrome Target 的可复用 CDP client。它是进程内缓存，不负责启动 Chrome、查找页面或关闭页面。

```js
import { getClient, closeClients } from "welm-cdp/client";
```

## API 一览

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `getClient(targetId, options?)` | `Promise<CDP.Client>` | 获取或创建指定 Target 的可复用 client |
| `closeClients(onClose?)` | `Promise<void>` | 关闭当前进程中所有缓存 client |

## Options 清单

| 选项 | 类型 | 默认值 | 使用方法 | 说明 |
| --- | --- | --- | --- | --- |
| `cdpHost` | `string` | `config.cdp.host`，否则 `"127.0.0.1"` | `getClient` | Chrome CDP 服务主机地址；优先于保存配置 |
| `cdpPort` | `number` | `config.cdp.port`，否则 `9222` | `getClient` | Chrome CDP 服务端口；优先于保存配置 |

## API 详情

### `getClient(targetId, options?)`

```js
const client = await getClient(targetId);

const result = await client.Runtime.evaluate({
  expression: "document.title",
  returnByValue: true,
});
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `targetId` | `string` | 是 | 要连接的 Chrome Target ID |

- 使用 options：`cdpHost`、`cdpPort`。
- 返回连接到该 Target 的 `chrome-remote-interface` client。
- 缓存键为 `host:port:targetId`；相同连接参数会返回同一个 client。
- 并发请求相同 Target 时，共用同一个“创建中”的 Promise，不会重复建立连接。
- client 断开连接时，会自动从缓存中删除。
- 创建连接失败时，该 Promise 会从缓存移除，后续调用可以重新连接。
- 使用完成后应调用 `closeClients()` 关闭连接。

### `closeClients(onClose?)`

```js
try {
  await main();
} finally {
  await closeClients();
}
```

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `onClose` | `(targetId, options) => void \| Promise<void>` | 否 | 每个缓存 client 完成处理后执行的清理回调 |

回调收到：

```js
await closeClients(async (targetId, options) => {
  // options = { cdpHost, cdpPort }
});
```

- 关闭所有当前进程已缓存的 client，并返回 `Promise<void>`。
- 先清空缓存，再逐个关闭 client；因此关闭期间新的 `getClient()` 调用可以创建新的 client。
- client 创建失败、关闭失败，以及 `onClose` 回调失败都会被忽略，避免阻止其他 client 的清理。
- 只关闭 CDP 连接，不会关闭 Chrome 进程或 Chrome 页面。
- `onClose` 不是函数且不是 `undefined` 时抛出异常。

## 命令行说明

`cmd/client.js` 提供：

```text
client get <targetId> [options]
client close
```

`client get` 返回连接信息，而不是返回 CDP client 对象本身，因为该对象只能在当前 Node 进程中使用。普通 CLI 每次执行会启动新进程，因此 `client close` 主要用于同一进程内组合执行命令或手动测试；业务代码应直接使用上述 API。
