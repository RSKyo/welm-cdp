# DOM

`dom.js` 基于 Chrome DevTools Protocol 的 Runtime 能力，在指定 Chrome Target 中执行 DOM 查询、读取、聚焦、滚动和等待操作。

主要功能：

- 使用 CSS Selector 查询页面元素；
- 使用 `nth` 选择同一 Selector 匹配的指定元素；
- 读取元素属性、文本、HTML 和位置；
- 聚焦元素或将元素滚动到视口中；
- 等待元素出现、消失、可见、可编辑或可点击；
- 等待元素文本或元素数量满足指定条件。

## 导入

如果通过 `welm-cdp` 使用：

```js
import {
  focus,
  scrollIntoView,
  hasElement,
  getElementInnerText,
  waitElementAppear,
  waitElementVisible,
} from "welm-cdp/dom";
```

如果直接使用当前文件：

```js
import {
  focus,
  hasElement,
  waitElementAppear,
} from "./dom.js";
```

## 快速开始

```js
import {
  focus,
  getElementInnerText,
  waitElementVisible,
} from "welm-cdp/dom";

await waitElementVisible(targetId, "#search");
await focus(targetId, "#search");

const text = await getElementInnerText(
  targetId,
  "#result",
);

console.log(text);
```

所有方法的第一个参数都是 `targetId`。它表示需要执行 DOM 操作的 Chrome Target。

## 元素选择

### CSS Selector

元素通过 `document.querySelectorAll()` 查询，因此 `selector` 使用标准 CSS Selector：

```js
await hasElement(targetId, "#dialog");
await hasElement(targetId, ".item");
await hasElement(targetId, "button[data-action='save']");
```

无效的 CSS Selector 会由浏览器抛出异常。

### `nth`

当 Selector 匹配多个元素时，可以通过 `options.nth` 选择其中一个。

默认选择第一个元素：

```js
const text = await getElementInnerText(
  targetId,
  ".item",
);
```

选择第二个元素：

```js
const text = await getElementInnerText(
  targetId,
  ".item",
  {
    nth: 1,
  },
);
```

负数从末尾开始选择：

```js
const text = await getElementInnerText(
  targetId,
  ".item",
  {
    nth: -1,
  },
);
```

常见值：

| `nth` | 选择结果 |
| --- | --- |
| `0` | 第一个元素 |
| `1` | 第二个元素 |
| `-1` | 最后一个元素 |
| `-2` | 倒数第二个元素 |

`nth` 必须是整数，否则抛出：

```text
nth must be an integer
```

## DOM 操作

### `focus(targetId, selector, options)`

聚焦指定元素，成功后返回 `true`。

```js
await focus(targetId, "#search");
```

选择指定位置的元素：

```js
await focus(targetId, ".input", {
  nth: -1,
});
```

元素不存在或 `nth` 超出范围时会抛出异常。

### `scrollIntoView(targetId, selector, options)`

调用元素的 `scrollIntoView()`，成功后返回 `true`。

```js
await scrollIntoView(targetId, "#result");
```

默认配置：

```js
{
  block: "center",
  inline: "center",
  behavior: "instant"
}
```

自定义滚动行为：

```js
await scrollIntoView(targetId, "#result", {
  block: "start",
  inline: "nearest",
  behavior: "smooth",
});
```

### `hasElement(targetId, selector, options)`

检查指定元素是否存在。

```js
const exists = await hasElement(
  targetId,
  "#dialog",
);
```

返回值：

- 元素存在：`true`；
- 元素不存在或 `nth` 超出范围：`false`。

### `getElementsCount(targetId, selector, options)`

返回匹配 Selector 的元素总数。

```js
const count = await getElementsCount(
  targetId,
  ".item",
);
```

该方法统计全部匹配元素，不使用 `options.nth`。

### `getElementAttribute(targetId, selector, name, options)`

读取元素的指定属性。

```js
const href = await getElementAttribute(
  targetId,
  "a",
  "href",
);
```

元素没有该属性时抛出：

```text
attribute not found
```

### `getElementAttributes(targetId, selector, options)`

读取元素的全部属性，以普通对象返回。

```js
const attributes = await getElementAttributes(
  targetId,
  "#search",
);
```

示例返回值：

```js
{
  id: "search",
  type: "text",
  placeholder: "Search"
}
```

### `getElementInnerText(targetId, selector, options)`

返回元素的 `innerText`。

