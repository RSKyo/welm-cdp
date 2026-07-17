# Screenshot API

`welm-cdp/screenshot` 使用 CDP Page 域截取 Chrome Target 的 PNG 图像数据。

```js
import { captureScreenshot } from "welm-cdp/screenshot";
```

## API 一览

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `captureScreenshot(targetId, options?)` | `Promise<Buffer>` | 截取整个页面或指定区域的 PNG 图像 |

## Options 清单

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `cdpHost` | `string` | 保存的 CDP host，否则 `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `number` | 保存的 CDP port，否则 `9222` | Chrome CDP 服务端口 |
| `clip` | `object` | 无 | 指定截取区域；省略时截取整个页面 |
| `clip.x` | `number` | — | 区域左上角 X 坐标，CSS 像素 |
| `clip.y` | `number` | — | 区域左上角 Y 坐标，CSS 像素 |
| `clip.width` | `number` | — | 区域宽度，CSS 像素 |
| `clip.height` | `number` | — | 区域高度，CSS 像素 |
| `clip.scale` | `number` | `1` | 截图缩放倍率 |

## API 详情

### `captureScreenshot(targetId, options?)`

截取 PNG 格式截图，并返回 Node.js `Buffer`。

```js
const image = await captureScreenshot(targetId);

await writeFile("/tmp/page.png", image);
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |

- 使用 options：`cdpHost`、`cdpPort`、`clip`。
- 返回 PNG 二进制数据的 `Buffer`，不保存文件、不复制到剪贴板。
- 截图格式固定为 PNG。
- CDP 返回空数据时抛出 `missing screenshot data`。

### 截取整个页面

不传 `clip` 时，模块调用 `Page.getLayoutMetrics()` 读取页面内容尺寸，并构造：

```js
{
  x: 0,
  y: 0,
  width: Math.ceil(contentWidth),
  height: Math.ceil(contentHeight),
  scale: 1,
}
```

- 优先使用 `cssContentSize`，不支持时回退到 `contentSize`。
- 可以截取超出当前可见 viewport 的页面内容。
- 无法取得页面内容尺寸时抛出 `failed to get page content size`。

### 截取指定区域

传入 `clip` 时，按指定区域截图：

```js
const image = await captureScreenshot(targetId, {
  clip: {
    x: 100,
    y: 200,
    width: 800,
    height: 600,
    scale: 1,
  },
});
```

- `clip` 坐标以 CSS 像素表示，区域相对于当前 viewport。
- 未提供 `clip.scale` 时，自动补为 `1`。
- 传入 `clip` 时不会自动读取整页尺寸。
- `clip` 参数的有效性由 Chrome CDP 校验；无效区域会导致 CDP 请求失败。

## 截图后的处理

模块只负责返回图像数据，调用方自行决定如何使用：

```js
const image = await captureScreenshot(targetId);

await writeFile("/tmp/page.png", image);
await writeClipboardImage("/tmp/page.png");
```

需要保存文件可使用 `welm-cdp/fs`；需要复制图片可使用 `welm-cdp/clipboard`。