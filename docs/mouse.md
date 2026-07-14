# Mouse

`mouse.js` 基于 Chrome DevTools Protocol 的 `Input` Domain 提供鼠标操作，用于：

- 按带有随机偏移和时间间隔的轨迹移动鼠标；
- 将元素滚动到视口内并执行单击；
- 将元素滚动到视口内并执行双击；
- 按 CDP 地址、端口和 Target ID 记录鼠标位置；
- 在 CDP Client 关闭后清理对应的鼠标状态。

鼠标事件直接发送给指定的 Chrome Target。调用这些方法不会关闭 Chrome，也不会关闭对应的 Tab。

## 安装依赖

`mouse.js` 通过项目中的 Client、DOM 和 Target 模块工作。其底层 CDP Client 依赖：

```bash
npm install chrome-remote-interface
```

如果通过 `welm-cdp` 使用：

```js
import {
  removeMouseState,
  mouseMove,
  click,
  doubleClick,
} from "welm-cdp/mouse";
```

如果直接使用当前文件：

```js
import {
  removeMouseState,
  mouseMove,
  click,
  doubleClick,
} from "./mouse.js";
```

## 快速开始

```js
import { click } from "welm-cdp/mouse";

await click(targetId, "button[type='submit']");
```

在一项完整操作结束后，可以同时关闭 CDP Client 并清理鼠标状态：

```js
import { closeClients } from "welm-cdp/client";
import { removeMouseState, click } from "welm-cdp/mouse";

try {
  await click(targetId, "button[type='submit']");
} finally {
  await closeClients(removeMouseState);
}
```

## 导出方法

### `removeMouseState(targetId, options)`

删除指定 Target 的缓存鼠标状态。

```js
const removed = removeMouseState(targetId);
```

返回值为布尔值：

- `true`：找到并删除了对应状态；
- `false`：没有对应的缓存状态。

该方法可以直接作为 `closeClients()` 的回调：

```js
await closeClients(removeMouseState);
```

`closeClients()` 会把每个 Client 对应的 `targetId`、`cdpHost` 和 `cdpPort` 传给 `removeMouseState()`，因此默认和自定义 CDP 地址都能清理正确的状态。

如果手动调用并且该 Target 使用了自定义 CDP 地址或端口，必须传入相同的配置：

```js
removeMouseState(targetId, {
  cdpHost: "127.0.0.1",
  cdpPort: 9333,
});
```

### `mouseMove(targetId, x, y, options)`

将鼠标移动到指定的 viewport 坐标。

```js
await mouseMove(targetId, 480, 320);
```

移动过程不是从起点直接跳到终点，而是生成多个中间点，并在各点之间加入随机延迟。每次成功发送鼠标移动事件后，都会更新该 Target 的鼠标状态。

首次操作某个 Target 时，初始鼠标位置为：

```js
{
  x: 0,
  y: 0,
}
```

坐标相对于页面 viewport，不是整个文档。页面滚动后，同一元素的 viewport 坐标可能发生变化。

方法执行完成后返回 `true`。

### `click(targetId, selector, options)`

单击指定元素。

```js
await click(targetId, "#save");
```

执行顺序如下：

1. 将元素滚动到 viewport 内；
2. 轮询等待元素可点击；
3. 获取元素的尺寸和 viewport 坐标；
4. 在元素中心附近生成随机交互点；
5. 通过模拟轨迹将鼠标移动到交互点；
6. 发送一次 `mousePressed` 和 `mouseReleased` 事件。

元素“可点击”表示它当前可见并且未被 `disabled` 或 `aria-disabled="true"` 禁用。该判断适用于按钮、链接、文本输入框、复选框、单选框等可交互元素。

如果 selector 在调用开始时不存在，滚动操作会直接抛出 `element not found`。如果元素存在但一直不满足可点击条件，则会在轮询超时后抛出错误。

方法执行完成后返回 `true`。

### `doubleClick(targetId, selector, options)`

双击指定元素。

```js
await doubleClick(targetId, ".file-name");
```

元素定位、滚动、可点击检查和鼠标移动过程与 `click()` 相同。随后会发送两组按下和释放事件：

