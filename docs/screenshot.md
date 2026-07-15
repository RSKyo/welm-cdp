# Screenshot

`screenshot.js` 基于 Chrome DevTools Protocol 的 `Page` Domain 截取 Chrome 页面，并以 PNG `Buffer` 返回截图数据。

主要功能：

- 默认截取整个页面；
- 截取指定的 viewport 区域；
- 从页面布局信息中获取完整页面尺寸；
- 截取当前 viewport 之外的页面内容；
- 返回可由调用方自由处理的 PNG Buffer。

`screenshot.js` 只负责生成截图数据，不负责：

- 保存截图文件；
- 生成截图文件名；
- 将截图复制到系统剪贴板；
- 决定截图最终存放位置。

这些操作由调用方根据业务需要处理。

## 安装依赖

底层 CDP Client 使用：

```bash
npm install chrome-remote-interface
```

如果通过 `welm-cdp` 使用：

```js
import { captureScreenshot } from "welm-cdp/screenshot";
```

如果直接使用当前文件：

```js
import { captureScreenshot } from "./screenshot.js";
```

## 快速开始

```js
const image = await captureScreenshot(targetId);
```

返回的 `image` 是 PNG Buffer：

```js
console.log(Buffer.isBuffer(image)); // true
```

## 导出方法

### `captureScreenshot(targetId, options)`

截取指定 Chrome Target 的页面。

```js
const image = await captureScreenshot(targetId);
```

默认截取完整页面。如果提供 `options.clip`，则只截取指定区域。

参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `targetId` | `string` | Chrome Target ID |
| `options` | `Object` | 可选的截图和 CDP 配置 |

返回：

```js
Promise<Buffer>
```

Buffer 中保存完整的 PNG 二进制数据，不是 Base64 字符串。

## 完整页面截图

不提供 `clip` 时，默认截取整个页面：

```js
const image = await captureScreenshot(targetId);
```

模块会调用：

```js
await Page.getLayoutMetrics();
```

页面尺寸优先使用：

```js
metrics.cssContentSize
```

如果没有 CSS content metrics，则使用：

```js
metrics.contentSize
```

最终生成的完整页面区域为：

```js
{
  x: 0,
  y: 0,
  width: Math.ceil(size.width),
  height: Math.ceil(size.height),
  scale: 1,
}
```

宽度和高度向上取整，避免小数 CSS 尺寸导致页面边缘被截断。

如果无法取得页面内容尺寸，则抛出：

```text
failed to get page content size
```

## 区域截图

通过 `clip` 截取指定区域：

```js
const image = await captureScreenshot(targetId, {
  clip: {
    x: 100,
    y: 200,
    width: 640,
    height: 360,
  },
});
```

`clip` 字段：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `x` | 无 | 区域左上角的 X 坐标 |
| `y` | 无 | 区域左上角的 Y 坐标 |
| `width` | 无 | 区域宽度 |
| `height` | 无 | 区域高度 |
| `scale` | `1` | 截图缩放比例 |

没有提供 `scale` 时，模块会自动补充：

```js
scale: 1
```

坐标和尺寸使用 CSS 像素。

## CDP 截图配置

内部调用：

```js
await Page.captureScreenshot({
  format: "png",
  clip,
  fromSurface: true,
  captureBeyondViewport: true,
  optimizeForSpeed: true,
});
```

配置说明：

| 配置 | 值 | 说明 |
| --- | --- | --- |
| `format` | `"png"` | 固定生成 PNG 图片 |
| `fromSurface` | `true` | 从页面合成表面截取图像 |
| `captureBeyondViewport` | `true` | 允许截取 viewport 之外的内容 |
| `optimizeForSpeed` | `true` | 优先提高编码速度 |

CDP 返回 Base64 数据后，模块将其转换为 Buffer：

```js
return Buffer.from(data, "base64");
```

如果 CDP 没有返回有效截图数据，则抛出：

```text
missing screenshot data
```

## Options

### Screenshot Options

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `clip` | 完整页面区域 | 指定需要截取的页面区域 |

