# Clipboard API

`welm-cdp/clipboard` 提供系统剪贴板的文本、文件路径和图片读写能力，支持 macOS 与 Windows。

```js
import {
  readClipboardText,
  writeClipboardText,
  readClipboardFile,
  writeClipboardFile,
  readClipboardImage,
  writeClipboardImage,
} from "welm-cdp/clipboard";
```

## API 一览

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `readClipboardText()` | `Promise<string>` | 读取系统剪贴板纯文本 |
| `writeClipboardText(text)` | `Promise<void>` | 写入纯文本到系统剪贴板 |
| `readClipboardFile()` | `Promise<string[]>` | 读取系统剪贴板中的文件路径 |
| `writeClipboardFile(files)` | `Promise<string[]>` | 写入一个或多个现有路径到系统剪贴板 |
| `readClipboardImage(imagePath)` | `Promise<string>` | 将剪贴板图片保存为 PNG 文件 |
| `writeClipboardImage(imagePath)` | `Promise<string>` | 将本地图片写入系统剪贴板 |

这些方法均不接受 `options`。

## 文本

### `readClipboardText()`

```js
const text = await readClipboardText();
```

- 返回系统剪贴板中的纯文本。
- 不会自动 `trim()`；返回值保留平台命令输出的原始文本内容。
- macOS 使用 `pbpaste`；Windows 使用 `Get-Clipboard -Raw`。

### `writeClipboardText(text)`

```js
await writeClipboardText("Hello clipboard");
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `text` | `*` | 要写入的内容，会通过 `String(text)` 转为字符串 |

- 成功后返回 `undefined`。
- 文本经标准输入传给平台剪贴板命令，不经过临时文件。
- macOS 使用 `pbcopy`；Windows 使用 `Set-Clipboard`。

## 文件路径

### `readClipboardFile()`

```js
const files = await readClipboardFile();
```

- 返回剪贴板中的文件路径数组。
- Windows 剪贴板不包含 File Drop List 时，返回空数组 `[]`。
- macOS 通过 `file-clipboard.bin` 读取。
- 不会检查返回路径当前是否仍然存在。

### `writeClipboardFile(files)`

```js
const writtenFiles = await writeClipboardFile([
  "/music/song.mp3",
  "/images/cover.png",
]);
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `files` | `string \| string[]` | 一个或多个非空、已存在的路径 |

- 返回实际写入剪贴板的绝对路径数组。
- 单个字符串会自动视为单元素数组。
- 空数组、空路径或不存在的路径都会抛出异常。
- macOS 通过 `file-clipboard.bin` 写入；Windows 使用 `System.Windows.Forms.Clipboard.SetFileDropList()`。

## 图片

### `readClipboardImage(imagePath)`

```js
const outputPath = await readClipboardImage("/tmp/clipboard-image");
// /tmp/clipboard-image.png
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `imagePath` | `string` | 输出图片路径；不要求文件已存在 |

- 返回实际输出文件的绝对路径。
- 无论传入路径是否有扩展名，都会将扩展名改为 `.png`。
- 例如 `"/tmp/a.jpg"` 实际输出为 `"/tmp/a.png"`。
- macOS 通过 `image-clipboard.bin` 将剪贴板图片写到该 PNG 路径；Windows 通过 `Clipboard.GetImage()` 保存 PNG。
- 剪贴板中没有图片时抛出异常。

### `writeClipboardImage(imagePath)`

```js
const writtenPath = await writeClipboardImage("/images/cover.png");
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `imagePath` | `string` | 已存在的本地图片文件路径 |

- 返回写入剪贴板的绝对路径。
- 路径必须存在且为普通文件。
- 支持扩展名：`.png`、`.jpg`、`.jpeg`、`.tif`、`.tiff`、`.gif`、`.heic`。
- macOS 通过 `image-clipboard.bin` 写入；Windows 使用 `System.Drawing.Image` 与 `Clipboard.SetImage()`。

## 平台与构建

| 平台 | 文本 | 文件 | 图片 |
| --- | --- | --- | --- |
| macOS | `pbpaste` / `pbcopy` | `file-clipboard.bin` | `image-clipboard.bin` |
| Windows | PowerShell Clipboard | PowerShell + `System.Windows.Forms` | PowerShell + `System.Windows.Forms` / `System.Drawing` |

macOS 的文件与图片能力依赖对应 native binary。缺失时会抛出明确错误；按项目脚本构建：

```bash
npm run build:macos:file-clipboard
npm run build:macos:image-clipboard
```

不支持的平台统一抛出：

```text
Unsupported platform: PLATFORM
```

## 常见组合

```js
// 截图后复制图片。
const image = await captureScreenshot(targetId);
await writeFile("/tmp/page.png", image);
await writeClipboardImage("/tmp/page.png");

// 触发页面复制，再读取文字。
await copy(targetId);
const text = await readClipboardText();
```