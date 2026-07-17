# Mouse API

`welm-cdp/mouse` 提供带随机轨迹、停顿和轻微偏移的鼠标移动、单击与双击能力。

```js
import {
  removeMouseState,
  mouseMove,
  click,
  doubleClick,
} from "welm-cdp/mouse";
```

## API 一览

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `removeMouseState(targetId, options?)` | `boolean` | 删除该 Target 的已缓存鼠标位置 |
| `mouseMove(targetId, x, y, options?)` | `Promise<boolean>` | 移动鼠标到 viewport 坐标 |
| `click(targetId, selector, options?)` | `Promise<boolean>` | 滚动、等待可点击后模拟单击元素 |
| `doubleClick(targetId, selector, options?)` | `Promise<boolean>` | 滚动、等待可点击后模拟双击元素 |

## Options 清单

| 选项 | 类型 | 默认值 | 使用方法 | 说明 |
| --- | --- | --- | --- | --- |
| `cdpHost` | `string` | 保存的 CDP host，否则 `"127.0.0.1"` | 全部方法 | CDP 服务地址；也是鼠标状态缓存键的一部分 |
| `cdpPort` | `number` | 保存的 CDP port，否则 `9222` | 全部方法 | CDP 服务端口；也是鼠标状态缓存键的一部分 |
| `modifiers` | `number` | `0` | `mouseMove`、`click`、`doubleClick` | CDP 鼠标修饰键位掩码 |
| `button` | `string` | `"left"` | `click` | 单击时使用的鼠标按键 |
| `nth` | `number` | `0` | `click`、`doubleClick` | 目标元素索引，支持负数 |
| `pollTimeout`、`pollInterval`、`matchTimes`、`matchDuration` | 见 `dom` | 见 `dom` | 传给滚动稳定与可点击等待 |
| `positionTolerance` | `number` | `0.5` | `click`、`doubleClick` | 元素滚动稳定判断的 box 容差 |

## API 详情

### `removeMouseState(targetId, options?)`

```js
const removed = removeMouseState(targetId);
```

- 返回是否确实删除了该 Target 的鼠标状态。
- 鼠标状态按 `host:port:targetId` 区分，因此不同 CDP 服务或 Target 相互独立。
- 关闭 CDP client 不会自动删除鼠标状态。如需清理，可将此方法作为 `closeClients()` 的 `onClose` 回调。

```js
await closeClients(removeMouseState);
```

### `mouseMove(targetId, x, y, options?)`

```js
await mouseMove(targetId, 400, 300);
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |
| `x`、`y` | `number` | 目标 viewport 坐标 |

- 从该 Target 上次缓存的位置开始移动；首次移动的起点为 `(0, 0)`。
- 使用多点随机路径，整体耗时约 500–1000ms。
- 移动完成后更新缓存位置。

### `click(targetId, selector, options?)`

```js
await click(targetId, "#submit");
```

- 先调用 `scrollIntoView()`，再等待 `waitElementClickable()`。
- 在元素中心附近随机选择交互点，约 20% 概率再加入最多 2px 的轻微偏移。
- 移动到交互点后发送一次按下与释放事件。
- 返回 `true` 不代表页面导航、请求或动画已经完成。

### `doubleClick(targetId, selector, options?)`

```js
await doubleClick(targetId, ".file");
```

- 前置等待与 `click()` 相同。
- 发送两次按下与释放事件，`clickCount` 分别为 `1` 和 `2`。
- 两次点击各自使用中心附近的随机交互点。