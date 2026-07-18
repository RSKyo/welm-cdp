# Web API 清单

用于启动、停止与重载本地 Node.js Web 服务，并通过 CDP 打开对应 Chrome 页面。另提供 Express 路由处理器包装器，用于提取内部选项并统一转交错误。

> 服务入口必须从环境变量读取主机和端口，并提供 `GET /__ready`：当服务真正可用时返回成功 HTTP 状态。

## 导入

```js
import {
  isServerReady,
  startServer,
  stopServer,
  reloadServer,
  startServerAndPage,
} from "welm-cdp/web/launcher";

import { withOptions } from "welm-cdp/web/handler";
```

上述路径需要在 `package.json` 的 `exports` 中公开。

## `web/launcher`

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `isServerReady(options)` | `Promise<boolean>` | 检查 `GET /__ready` 是否可用。 |
| `startServer(path, options)` | `Promise<boolean>` | 确保指定 Node.js 服务已启动并就绪。 |
| `stopServer(options)` | `Promise<string[]>` | 停止监听指定端口的进程。 |
| `reloadServer(path, options)` | `Promise<void>` | 停止、启动服务，并重载对应 Chrome 页面。 |
| `startServerAndPage(path, url, options)` | `Promise<{ url, targetId }>` | 确保服务与 Chrome 页面均已可用，并激活页面。 |

### 公共 `options`

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `serverHost` | `string` | `"localhost"` | 服务主机名，用于传给子进程及构造就绪检测 URL。 |
| `serverPort` | `number` | `3000` | 服务端口，必须为 `1`–`65535` 的整数。 |
| `serverHostField` | `string` | `"serverHost"` | 向服务子进程传递主机名时使用的环境变量名。 |
| `serverPortField` | `string` | `"serverPort"` | 向服务子进程传递端口时使用的环境变量名。 |
| `serverReadyTimeout` | `number` | `20000` | 等待服务就绪的最长时间，单位毫秒。 |
| `serverReadyInterval` | `number` | `200` | 服务未就绪时的轮询间隔，单位毫秒。 |
| `verbose` | `boolean` | `false` | `true` 时，服务子进程继承当前终端的标准输入输出；否则忽略子进程输出。 |
| `silent` | `boolean` | `false` | 传给 WelM 日志模块，抑制过程日志。 |

Chrome 相关方法还会透传 CDP/Chrome 选项，例如 `cdpHost`、`cdpPort`、`targetType`、`chromeBin` 与 `chromeUserDataDir`。

### `isServerReady(options = {})`

向 `http://{serverHost}:{serverPort}/__ready` 发起请求。

- 请求超时固定为 `500ms`。
- 仅当响应的 `ok` 为 `true` 时返回 `true`。
- 连接失败、超时或非成功状态均返回 `false`，不会抛出异常。

```js
const ready = await isServerReady({
  serverPort: 3000,
});
```

### `startServer(absoluteServerFilePath, options = {})`

确保本地服务已运行。

- `absoluteServerFilePath` 必须是存在的普通文件。
- 服务已经就绪时，不会再创建进程，直接返回 `true`。
- 否则会使用当前 Node.js 可执行文件，以分离子进程方式运行该入口文件。
- 启动进程的工作目录是服务入口文件所在目录。
- 子进程会收到由 `serverHostField`、`serverPortField` 指定的环境变量。
- 进程创建后持续检测 `/__ready`；超过 `serverReadyTimeout` 会抛出错误。

```js
await startServer("/absolute/path/to/web/server.js", {
  serverHost: "localhost",
  serverPort: 3000,
});
```

### `stopServer(options = {})`

停止监听 `serverPort` 的进程。

- 使用 `lsof -ti :{port}` 查找 PID，因此当前实现依赖系统提供 `lsof`。
- 对所有找到的 PID 发送 `SIGTERM`。
- 没有进程监听该端口时返回 `[]`。
- 返回已发送 `SIGTERM` 的 PID 字符串数组。
- 它按端口停止进程，**不会**确认该进程是否由 `startServer()` 启动；不要传入正在被其他服务使用的端口。

```js
const stoppedPids = await stopServer({
  serverPort: 3000,
});
```

### `reloadServer(absoluteServerFilePath, options = {})`

依次执行：停止指定端口的进程、启动服务、等待就绪。

若 Chrome 已连接，会查找 URL 中包含 `:{serverPort}/` 的页面，并逐个重载。

```js
await reloadServer("/absolute/path/to/web/server.js", {
  serverPort: 3000,
});
```

### `startServerAndPage(absoluteServerFilePath, url, options = {})`

依次确保服务、Chrome 与请求页面可用，并激活该页面。

```js
const page = await startServerAndPage(
  "/absolute/path/to/web/server.js",
  "http://localhost:3000/",
  { serverPort: 3000 },
);

// { url: "http://localhost:3000/", targetId: "..." }
```

## `web/handler`

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `withOptions(handler)` | `Function` | 包装异步 Express 路由处理器，提取内部选项并转交错误。 |

### `withOptions(handler)`

`handler` 的调用形式为：

```js
async function handler(req, res, options) {
  // ...
}
```

包装后可直接作为 Express 路由处理器使用：

```js
app.post("/api/reload", withOptions(async (req, res, options) => {
  await reloadServer(serverFilePath, options);
  res.json({ ok: true });
}));
```

#### 内部选项规则

`withOptions()` 从 `req.query` 与 `req.body` 中提取以 `__` 开头的字段，去掉前缀后作为第三个参数传入处理器。

| 请求字段 | `options` 中的值 |
| --- | --- |
| `__serverPort=3100` | `options.serverPort === 3100` |
| `__verbose=true` | `options.verbose === true` |
| `__silent=false` | `options.silent === false` |
| `name=radio` | 不会传入 `options` |

特殊行为：

- 数字字符串会转换为 `number`，支持小数与科学计数法。
- `"true"`、`"false"`（不区分大小写）会转换为布尔值。
- 非字符串值保持原值。
- 同名字段同时存在于 query 与 body 时，**body 优先**。
- 字段名仅为 `__` 时会被忽略。
- 处理器抛出或 Promise reject 的任何值都会转为 `Error`，再调用 `next(error)` 交给 Express 错误中间件。