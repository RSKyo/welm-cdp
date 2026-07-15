# Input

`input.js` 基于 Chrome DevTools Protocol 的 `Input` Domain 提供键盘输入和文本编辑能力，用于：

- 向指定 Chrome Target 发送任意按键；
- 发送 Enter、Delete 和 Backspace；
- 移动文本编辑光标；
- 滚动到文档顶部或底部；
- 执行复制、粘贴、全选和清空；
- 向可编辑元素追加文本；
- 替换可编辑元素的全部文本。

部分操作会同时发送模拟按键和 CDP Editing Command。真正执行复制、粘贴、全选、删除和光标移动等操作的是 `commands`；按键事件用于模拟对应的物理键盘操作。

这些方法只向页面发送输入事件，不会关闭 Chrome，也不会关闭对应的 Tab。

## 安装依赖

`input.js` 通过项目中的 Client、DOM 和 Clipboard 模块工作。底层 CDP Client 依赖：

```bash
npm install chrome-remote-interface
```

如果通过 `welm-cdp` 使用：

```js
import {
  keyAny,
  keyEnter,
  keyDelete,
  keyBackspace,
  focusHome,
  focusEnd,
  focusLineStart,
  focusLineEnd,
  focusLeft,
  focusRight,
  focusUp,
  focusDown,
  scrollTop,
  scrollBottom,
  copy,
  paste,
  select,
  clear,
  appendText,
  fillText,
} from "welm-cdp/input";
```

如果直接使用当前文件：

```js
import {
  keyEnter,
  appendText,
  fillText,
} from "./input.js";
```

## 快速开始

填写文本框：

```js
import { fillText, keyEnter } from "welm-cdp/input";

await fillText(targetId, "#message", "Hello world");
await keyEnter(targetId);
```

在任务结束后统一关闭 CDP Client：

```js
import { closeClients } from "welm-cdp/client";
import { fillText } from "welm-cdp/input";

try {
  await fillText(targetId, "#message", "Hello world");
} finally {
  await closeClients();
}
```

关闭 Client 只会断开 CDP 连接，不会关闭 Chrome 或页面。

## Key

### `keyAny(targetId, key, code, options)`

发送任意按键。

```js
await keyAny(targetId, "Escape", "Escape");
```

`key` 和 `code` 对应 DOM KeyboardEvent 的同名字段。可以通过 options 同时提供文本、Editing Command、修饰键和虚拟键码。

例如发送 Shift+Tab：

```js
await keyAny(targetId, "Tab", "Tab", {
  keyEventWith: "shift",
});
```

方法完成后返回 `true`。

### `keyEnter(targetId, options)`

发送 Enter 键。

```js
await keyEnter(targetId);
```

该方法发送：

```js
{
  key: "Enter",
  code: "Enter",
  text: "\r\n",
}
```

`text` 用于让 Enter 在 textarea、contenteditable 等可编辑元素中产生换行。

方法完成后返回 `true`。

### `keyDelete(targetId, options)`

发送 Delete 键并执行 `Delete` Editing Command。

```js
await keyDelete(targetId);
```

方法完成后返回 `true`。

### `keyBackspace(targetId, options)`

发送 Backspace 键并执行 `BackwardDelete` Editing Command。

```js
await keyBackspace(targetId);
```

方法完成后返回 `true`。

## Cursor

光标方法作用于页面当前的编辑上下文。调用前应先让目标输入框、textarea 或 contenteditable 元素获得焦点。

### `focusHome(targetId, options)`

将编辑光标移动到文档开头。

```js
await focusHome(targetId);
```

使用 `MoveToBeginningOfDocument` Editing Command。

### `focusEnd(targetId, options)`

将编辑光标移动到文档末尾。

```js
await focusEnd(targetId);
```

使用 `MoveToEndOfDocument` Editing Command。

### `focusLineStart(targetId, options)`

将编辑光标移动到当前行开头。

```js
await focusLineStart(targetId);
```

使用 `MoveToBeginningOfLine` Editing Command。

### `focusLineEnd(targetId, options)`

将编辑光标移动到当前行末尾。

```js
await focusLineEnd(targetId);
```

使用 `MoveToEndOfLine` Editing Command。

### `focusLeft(targetId, options)`

将编辑光标向左移动一个位置。

```js
await focusLeft(targetId);
```

使用 `MoveLeft` Editing Command。

### `focusRight(targetId, options)`

将编辑光标向右移动一个位置。

```js
await focusRight(targetId);
```

使用 `MoveRight` Editing Command。

### `focusUp(targetId, options)`