```js
const text = await getElementInnerText(
  targetId,
  "#result",
);
```

### `getElementInnerHTML(targetId, selector, options)`

返回元素的 `innerHTML`。

```js
const html = await getElementInnerHTML(
  targetId,
  "#result",
);
```

### `getElementOuterHTML(targetId, selector, options)`

返回元素的 `outerHTML`，其中包含元素自身标签。

```js
const html = await getElementOuterHTML(
  targetId,
  "#result",
);
```

### `getElementBox(targetId, selector, options)`

返回元素相对于浏览器视口的位置和尺寸。

```js
const box = await getElementBox(
  targetId,
  "#submit",
);
```

返回结构：

```js
{
  x: 100,
  y: 200,
  width: 120,
  height: 36,
  centerX: 160,
  centerY: 218
}
```

坐标来自 `getBoundingClientRect()`，相对于视口，而不是整个页面。

### `getElementCenter(targetId, selector, options)`

返回元素相对于视口的中心点。

```js
const point = await getElementCenter(
  targetId,
  "#submit",
);
```

返回结构：

```js
{
  x: 160,
  y: 218
}
```

该坐标可以交给 Mouse 相关方法使用。

## 等待元素状态

所有等待方法都通过 `poll()` 重复执行检查，直到条件满足或轮询超时。传入的轮询配置会继续传递给 `poll()`。

等待方法统一返回：

```js
{
  value,
  times
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `value` | 最终满足 matcher 条件的表达式返回值 |
| `times` | 从开始到匹配成功总共执行 expression 的次数 |

### `waitElementAppear(targetId, selector, options)`

等待指定元素出现。

```js
await waitElementAppear(targetId, "#dialog");
```

元素存在时匹配成功，返回结果中的 `value` 为 `true`。

### `waitElementDisappear(targetId, selector, options)`

等待指定元素消失。

```js
await waitElementDisappear(
  targetId,
  ".loading",
);
```

元素不存在时匹配成功，返回结果中的 `value` 为 `false`。

### `waitElementVisible(targetId, selector, options)`

等待元素变为可见。

```js
await waitElementVisible(targetId, "#dialog");
```

当前实现要求同时满足：

- 元素存在；
- `display` 不是 `none`；
- `visibility` 不是 `hidden`；
- `opacity` 不是 `0`；
- 宽度大于 `0`；
- 高度大于 `0`。

### `waitElementEditable(targetId, selector, options)`

等待元素变为可编辑。

```js
await waitElementEditable(
  targetId,
  "#message",
);
```

元素首先必须可见，并且不能设置：

```text
aria-disabled="true"
aria-readonly="true"
```

当前实现将以下元素视为可编辑：

- `contenteditable` 元素；
- 未禁用且非只读的 `textarea`；
- 未禁用、非只读，并且属于可编辑类型的 `input`。

以下 `input` 类型不视为可编辑：

```text
button
checkbox
color
file
hidden
image
radio
range
reset
submit
```

### `waitElementClickable(targetId, selector, options)`

等待元素变为可点击。

```js
await waitElementClickable(
  targetId,
  "#submit",
);
```

当前实现要求：

- 元素存在且可见；
- 元素没有设置 `disabled`；
- 元素没有设置 `aria-disabled="true"`。

文本输入框、按钮、单选框、复选框、下拉框和链接等元素都可以被判断为可点击。只读文本框仍然可以点击，但不会被判断为可编辑。

## 等待元素文本

文本等待方法读取：

```js
(el.innerText ?? el.textContent ?? "").trim()
```

元素不存在时返回 `null`；元素存在但文本为空时返回空字符串。这两个状态不会混淆。

### `waitElementTextIncludes(targetId, selector, expectedText, options)`

等待元素文本包含指定内容。

```js
const result = await waitElementTextIncludes(
  targetId,
  "#status",
  "Ready",
);

console.log(result.value);
```

成功后，`result.value` 是匹配到的完整元素文本。

### `waitElementTextEquals(targetId, selector, expectedText, options)`

等待元素文本与指定内容完全相等。

```js
const result = await waitElementTextEquals(
  targetId,
  "#status",
  "Ready",
);

console.log(result.value);
```

可以使用空字符串等待一个已经存在但文本为空的元素：

```js
await waitElementTextEquals(
  targetId,
  "#status",
  "",
);
```

### `waitElementTextRegex(targetId, selector, pattern, options)`

等待元素文本匹配正则表达式。

```js
const result = await waitElementTextRegex(
  targetId,
  "#status",
  "^Ready",
);