### CDP Options

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `cdpHost` | `"127.0.0.1"` | Chrome CDP 服务地址 |
| `cdpPort` | `9222` | Chrome CDP 服务端口 |

示例：

```js
const image = await captureScreenshot(targetId, {
  cdpHost: "127.0.0.1",
  cdpPort: 9333,
});
```

## 处理返回的 Buffer

### 保存为文件

```js
import fs from "node:fs/promises";

const image = await captureScreenshot(targetId);

await fs.writeFile(
  "/path/to/screenshot.png",
  image,
);
```

`fs.writeFile()` 可以直接写入 Buffer，不需要再次转换。

### 转换为 Base64

```js
const image = await captureScreenshot(targetId);
const base64 = image.toString("base64");
```

Base64 适合放入 JSON、协议消息或其它文本格式。

### 转换为 Data URL

```js
const image = await captureScreenshot(targetId);

const dataUrl =
  `data:image/png;base64,${image.toString("base64")}`;
```

Data URL 可以赋值给网页图片元素：

```js
imageElement.src = dataUrl;
```

### 复制到剪贴板

截图模块不直接操作系统剪贴板。调用方可以先保存临时文件，再交给图片剪贴板模块：

```js
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

import { writeClipboardImage } from "welm-cdp/clipboard";
import { captureScreenshot } from "welm-cdp/screenshot";

const image = await captureScreenshot(targetId);
const filePath = path.join(os.tmpdir(), "screenshot.png");

try {
  await fs.writeFile(filePath, image);
  await writeClipboardImage(filePath);
} finally {
  await fs.rm(filePath, {
    force: true,
  });
}
```

是否保存、复制以及是否保留临时文件，均由调用方决定。

## 为什么返回 Buffer

截图本质上是二进制图片。对 Node.js 基础模块来说，Buffer 比 Base64 更适合作为默认返回值：

- 可以直接写入文件；
- 可以传给接受二进制数据的其它 API；
- 不会让调用方误以为返回值是普通文本；
- 需要文本传输时，可以随时转换为 Base64；
- 避免所有文件保存调用方重复执行 Base64 解码。

如果直接返回 Base64，保存图片时必须先执行：

```js
Buffer.from(base64, "base64");
```

而 Buffer 转 Base64 只需要：

```js
buffer.toString("base64");
```

因此，核心截图方法返回 Buffer，调用方按需要转换，是更清晰的职责划分。

## Client 生命周期

`captureScreenshot()` 通过 `client.js` 的 `getClient()` 获取并复用 CDP Client。

截图完成后不会自动关闭 Client。应在一项完整任务结束后统一清理：

```js
import { closeClients } from "welm-cdp/client";
import { captureScreenshot } from "welm-cdp/screenshot";

try {
  const image = await captureScreenshot(targetId);
  await processImage(image);
} finally {
  await closeClients();
}
```

关闭 Client 只会断开 CDP 连接，不会关闭 Chrome 或页面。

## 设计边界

`screenshot.js` 的输入和输出关系为：

```text
Chrome Target + Screenshot Options -> PNG Buffer
```

模块不关心 Buffer 最终被：

- 保存到哪个目录；
- 使用什么文件名；
- 复制到哪个剪贴板；
- 转换为什么传输格式；
- 上传到哪个服务。

这种设计可以避免 `screenshot.js` 依赖：

- `node:fs`；
- `node:os`；
- `node:path`；
- Clipboard 模块；
- 文件名模板和保存目录配置。

## 注意事项

- `targetId` 必须属于 `cdpHost` 和 `cdpPort` 指向的 CDP 服务。
- 默认会截取整个页面，而不是仅截取当前可见 viewport。
- `clip` 坐标和尺寸使用 CSS 像素。
- `clip.width` 和 `clip.height` 应大于 `0`。
- 超大页面可能受到 Chrome 最大图片尺寸或内存限制。
- 截图固定返回 PNG Buffer。
- 返回 Buffer 不包含 Data URL 前缀。
- 保存、复制、上传和文件名生成均由调用方负责。
- 截图完成后不会自动关闭 CDP Client。