将编辑光标向上移动。

```js
await focusUp(targetId);
```

使用 `MoveUp` Editing Command。

### `focusDown(targetId, options)`

将编辑光标向下移动。

```js
await focusDown(targetId);
```

使用 `MoveDown` Editing Command。

以上光标方法完成后均返回 `true`。

## Scroll

### `scrollTop(targetId, options)`

滚动到文档顶部。

```js
await scrollTop(targetId);
```

使用 `ScrollToBeginningOfDocument` Editing Command，并同时模拟当前平台的主修饰键和 ArrowUp。

### `scrollBottom(targetId, options)`

滚动到文档底部。

```js
await scrollBottom(targetId);
```

使用 `ScrollToEndOfDocument` Editing Command，并同时模拟当前平台的主修饰键和 ArrowDown。

两个方法完成后均返回 `true`。

## Shortcuts

快捷操作会根据 Node.js 当前运行平台选择主修饰键：

| 平台 | 主修饰键 |
| --- | --- |
| macOS | `meta`，即 Command |
| Windows、Linux 和其它平台 | `ctrl`，即 Control |

### `copy(targetId, options)`

将当前选中内容复制到系统剪贴板。

```js
await copy(targetId);
```

该方法模拟平台复制快捷键，并执行 `Copy` Editing Command。

### `paste(targetId, options)`

将系统剪贴板中的文本粘贴到当前编辑位置。

```js
await paste(targetId);
```

该方法模拟平台粘贴快捷键，并执行 `Paste` Editing Command。

### `select(targetId, options)`

选择当前编辑上下文中的全部内容。

```js
await select(targetId);
```

该方法模拟平台全选快捷键，并执行 `SelectAll` Editing Command。

### `clear(targetId, options)`

清空当前编辑上下文中的内容。

```js
await clear(targetId);
```

执行顺序如下：

1. 调用 `select()` 选择全部内容；
2. 等待一段随机时间；
3. 调用 `keyDelete()` 删除选中内容。

以上快捷操作完成后均返回 `true`。

## Text Input

### `appendText(targetId, selector, text, options)`

在指定可编辑元素的现有内容末尾追加文本。

```js
await appendText(
  targetId,
  "#message",
  " appended text",
);
```

执行顺序如下：

1. 将元素滚动到 viewport 内；
2. 轮询等待元素可编辑；
3. 让元素获得焦点；
4. 将编辑光标移动到内容末尾；
5. 输入文本。

如果 selector 在调用开始时不存在，`scrollIntoView()` 会直接抛出 `element not found`。如果元素存在但一直不可编辑，则会在轮询超时后抛出错误。

方法完成后返回 `true`。

### `fillText(targetId, selector, text, options)`

使用指定文本替换可编辑元素的全部内容。

```js
await fillText(
  targetId,
  "#message",
  "replacement text",
);
```

执行顺序如下：

1. 将元素滚动到 viewport 内；
2. 轮询等待元素可编辑；
3. 让元素获得焦点；
4. 选择并删除原有内容；
5. 输入新文本。

`text` 会通过 `String(text)` 转换为字符串。

如果 selector 在调用开始时不存在，`scrollIntoView()` 会直接抛出 `element not found`。如果元素存在但一直不可编辑，则会在轮询超时后抛出错误。

方法完成后返回 `true`。

## 文本输入方式

`appendText()` 和 `fillText()` 不会逐个按键输入全部文本。内部会把文本分成两部分：

1. 从文本开头随机选择一部分字符，通过 CDP 按键事件逐个输入；
2. 将剩余文本写入系统剪贴板，再通过 `paste()` 粘贴。

默认最多从前 `15` 个 Unicode 字符中选择逐个输入的部分：

```js
await fillText(targetId, "#message", text, {
  typeLimit: 15,
});
```

实际逐个输入的字符数量是：

```text
min(5, max) 到 max 之间的随机整数
```

其中：

```js
max = Math.min(characters.length, typeLimit);
```

设置 `typeLimit: 0` 可以跳过逐字符输入，直接粘贴全部文本：

```js
await fillText(targetId, "#message", text, {
  typeLimit: 0,
});
```

`typeLimit` 必须是非负整数，否则抛出：

```text
typeLimit must be a non-negative integer
```

文本通过 `Array.from()` 按 Unicode code point 拆分，避免把 Emoji 等代理对字符从中间截断。

### 剪贴板影响

当存在需要粘贴的剩余文本时，`input.js` 会调用：

```js
await writeClipboardText(remainingText);
```

