# Runtime

`runtime.js` 基于 Chrome DevTools Protocol 的 Runtime Domain，在指定 Chrome Target 的页面上下文中执行 JavaScript，并提供通用轮询能力。

主要功能：

- 在页面上下文中执行 JavaScript 表达式；
- 等待表达式返回的 Promise；
- 将浏览器中的异常转换为 Node.js `Error`；
- 重复执行表达式，直到返回值满足 matcher；
- 支持连续匹配多次后再返回；
- 返回最终匹配值和表达式执行次数。

## 导入

如果通过 `welm-cdp` 使用：

```js
import { evaluate, poll } from "welm-cdp/runtime";
```

如果直接使用当前文件：

```js
import { evaluate, poll } from "./runtime.js";
```

## 快速开始

```js
import { evaluate, poll } from "welm-cdp/runtime";

const title = await evaluate(
  targetId,
  "document.title",
);

const result = await poll(
  targetId,
  "document.readyState",
  {
    matcher(value) {
      return value === "complete";
    },
  },
);

console.log(title);
console.log(result.value);
console.log(result.times);
```

## `evaluate(targetId, expression, options)`

在指定 Chrome Target 的页面上下文中执行 JavaScript 表达式。

```js
const title = await evaluate(
  targetId,
  "document.title",
);
```

### 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |
| `expression` | `string` | 需要执行的 JavaScript 表达式 |
| `options` | `Object` | 可选的 Runtime 和 CDP 配置 |

CDP 连接配置：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `cdpHost` | `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `9222` | Chrome CDP 服务端口 |

### 执行配置

表达式通过以下 Runtime 参数执行：

```js
{
  expression,
  returnByValue: true,
  awaitPromise: true
}
```

其中：

- `returnByValue: true`：尽量将结果作为普通 JavaScript 值返回；
- `awaitPromise: true`：如果表达式返回 Promise，等待 Promise 完成后再返回结果。

### 返回值

普通值会直接返回：

```js
const count = await evaluate(
  targetId,
  "document.querySelectorAll('.item').length",
);

console.log(count); // 5
```

对象和数组在可以序列化时也会按值返回：

```js
const value = await evaluate(
  targetId,
  `({
    title: document.title,
    url: location.href,
  })`,
);
```

表达式结果为 `undefined` 时，返回 JavaScript 的 `undefined`：

```js
const value = await evaluate(
  targetId,
  "undefined",
);

console.log(value); // undefined
```

当 Runtime 结果没有可直接返回的 `value` 时，方法会返回其 `description`。

### 等待 Promise

表达式可以返回 Promise：

```js
const value = await evaluate(
  targetId,
  `new Promise((resolve) => {
    setTimeout(() => resolve("ready"), 500);
  })`,
);
```

方法会等待 Promise 完成，最终返回：

```text
ready
```

### 异常处理

页面表达式抛出异常时，`evaluate()` 会读取：

```js
exceptionDetails.exception?.description
```

如果没有 description，则使用：

```js
exceptionDetails.text
```

并在 Node.js 中抛出新的 `Error`：

```js
await evaluate(
  targetId,
  `(() => {
    throw new Error("failed");
  })()`,
);
```

Runtime 没有返回结果时抛出：

```text
missing evaluation result
```

## `poll(targetId, expression, options)`

重复执行 JavaScript 表达式，直到返回值满足 matcher 条件。

```js
const result = await poll(
  targetId,
  "document.readyState",
  {
    matcher(value) {
      return value === "complete";
    },
  },
);
```

### 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |
| `expression` | `string` | 需要重复执行的 JavaScript 表达式 |
| `options` | `Object` | 可选的轮询、Runtime 和 CDP 配置 |

### Options

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `pollTimeout` | `30000` | 最大轮询时间，单位为毫秒 |
| `pollInterval` | `500` | 两次表达式执行之间的等待时间，单位为毫秒 |
| `matcher` | 默认 matcher | 判断表达式返回值是否匹配的同步函数 |
| `matchTimes` | `1` | matcher 需要连续命中的次数 |
| `cdpHost` | `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `9222` | Chrome CDP 服务端口 |

示例：

```js
const result = await poll(
  targetId,
  "document.readyState",
  {
    pollTimeout: 10000,
    pollInterval: 200,

    matcher(value) {
      return value === "complete";
    },
  },
);
```

### 返回值

匹配成功后返回：