- 第一组事件的 `clickCount` 为 `1`；
- 第二组事件的 `clickCount` 为 `2`。

两次点击分别使用元素中心附近的轻微随机偏移，并在事件之间加入随机延迟。

方法执行完成后返回 `true`。

## Options

所有导出方法都支持 CDP 连接选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `cdpHost` | `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `9222` | Chrome CDP 服务端口 |

示例：

```js
await click(targetId, "#save", {
  cdpHost: "127.0.0.1",
  cdpPort: 9333,
});
```

### 元素选项

`click()` 和 `doubleClick()` 支持以下元素定位和滚动选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `nth` | `0` | 匹配多个元素时使用的索引；负数从末尾开始 |
| `block` | `"center"` | `scrollIntoView()` 的垂直对齐方式 |
| `inline` | `"center"` | `scrollIntoView()` 的水平对齐方式 |
| `behavior` | `"instant"` | `scrollIntoView()` 的滚动行为 |

例如，点击最后一个匹配元素：

```js
await click(targetId, ".result-item", {
  nth: -1,
});
```

### 等待选项

`click()` 和 `doubleClick()` 在等待元素可点击时支持：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `pollTimeout` | `30000` | 最大轮询时间，单位为毫秒 |
| `pollInterval` | `500` | 两次检查之间的间隔，单位为毫秒 |
| `matchTimes` | `1` | 条件需要连续满足的次数 |

```js
await click(targetId, "#submit", {
  pollTimeout: 10000,
  pollInterval: 200,
  matchTimes: 2,
});
```

### 鼠标事件选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `button` | `"left"` | 按下和释放事件使用的鼠标按键 |
| `buttons` | 按事件决定 | 当前按下按键的位掩码 |
| `modifiers` | `0` | CDP 键盘修饰键位掩码 |
| `clickCount` | `1` | 单击事件的点击次数 |

`doubleClick()` 会自行设置两组事件所需的 `buttons` 和 `clickCount`。通常不需要手动传入这两个选项。

## 鼠标状态

每个 Target 使用下面的字符串作为鼠标状态 Key：

```text
host:port:targetId
```

例如：

```text
127.0.0.1:9222:95ACD3E33B814637A86313C0F721410B
```

因此，以下任意字段不同，都会使用独立的鼠标状态：

- `cdpHost`；
- `cdpPort`；
- `targetId`。

状态记录当前 `x`、`y` 坐标和最后更新时间。移动、按下、释放和滚轮事件成功发送后，内部状态都会同步更新。

鼠标状态不会在 `mouse.js` 内监听 Client 的 `disconnect` 事件。Client 生命周期和鼠标状态清理由调用方统一协调：

```js
await closeClients(removeMouseState);
```

## 推荐使用方式

### 连续执行多个鼠标操作

```js
import { click, doubleClick } from "welm-cdp/mouse";

await click(targetId, "#open-dialog");
await doubleClick(targetId, ".dialog .item", {
  nth: 1,
});
await click(targetId, ".dialog .confirm");
```

同一个 Target 的操作会复用 CDP Client 和鼠标位置，后续移动会从上一次记录的位置开始。

### 统一清理

```js
import { closeClients } from "welm-cdp/client";
import { removeMouseState } from "welm-cdp/mouse";

export async function run(main) {
  try {
    return await main();
  } finally {
    await closeClients(removeMouseState);
  }
}
```

## 注意事项

- 使用鼠标方法前，应确保 Chrome CDP 服务和对应 Target 仍然存在。
- `targetId` 必须属于 `cdpHost` 和 `cdpPort` 指向的 CDP 服务。
- `click()` 和 `doubleClick()` 接收 CSS selector。
- 鼠标坐标基于 viewport，元素坐标通过 `getBoundingClientRect()` 获得。
- 鼠标轨迹、交互点和事件间隔包含随机值，因此每次执行可能不同。
- 元素被其它元素遮挡不在当前可点击判断范围内。
- 关闭 CDP Client 不会关闭 Chrome 或 Tab。
- 建议在任务结束时调用 `closeClients(removeMouseState)`，同时释放连接并清理鼠标状态。