这会覆盖系统剪贴板当前的文本内容。输入完成后不会自动恢复原来的剪贴板内容。

## Options

### CDP Options

所有导出方法都支持：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `cdpHost` | `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `9222` | Chrome CDP 服务端口 |

```js
await keyEnter(targetId, {
  cdpHost: "127.0.0.1",
  cdpPort: 9333,
});
```

### Key Event Options

`keyAny()` 可以使用以下按键事件选项。其它方法也会向内部按键方法传递 options，但可能根据自身功能覆盖其中部分字段。

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `keyEventWith` | 无 | 一个修饰键名称或修饰键名称数组 |
| `keyEventText` | 无 | 随按键事件发送的文本 |
| `keyEventCommands` | 无 | 随按键事件执行的 CDP Editing Command 数组 |
| `keyEventWindowsVirtualKeyCode` | 无 | Windows 虚拟键码 |
| `keyEventNativeVirtualKeyCode` | 无 | 原生虚拟键码 |

支持的修饰键名称：

```text
alt
ctrl
meta
shift
```

可以传入一个修饰键：

```js
await keyAny(targetId, "a", "KeyA", {
  keyEventWith: "ctrl",
});
```

也可以传入多个修饰键：

```js
await keyAny(targetId, "s", "KeyS", {
  keyEventWith: ["ctrl", "shift"],
});
```

无效的修饰键会抛出错误。

### Text Input Options

`appendText()` 和 `fillText()` 支持：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `typeLimit` | `15` | 最多允许多少个开头字符参与随机逐字符输入 |

### DOM Options

`appendText()` 和 `fillText()` 会将以下选项传递给 DOM 方法：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `nth` | `0` | 匹配多个元素时使用的索引；负数从末尾开始 |
| `block` | `"center"` | `scrollIntoView()` 的垂直对齐方式 |
| `inline` | `"center"` | `scrollIntoView()` 的水平对齐方式 |
| `behavior` | `"instant"` | `scrollIntoView()` 的滚动行为 |

### Poll Options

等待元素可编辑时支持：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `pollTimeout` | `30000` | 最大轮询时间，单位为毫秒 |
| `pollInterval` | `500` | 两次检查之间的等待时间，单位为毫秒 |
| `matchTimes` | `1` | 可编辑条件需要连续满足的次数 |

```js
await fillText(targetId, "#message", text, {
  pollTimeout: 10000,
  pollInterval: 200,
  matchTimes: 2,
});
```

## 按键释放和错误处理

内部按键方法会按顺序：

1. 按下所有修饰键；
2. 按下主按键并执行 Editing Command；
3. 释放主按键；
4. 按相反顺序释放修饰键。

主操作发生错误后，方法仍会尝试释放主按键和所有修饰键。单个按键释放失败不会阻止其它修饰键继续释放。

如果主操作和释放操作都发生错误，优先抛出最先捕获的主操作错误。

## Options 对象

公开方法通过对象展开语法创建新的内部 options：

```js
{
  ...options,
  keyEventCommands: ["Copy"],
}
```

因此，方法不会删除或修改调用方传入的 options 属性。某个方法添加的 `keyEventText`、`keyEventWith` 或 `keyEventCommands` 只存在于该次内部调用中，不会自动带入下一次操作。

## 推荐使用方式

### 填写并提交表单

```js
import {
  fillText,
  keyEnter,
} from "welm-cdp/input";

await fillText(targetId, "#username", "user@example.com");
await fillText(targetId, "#password", "password");
await keyEnter(targetId);
```

### 编辑已有文本

```js
import {
  appendText,
  focusLeft,
  keyBackspace,
} from "welm-cdp/input";

await appendText(targetId, "#title", " draft");
await focusLeft(targetId);
await keyBackspace(targetId);
```

## 注意事项

- `targetId` 必须属于 `cdpHost` 和 `cdpPort` 指向的 CDP 服务。
- 光标、复制、粘贴、全选和清空操作作用于当前获得焦点的编辑上下文。
- `appendText()` 和 `fillText()` 接收 CSS selector。
- 文本元素必须满足 `waitElementEditable()` 的可编辑条件。
- `appendText()` 和 `fillText()` 可能覆盖系统剪贴板文本。
- `typeLimit` 必须是非负整数。
- 文本按 Unicode code point 拆分，但一个由多个 code point 组成的复合字形仍可能被分成多个按键事件。
- Editing Command 执行实际编辑动作，模拟按键用于表现对应的物理快捷键。
- 调用方传入的 options 对象不会被修改。
- 建议在完整任务结束后调用 `closeClients()` 释放 CDP 连接。