```js
{
  value,
  times
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `*` | 最终满足 matcher 条件的表达式返回值 |
| `times` | `number` | 从开始到匹配成功总共执行 expression 的次数 |

示例：

```js
const result = await poll(
  targetId,
  "document.querySelectorAll('.item').length",
  {
    matcher(value) {
      return value >= 5;
    },
  },
);

console.log(result);
// {
//   value: 5,
//   times: 4
// }
```

`matchedTimes` 只用于内部记录连续命中次数，不包含在返回结果中。

## Matcher

### 自定义 matcher

matcher 接收表达式本次执行的返回值，并返回布尔值：

```js
const result = await poll(
  targetId,
  "document.title",
  {
    matcher(value) {
      return value.includes("Ready");
    },
  },
);
```

matcher 在 Node.js 中执行，不是在页面上下文中执行。当前实现不会等待 matcher 返回的 Promise，因此 matcher 应当是同步函数。

matcher 抛出的异常会直接向调用方继续抛出。

### 默认 matcher

没有提供 matcher 时，使用默认规则：

| 返回值 | 是否匹配 |
| --- | --- |
| `null` | 否 |
| `undefined` | 否 |
| `false` | 否 |
| `0` | 否 |
| `""` | 否 |
| 仅包含空白的字符串 | 否 |
| 非零数字 | 是 |
| 非空字符串 | 是 |
| 对象 | 是 |
| 数组 | 是 |
| `true` | 是 |

例如：

```js
const result = await poll(
  targetId,
  "document.querySelector('#result') !== null",
);
```

表达式返回 `true` 时匹配成功。

## 连续匹配

`matchTimes` 用于要求 matcher 连续命中多次，适合等待状态稳定。

```js
const result = await poll(
  targetId,
  "document.querySelectorAll('.item').length",
  {
    matchTimes: 3,

    matcher(value) {
      return value >= 5;
    },
  },
);
```

内部状态变化示例：

| 执行结果 | matcher | 连续命中次数 |
| --- | --- | --- |
| `5` | `true` | 1 |
| `5` | `true` | 2 |
| `4` | `false` | 重置为 0 |
| `5` | `true` | 1 |
| `5` | `true` | 2 |
| `5` | `true` | 3，返回结果 |

matcher 一旦没有命中，连续命中次数会重置为 `0`。

## 超时和间隔

`pollTimeout` 从开始轮询时计算，包含：

- 表达式执行时间；
- matcher 执行时间；
- 每次轮询之间的等待时间。

实现内部会将 `pollTimeout` 和 `pollInterval` 分别保存为 `timeout` 和 `interval`。每次等待前都会计算剩余时间：

```js
const remaining = timeout - (Date.now() - start);
```

实际等待时间不会超过剩余超时时间：

```js
await sleep(Math.min(interval, remaining));
```

超时后抛出的异常包含 timeout、interval 和实际经过时间：

```text
poll condition not matched: timeout=30000ms, interval=500ms, elapsed=30000ms
```

## 与 DOM 等待方法的关系

`dom.js` 中的所有等待方法都建立在 `poll()` 之上，例如：

```js
const result = await waitElementTextEquals(
  targetId,
  "#status",
  "Ready",
);

console.log(result.value);
console.log(result.times);
```

因此，DOM 等待方法也统一返回：

```js
{
  value,
  times
}
```

## Client 生命周期

`evaluate()` 通过 `client.js` 的 `getClient()` 获取并复用 CDP Client。

`runtime.js` 不会在每次表达式执行后关闭 Client，因为轮询和连续操作需要复用连接。应在一项完整任务结束后统一清理：

```js
import { closeClients } from "welm-cdp/client";

try {
  await main();
} finally {
  await closeClients();
}
```

关闭 Client 只会断开 CDP 连接，不会关闭 Chrome 或页面。

## 注意事项

- `expression` 在目标页面的 JavaScript 上下文中执行。
- 表达式应尽量返回可以序列化的普通值、数组或对象。
- 页面表达式抛出的异常会终止 `evaluate()` 和当前轮询。
- matcher 在 Node.js 中执行，并且应当是同步函数。
- matcher 没有命中时，连续命中次数会重置为 `0`。
- `matchTimes` 建议使用大于或等于 `1` 的整数。
- `pollInterval` 应使用非负数。
- `pollTimeout` 应使用正数。
- `poll()` 超时不会自动关闭正在复用的 CDP Client。