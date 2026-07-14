# Client

`client.js` 基于 [`chrome-remote-interface`](https://github.com/cyrus-and/chrome-remote-interface) 管理 CDP Client 连接，用于：

- 根据 Chrome 地址、CDP 端口和 Target ID 创建 Client；
- 缓存并复用已经创建的 Client；
- 避免并发操作为同一个 Target 重复创建 Client；
- 在连接断开时自动删除失效缓存；
- 在一项操作结束后主动关闭所有 Client。

Client 表示 Node.js 与某个 Chrome Target 之间的 CDP 连接。默认情况下，一个 Chrome Tab 对应一个类型为 `page` 的 Target。

关闭 Client 只会断开 CDP 连接，不会关闭 Chrome 或对应的 Tab。

## 安装依赖

```bash
npm install chrome-remote-interface
```

如果通过 `welm-cdp` 使用：

```js
import { getClient, closeClients } from "welm-cdp/client";
```

如果直接使用当前文件：

```js
import { getClient, closeClients } from "./client.js";
```

## 快速开始

```js
import { getClient, closeClients } from "welm-cdp/client";

try {
  const client = await getClient(targetId);

  const result = await client.Runtime.evaluate({
    expression: "document.title",
    returnByValue: true,
  });

  console.log(result.result.value);
} finally {
  await closeClients();
}
```

## 导出方法

### `getClient(targetId, options)`

获取指定 Target 的 CDP Client。

```js
const client = await getClient(targetId);
```

第一次请求某个 Target 时，会通过 `chrome-remote-interface` 创建新连接；后续使用相同 Chrome 地址、端口和 Target ID 请求时，会返回同一个 Client。

```js
const client1 = await getClient(targetId);
const client2 = await getClient(targetId);

console.log(client1 === client2); // true
```

获得 Client 后，可以访问 Chrome DevTools Protocol 的各个 Domain：

```js
const client = await getClient(targetId);

await client.Page.reload({
  ignoreCache: true,
});

const result = await client.Runtime.evaluate({
  expression: "document.readyState",
  returnByValue: true,
});
```

如果 Client 创建失败，错误会继续向调用方抛出，同时对应的失败 Promise 会从缓存中删除。因此，下次调用 `getClient()` 时可以重新尝试连接。

### `closeClients()`

关闭当前缓存中的所有 CDP Client，并清空缓存。

```js
await closeClients();
```

该方法适合在一项完整操作结束时统一调用：

```js
try {
  await runTask();
} finally {
  await closeClients();
}
```

调用 `closeClients()`：

- 会关闭 Node.js 与 Chrome Target 之间的 CDP 连接；
- 会清空内部 Client 缓存；
- 不会关闭 Chrome；
- 不会关闭任何 Chrome Tab；
- 会忽略单个 Client 创建失败或关闭失败，继续处理其他 Client。

缓存清空后，再次调用 `getClient()` 会创建新的 CDP 连接：

```js
const client1 = await getClient(targetId);

await closeClients();

const client2 = await getClient(targetId);

console.log(client1 === client2); // false
```

## Options

`getClient()` 支持以下选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `cdpHost` | `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `9222` | Chrome CDP 服务端口 |

示例：

```js
const client = await getClient(targetId, {
  cdpHost: "127.0.0.1",
  cdpPort: 9333,
});
```

调用 `getClient()` 时使用的地址和端口，必须与启动 Chrome 时设置的 CDP 地址和端口一致。

## Client 缓存

### 缓存 Key

每个 Client 使用下面的字符串作为缓存 Key：

```text
host:port:targetId
```

例如：

```text
127.0.0.1:9222:95ACD3E33B814637A86313C0F721410B
```

因此，以下任意字段不同，都会创建独立 Client：

- `cdpHost`；
- `cdpPort`；
- `targetId`。

### 缓存 Promise

内部缓存的是创建 Client 的 Promise：

```js
Map<clientKey, Promise<CDP.Client>>
```

缓存 Promise 而不是等 Client 创建完成后再缓存，可以避免并发调用重复创建连接：

```js
const [client1, client2] = await Promise.all([
  getClient(targetId),
  getClient(targetId),
]);
```

上面的两个调用会等待同一个创建 Promise，最终获得同一个 Client。

## 自动断开与主动关闭

### 自动断开

Client 创建成功后会监听 `disconnect` 事件：

```js
client.on("disconnect", () => {
  clientPromiseMap.delete(clientKey);
});
```

以下情况可能导致连接自然断开：

- 对应的 Chrome Tab 被关闭；
- Chrome 退出；
- CDP WebSocket 连接中断；
- Client 被主动关闭。

连接断开后，对应缓存会自动删除。下次调用 `getClient()` 时会重新创建连接。

### 主动关闭

如果 Node.js 操作已经结束，但 Chrome 和 Tab 仍然保留，CDP 连接不会自然断开。这时应主动调用：

```js
await closeClients();
```

可以将两种机制理解为：

| 机制 | 作用 |
| --- | --- |
| `disconnect` 事件 | 被动删除已经失效的 Client 缓存 |
| `closeClients()` | 在任务结束时主动关闭所有 CDP 连接 |

两者不会冲突。`closeClients()` 主动关闭 Client 后，也可能触发 `disconnect` 事件；此时缓存已经清空，再次删除不会产生影响。

## 推荐使用方式

### 一项操作复用多个 Client

```js
import { getClient, closeClients } from "welm-cdp/client";

async function main() {
  const firstClient = await getClient(firstTargetId);
  const secondClient = await getClient(secondTargetId);

  await firstClient.Runtime.evaluate({
    expression: "document.title",
  });

  await secondClient.Page.reload();
}

try {
  await main();
} finally {
  await closeClients();
}
```

### 在统一 Runner 中清理

如果项目通过统一的 `run()` 执行任务，可以把 `closeClients()` 放在 `finally` 中：

```js
import { closeClients } from "welm-cdp/client";

export async function run(main) {
  try {
    return await main();
  } finally {
    await closeClients();
  }
}
```

这样业务方法只需要调用 `getClient()`，不需要分别管理每个 Client 的关闭时机。

## 注意事项

- 使用 `getClient()` 前，应先确保 Chrome CDP 服务已经启动。
- `targetId` 必须对应当前 CDP 服务中仍然存在的 Target。
- 相同 `cdpHost`、`cdpPort` 和 `targetId` 会复用同一个 Client。
- Tab 被关闭后，Client 会自然断开并自动从缓存中删除，不需要额外关闭。
- 任务结束但 Tab 继续保留时，应调用 `closeClients()` 主动释放 CDP 连接。
- `closeClients()` 不会关闭 Chrome 或 Tab。
- `closeClients()` 会忽略单个 Client 的创建或关闭错误，因此通常适合放在清理阶段使用。