console.log(result.value);
```

`pattern` 会用于创建 `RegExp`：

```js
const re = new RegExp(pattern);
```

每次匹配前都会将 `lastIndex` 重置为 `0`。

## 等待元素数量

元素数量通过 `document.querySelectorAll(selector).length` 获取。下列方法成功后，返回结果中的 `value` 是当前匹配到的元素数量。

### `waitElementCountEquals(targetId, selector, expectedCount, options)`

等待元素数量等于指定值。

```js
const result = await waitElementCountEquals(
  targetId,
  ".item",
  5,
);

console.log(result.value);
```

### `waitElementCountGreater(targetId, selector, expectedCount, options)`

等待元素数量大于指定值。

```js
await waitElementCountGreater(
  targetId,
  ".item",
  0,
);
```

### `waitElementCountGreaterEquals(targetId, selector, expectedCount, options)`

等待元素数量大于或等于指定值。

```js
await waitElementCountGreaterEquals(
  targetId,
  ".item",
  5,
);
```

### `waitElementCountLess(targetId, selector, expectedCount, options)`

等待元素数量小于指定值。

```js
await waitElementCountLess(
  targetId,
  ".loading",
  1,
);
```

### `waitElementCountLessEquals(targetId, selector, expectedCount, options)`

等待元素数量小于或等于指定值。

```js
await waitElementCountLessEquals(
  targetId,
  ".item",
  5,
);
```

### `waitElementCountNotEquals(targetId, selector, expectedCount, options)`

等待元素数量不等于指定值。

```js
await waitElementCountNotEquals(
  targetId,
  ".item",
  0,
);
```

## 严格解析与安全解析

模块内部使用两种元素解析方式。

### 严格解析

以下方法要求元素必须存在：

- `focus`；
- `scrollIntoView`；
- `getElementAttribute`；
- `getElementAttributes`；
- `getElementInnerText`；
- `getElementInnerHTML`；
- `getElementOuterHTML`；
- `getElementBox`；
- `getElementCenter`。

元素不存在时抛出：

```text
element not found
```

`nth` 超出范围时抛出：

```text
element index out of range: INDEX
```

### 安全解析

以下方法在元素不存在或 `nth` 超出范围时不会立即抛出异常：

- `hasElement`；
- 所有 `waitElement...` 方法。

在单次检查中，它们会使用 `false` 或 `null` 表示元素尚未满足条件，让 `poll()` 继续轮询。

## Options

### DOM Options

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `nth` | `0` | 选择匹配结果中的指定元素，支持负数 |
| `block` | `"center"` | `scrollIntoView` 的垂直对齐方式 |
| `inline` | `"center"` | `scrollIntoView` 的水平对齐方式 |
| `behavior` | `"instant"` | `scrollIntoView` 的滚动行为 |

CDP 连接选项和轮询选项会继续传递给 `runtime.js`。

### Poll Options

所有 `waitElement...` 方法都支持以下轮询选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `pollTimeout` | `30000` | 最大轮询时间，单位为毫秒 |
| `pollInterval` | `500` | 两次检查之间的等待时间，单位为毫秒 |
| `matchTimes` | `1` | 条件需要连续满足的次数 |

各个 DOM 等待方法会提供自己的 matcher，因此调用方通常不需要传入 `matcher`。

示例：

```js
await waitElementClickable(
  targetId,
  "#submit",
  {
    pollTimeout: 10000,
    pollInterval: 200,
    matchTimes: 2,
  },
);
```

### CDP Options

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `cdpHost` | `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `9222` | Chrome CDP 服务端口 |

## 注意事项

- `selector` 必须是有效的 CSS Selector。
- `nth` 从 `0` 开始，负数从匹配结果末尾开始选择。
- `getElementBox` 和 `getElementCenter` 返回的是视口坐标，不是页面绝对坐标。
- `waitElementVisible` 只检查样式和元素尺寸，不检查元素是否被其他元素遮挡。
- `waitElementClickable` 不检查元素是否被其他元素遮挡。
- `waitElementEditable` 只将文本输入类元素和 `contenteditable` 元素视为可编辑。
- 文本等待会对文本执行 `trim()`，因此文本两端的空白不会参与匹配。
- `waitElementTextRegex` 的无效正则表达式会在开始轮询前抛出异常。