# Input API

`welm-cdp/input` 提供键盘事件、编辑命令、剪贴板粘贴与元素文本输入能力。

```js
import * as input from "welm-cdp/input";
```

所有方法的第一个参数都是 `targetId`，返回值均为 `Promise<boolean>`；成功时为 `true`。

## API 一览

### 任意按键与常用按键

| 方法 | 额外参数 | 说明 |
| --- | --- | --- |
| `keyAny(targetId, key, code, options?)` | `key`、`code` | 发送任意一个键盘事件 |
| `keyEnter(targetId, options?)` | — | Enter；固定附带 `"\r\n"` 文本 |
| `keyDelete(targetId, options?)` | — | Delete 与 `Delete` 编辑命令 |
| `keyBackspace(targetId, options?)` | — | Backspace 与 `BackwardDelete` 编辑命令 |

### 光标移动

| 方法 | 说明 |
| --- | --- |
| `focusHome(targetId, options?)` | 移至文档开头 |
| `focusEnd(targetId, options?)` | 移至文档末尾 |
| `focusLineStart(targetId, options?)` | 移至当前行开头 |
| `focusLineEnd(targetId, options?)` | 移至当前行末尾 |
| `focusLeft(targetId, options?)` | 左移一个位置 |
| `focusRight(targetId, options?)` | 右移一个位置 |
| `focusUp(targetId, options?)` | 上移一个位置 |
| `focusDown(targetId, options?)` | 下移一个位置 |

### 文档滚动与编辑快捷操作

| 方法 | 说明 |
| --- | --- |
| `scrollTop(targetId, options?)` | 滚动到文档开头 |
| `scrollBottom(targetId, options?)` | 滚动到文档末尾 |
| `copy(targetId, options?)` | 复制当前选区到系统剪贴板 |
| `paste(targetId, options?)` | 将系统剪贴板粘贴到当前焦点位置 |
| `select(targetId, options?)` | 全选当前编辑上下文 |
| `clear(targetId, options?)` | 全选后删除当前内容 |

### 元素文本输入

| 方法 | 额外参数 | 说明 |
| --- | --- | --- |
| `appendText(targetId, selector, text, options?)` | `selector`、`text` | 滚动、等待可编辑、聚焦到末尾后追加文本 |
| `fillText(targetId, selector, text, options?)` | `selector`、`text` | 滚动、等待可编辑、聚焦、清空后写入文本 |

## Options 清单

### 键盘事件与 CDP 连接

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `cdpHost` | `string` | Chrome CDP 服务地址 |
| `cdpPort` | `number` | Chrome CDP 服务端口 |
| `keyEventWith` | `string \| string[]` | 修饰键：`"alt"`、`"ctrl"`、`"meta"`、`"shift"`，可组合 |
| `keyEventText` | `string` | 随 keyDown 发送的文本；通常只供 `keyAny()` 使用 |
| `keyEventCommands` | `string[]` | CDP editing commands；通常只供 `keyAny()` 使用 |
| `keyEventWindowsVirtualKeyCode` | `number` | Windows virtual key code |
| `keyEventNativeVirtualKeyCode` | `number` | 原生平台 virtual key code |

`keyEventWith` 中的修饰键会先 keyDown、最后按相反顺序 keyUp；即使中途发生错误，也会尽力释放已按下的键。

### `appendText()` 与 `fillText()` 的额外 Options

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `typeLimit` | `number` | `15` | 最多使用真实键盘事件输入的前导 Unicode 字符数；必须为非负整数 |
| `nth` | `number` | `0` | 目标元素索引，支持负数 |
| `pollTimeout`、`pollInterval`、`matchTimes`、`matchDuration` | 见 `dom` | 见 `dom` | 传给滚动与可编辑等待 |

## 重要行为

- 光标、滚动、复制、粘贴、全选等操作的真正动作由 CDP `commands` 完成；按键事件用于模拟相应快捷键。
- 主快捷键在 macOS 是 Meta，在其他平台是 Control。
- `clear()` 先调用 `select()`，再调用 `keyDelete()`。
- `appendText()` 与 `fillText()` 会将 `text` 转为字符串，并按 Unicode code point 处理，不会拆坏 emoji 等代理对字符。
- 文本前一小段会模拟逐字输入；其余文本写入系统剪贴板后通过 `paste()` 粘贴。因此文本输入会改变系统剪贴板内容。
- `fillText()` 不是直接设置 DOM value；它模拟用户编辑流程，依赖元素能够聚焦且通过 `waitElementEditable()`。

## 示例

```js
await keyAny(targetId, "a", "KeyA", {
  keyEventWith: "meta",
});

await fillText(targetId, "textarea", "Hello world", {
  typeLimit: 10,
});

await appendText(targetId, "[contenteditable=true]", "\nNext line");
```