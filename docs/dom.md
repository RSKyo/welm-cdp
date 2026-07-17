# DOM API

`welm-cdp/dom` 提供 CSS 选择器查询、元素读取、聚焦、滚动及状态等待能力。

```js
import * as dom from "welm-cdp/dom";
```

## 通用参数与返回值

除元素数量方法外，DOM 方法的共同参数为：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |
| `selector` | `string` | CSS 选择器 |
| `options.nth` | `number` | 要选择的元素索引，默认 `0`；负数从末尾开始，例如 `-1` 为最后一个 |

普通读取与操作方法使用严格元素解析：找不到元素或索引越界会抛出异常。等待方法使用安全解析：找不到元素时继续等待。

### `ElementBox`

```js
{
  x: 10,
  y: 20,
  width: 120,
  height: 32,
  centerX: 70,
  centerY: 36,
}
```

坐标均相对于当前 viewport，不是整页文档坐标。

### `WaitResult`

所有 `wait...` 方法都返回 runtime 的轮询结果：

```js
{ value, times }
```

其中 `value` 是命中时的布尔值、文本或元素数量，`times` 是轮询次数。

## API 一览

### 元素操作与读取

| 方法 | 返回值 | 特殊说明 |
| --- | --- | --- |
| `focus(targetId, selector, options?)` | `Promise<boolean>` | 聚焦选定元素 |
| `scrollIntoView(targetId, selector, options?)` | `Promise<boolean>` | 居中滚动元素，并等待位置与尺寸稳定 |
| `hasElement(targetId, selector, options?)` | `Promise<boolean>` | 找不到元素时返回 `false`，不抛错 |
| `getElementsCount(targetId, selector, options?)` | `Promise<number>` | 返回所有匹配元素数量；不使用 `nth` |
| `getElementAttribute(targetId, selector, name, options?)` | `Promise<string>` | 属性不存在时抛错 |
| `getElementAttributes(targetId, selector, options?)` | `Promise<object>` | 返回属性名到属性值的对象 |
| `getElementInnerText(targetId, selector, options?)` | `Promise<string>` | 返回 `innerText` |
| `getElementInnerHTML(targetId, selector, options?)` | `Promise<string>` | 返回 `innerHTML` |
| `getElementOuterHTML(targetId, selector, options?)` | `Promise<string>` | 返回 `outerHTML` |
| `getElementBox(targetId, selector, options?)` | `Promise<ElementBox>` | 返回 viewport 相对位置、尺寸与中心点 |
| `getElementCenter(targetId, selector, options?)` | `Promise<{x, y}>` | 返回 `ElementBox` 的中心点 |

### 元素状态等待

| 方法 | 命中条件 |
| --- | --- |
| `waitElementAppear(targetId, selector, options?)` | 选定元素存在 |
| `waitElementDisappear(targetId, selector, options?)` | 选定元素不存在或索引无效 |
| `waitElementVisible(targetId, selector, options?)` | 存在、`display` 非 `none`、`visibility` 非 `hidden`、`opacity` 非 `0`，且宽高大于 0 |
| `waitElementEditable(targetId, selector, options?)` | 可见、未禁用、非只读，且为 contenteditable、textarea 或可编辑 input |
| `waitElementClickable(targetId, selector, options?)` | 可见，且 `disabled` 不存在并且 `aria-disabled` 不为 `"true"` |

### 文本等待

| 方法 | 参数 | 命中条件 |
| --- | --- | --- |
| `waitElementTextIncludes(targetId, selector, expectedText, options?)` | `expectedText: string` | 修剪后的元素文本包含指定文本 |
| `waitElementTextEquals(targetId, selector, expectedText, options?)` | `expectedText: string` | 修剪后的元素文本严格相等 |
| `waitElementTextRegex(targetId, selector, pattern, options?)` | `pattern: string \| RegExp` | 修剪后的元素文本匹配正则表达式 |

元素不存在时，三种文本等待都不会匹配，而是继续轮询。

### 元素数量等待

| 方法 | 参数 | 命中条件 |
| --- | --- | --- |
| `waitElementCountEquals(targetId, selector, expectedCount, options?)` | `expectedCount: number` | 数量 `===` 指定值 |
| `waitElementCountGreater(targetId, selector, expectedCount, options?)` | 同上 | 数量 `>` 指定值 |
| `waitElementCountGreaterEquals(targetId, selector, expectedCount, options?)` | 同上 | 数量 `>=` 指定值 |
| `waitElementCountLess(targetId, selector, expectedCount, options?)` | 同上 | 数量 `<` 指定值 |
| `waitElementCountLessEquals(targetId, selector, expectedCount, options?)` | 同上 | 数量 `<=` 指定值 |
| `waitElementCountNotEquals(targetId, selector, expectedCount, options?)` | 同上 | 数量 `!==` 指定值 |

## Options 清单

| 选项 | 类型 | 默认值 | 使用方法 | 说明 |
| --- | --- | --- | --- | --- |
| `nth` | `number` | `0` | 除元素数量方法外的全部方法 | 元素索引；必须为整数，支持负数 |
| `cdpHost` | `string` | 保存的 CDP host，否则 `"127.0.0.1"` | 全部方法 | Chrome CDP 服务地址 |
| `cdpPort` | `number` | 保存的 CDP port，否则 `9222` | 全部方法 | Chrome CDP 服务端口 |
| `pollTimeout` | `number` | `30000` | `scrollIntoView`、全部 `wait...` 方法 | 最大等待时长，毫秒 |
| `pollInterval` | `number` | `500`；`scrollIntoView` 为 `100` | 同上 | 两次检查间隔，毫秒 |
| `matchTimes` | `number` | `1`；`scrollIntoView` 为 `3` | 同上 | 所需连续命中次数 |
| `matchDuration` | `number` | `0` | `scrollIntoView`、全部 `wait...` 方法 | 最短连续命中时长，毫秒 |
| `positionTolerance` | `number` | `0.5` | `scrollIntoView` | 相邻两次元素 box 的最大允许差异，CSS 像素；必须为非负数 |

所有公开 `wait...` 方法会设置自己的匹配条件，因此不需要、也不应通过 `options.matcher` 自定义条件。若需要任意自定义条件，请直接使用 `runtime.poll()`。

## 常用示例

```js
await focus(targetId, "#search", { nth: 0 });

const href = await getElementAttribute(targetId, "a", "href");
const box = await getElementBox(targetId, "#submit");

await waitElementVisible(targetId, "#dialog", {
  pollTimeout: 10000,
});

const { value: text } = await waitElementTextIncludes(
  targetId,
  "#status",
  "Ready",
);
```