# Runtime API

`welm-cdp/runtime` 在指定 Chrome Target 内执行 JavaScript，并提供轮询等待能力。

```js
import { evaluate, poll } from "welm-cdp/runtime";
```

## API 一览

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `evaluate(targetId, expression, options?)` | `Promise<*>` | 在页面中执行一次 JavaScript 表达式 |
| `poll(targetId, expression, options?)` | `Promise<PollResult>` | 重复执行表达式，直到结果连续满足条件 |

## Options 清单

| 选项 | 类型 | 默认值 | 使用方法 | 说明 |
| --- | --- | --- | --- | --- |
| `cdpHost` | `string` | 保存的 CDP host，否则 `"127.0.0.1"` | 全部方法 | Chrome CDP 服务地址 |
| `cdpPort` | `number` | 保存的 CDP port，否则 `9222` | 全部方法 | Chrome CDP 服务端口 |
| `pollTimeout` | `number` | `30000` | `poll` | 最大轮询时长，毫秒；必须为正有限数 |
| `pollInterval` | `number` | `500` | `poll` | 两次执行间隔，毫秒；必须为正有限数 |
| `matcher` | `(value) => boolean` | 默认真值匹配 | `poll` | 在 Node.js 中执行的同步匹配函数 |
| `matchTimes` | `number` | `1` | `poll` | 所需连续命中次数；必须为正整数 |
| `matchDuration` | `number` | `0` | `poll` | 最短连续命中时长，毫秒；必须为非负有限数 |

## 返回对象

### `PollResult`

```js
{
  value: "complete",
  times: 3,
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `*` | 最后一次成功匹配的表达式结果 |
| `times` | `number` | 总执行次数 |

## API 详情

### `evaluate(targetId, expression, options?)`

```js
const title = await evaluate(targetId, "document.title");
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |
| `expression` | `string` | 在页面上下文执行的 JavaScript 表达式 |

- 使用 options：`cdpHost`、`cdpPort`。
- 表达式返回 Promise 时会自动等待。
- 使用 `returnByValue: true` 返回可序列化结果。
- 页面中的 `undefined` 会返回 JavaScript `undefined`。
- 表达式抛出异常时，转换为 Node.js `Error` 抛出。
- 非可序列化的对象可能只返回 CDP 提供的 `description` 字符串。

### `poll(targetId, expression, options?)`

```js
const result = await poll(targetId, "document.readyState", {
  matcher(value) {
    return value === "complete";
  },
  matchTimes: 3,
  matchDuration: 1000,
});
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |
| `expression` | `string` | 要重复执行的 JavaScript 表达式 |

- 返回 `PollResult`。
- 每次执行都通过 `evaluate()`，因此表达式异常会立即中断轮询。
- 命中必须连续；任意一次不匹配都会重置连续次数与持续时间。
- 同时满足 `matchTimes` 与 `matchDuration` 才会完成。
- 超时后抛出 `poll condition not matched...`。
- 等待不会超过剩余超时时间。

未提供 `matcher` 时，默认规则如下：

| 值 | 是否命中 |
| --- | --- |
| `null`、`undefined`、`false`、`0`、空白字符串 | 否 |
| 其他值，包括对象与数组 | 是 |