# Clipboard

Last modified: 2026-07-16

Clipboard 模块提供 macOS 和 Windows 系统剪贴板能力，包括：

- 读取和写入纯文本；
- 读取和写入一个或多个文件路径；
- 将剪贴板图片保存为 PNG 文件；
- 将本地图片写入系统剪贴板。

当前支持的平台：

| 平台 | 文本 | 文件 | 图片 |
| --- | --- | --- | --- |
| macOS | `pbpaste` / `pbcopy` | Swift native binary | Swift native binary |
| Windows | PowerShell | `System.Windows.Forms` | `System.Windows.Forms` + `System.Drawing` |
| Linux 和其它平台 | 不支持 | 不支持 | 不支持 |

Clipboard 是本地系统能力，不依赖 Chrome，也不使用 CDP。

## Package Export

`package.json` 将 Clipboard facade 导出为：

```json
{
  "exports": {
    "./clipboard": "./clipboard/index.js"
  }
}
```

其它项目应通过公共入口导入：

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

`clipboard/index.js` 只负责汇总三个实现模块：

```js
export * from "./text-clipboard.js";
export * from "./file-clipboard.js";
export * from "./image-clipboard.js";
```

不建议依赖包内部路径：

```js
// 不推荐
import { readClipboardText } from
  "welm-cdp/clipboard/text-clipboard.js";
```

如果直接在当前项目中使用：

```js
import {
  readClipboardText,
  writeClipboardText,
} from "./clipboard/index.js";
```

## 快速开始

复制并读取文本：

```js
import {
  readClipboardText,
  writeClipboardText,
} from "welm-cdp/clipboard";

await writeClipboardText("Hello clipboard");

const text = await readClipboardText();

console.log(text);
```

复制文件：

```js
import { writeClipboardFile } from "welm-cdp/clipboard";

const filePaths = await writeClipboardFile([
  "/music/song.mp3",
  "/images/cover.png",
]);

console.log(filePaths);
```

保存剪贴板图片：

```js
import { readClipboardImage } from "welm-cdp/clipboard";

const imagePath = await readClipboardImage(
  "/tmp/clipboard-image",
);

console.log(imagePath);
// /tmp/clipboard-image.png
```

## Text Clipboard

文本剪贴板由 `text-clipboard.js` 提供。

### `readClipboardText()`

读取系统剪贴板中的纯文本。

```js
const text = await readClipboardText();
```

返回值：

```js
Promise<string>
```

平台实现：

| 平台 | 命令 |
| --- | --- |
| macOS | `pbpaste` |
| Windows | `Get-Clipboard -Raw` |

如果当前平台不支持或系统命令执行失败，方法会抛出错误。

### `writeClipboardText(text)`

将内容作为纯文本写入系统剪贴板。

```js
await writeClipboardText("Hello");
```

`text` 会先通过下面的方式转换为字符串：

```js
const value = String(text);
```

因此也可以传入其它值：

```js
await writeClipboardText(123);
await writeClipboardText(true);
await writeClipboardText(null);
```

对应写入：

```text
123
true
null
```

返回值：

```js
Promise<void>
```

平台实现：

| 平台 | 命令 |
| --- | --- |
| macOS | `pbcopy` |
| Windows | `$input \| Set-Clipboard` |

文本通过子进程标准输入传递，不拼接到 shell 命令字符串中。

## File Clipboard

文件剪贴板由 `file-clipboard.js` 提供。

### `readClipboardFile()`

读取系统剪贴板中的文件路径。

```js
const filePaths = await readClipboardFile();
```

返回值：

```js
Promise<string[]>
```

返回值始终是数组。Windows 剪贴板不包含 File Drop List 时返回空数组：

```js
[]
```

只包含一个文件时仍返回数组：

```js
[
  "C:\\Music\\song.mp3",
]
```

### `writeClipboardFile(files)`

将一个或多个文件系统路径写入剪贴板。

写入一个路径：

```js
const filePaths = await writeClipboardFile(
  "/music/song.mp3",
);
```

写入多个路径：

```js
const filePaths = await writeClipboardFile([
  "/music/song.mp3",
  "/images/cover.png",
]);
```

参数类型：

```js
string | string[]
```

执行前会：

1. 将单个字符串转换为数组；
2. 检查数组不为空；
3. 检查每个值都是非空字符串；
4. 检查每个路径已经存在；
5. 将每个路径转换为绝对路径。

返回值：

```js
Promise<string[]>
```

返回实际写入剪贴板的绝对路径数组。

可能抛出的校验错误：

```text
files cannot be empty
files must be a non-empty string or an array of non-empty strings
file not found: PATH
```

当前实现使用 `fs.existsSync()` 检查路径，因此存在的普通文件和目录都可以作为 File Drop List 项写入剪贴板。

## Image Clipboard

图片剪贴板由 `image-clipboard.js` 提供。

### `readClipboardImage(imagePath)`

将系统剪贴板中的图片保存为 PNG 文件。

```js
const imagePath = await readClipboardImage(
  "/tmp/clipboard-image",
);
```

返回值：

```js
Promise<string>
```

返回最终 PNG 文件的绝对路径。

输出文件名始终使用小写 `.png` 扩展名：

```js
await readClipboardImage("/tmp/image");
// /tmp/image.png

await readClipboardImage("/tmp/image.jpg");
// /tmp/image.png

await readClipboardImage("./image.PNG");
// ABSOLUTE_PATH/image.png
```

该方法不会创建父目录。调用前必须确保目标目录已经存在。

剪贴板不包含图片或文件写入失败时，方法会抛出错误。

### `writeClipboardImage(imagePath)`

将本地图片文件写入系统剪贴板。

```js
const imagePath = await writeClipboardImage(
  "/images/cover.png",
);
```

执行前会：

1. 检查参数是非空字符串；
2. 检查路径存在；
3. 检查路径指向普通文件；
4. 检查图片扩展名受支持；
5. 将路径转换为绝对路径。

支持的扩展名：

```text
.png
.jpg
.jpeg
.tif
.tiff
.gif
.heic
```

扩展名比较不区分大小写。

返回值：

```js
Promise<string>
```

返回实际写入剪贴板的图片绝对路径。

扩展名通过校验不代表操作系统一定可以解码图片。特别是 HEIC，实际支持情况仍取决于目标系统及其图片解码组件。

可能抛出的校验错误：

```text
image file must be a non-empty string
image file not found: PATH
image path is not a file: PATH
unsupported image format: EXT
```

## macOS Native Binaries

文件和图片剪贴板在 macOS 上使用两个 Swift native binary：

```text
clipboard/file-clipboard.bin
clipboard/image-clipboard.bin
```

binary 只会在 macOS 上检查：

```js
const clipboardBin =
  process.platform === "darwin"
    ? assertClipboardBin()
    : null;
```

Windows 不检查，也不使用这些 binary。

binary 不存在时会分别提示：

```text
npm run build:macos:file-clipboard
npm run build:macos:image-clipboard
```

## Package Scripts

`package.json` 提供以下 macOS 构建脚本：

```json
{
  "scripts": {
    "build:macos:file-clipboard": "swiftc clipboard/file-clipboard.swift -o clipboard/file-clipboard.bin",
    "build:macos:image-clipboard": "swiftc clipboard/image-clipboard.swift -o clipboard/image-clipboard.bin",
    "build:macos:clipboard": "npm run build:macos:file-clipboard && npm run build:macos:image-clipboard",
    "build:macos": "npm run build:macos:dialog && npm run build:macos:clipboard"
  }
}
```

### 构建 File Clipboard

```bash
npm run build:macos:file-clipboard
```

### 构建 Image Clipboard

```bash
npm run build:macos:image-clipboard
```

### 构建全部 Clipboard binary

```bash
npm run build:macos:clipboard
```

它会依次执行 File Clipboard 和 Image Clipboard 的构建脚本。

### 构建全部 macOS native binary

```bash
npm run build:macos
```

它会依次构建 Dialog 和 Clipboard 的全部 binary。

如果只修改了 Clipboard，不需要重新构建 Dialog，执行下面的命令即可：

```bash
npm run build:macos:clipboard
```

执行前需要在 macOS 上安装可用的 Swift 编译器，通常由 Xcode Command Line Tools 提供。

## Windows Implementation

Windows 使用 PowerShell 执行文件和图片剪贴板操作。

`runPowerShell()` 使用以下启动参数：

```text
-NoProfile
-STA
-Command
```

`-STA` 用于在 Single-Threaded Apartment 中运行 PowerShell，满足 Windows Clipboard API 的线程模型要求。

使用的 .NET API：

| 功能 | API |
| --- | --- |
| 读取文件 | `Clipboard.GetFileDropList()` |
| 写入文件 | `Clipboard.SetFileDropList()` |
| 读取图片 | `Clipboard.GetImage()` |
| 写入图片 | `Clipboard.SetImage()` |

文件剪贴板使用：

```text
System.Windows.Forms
System.Collections.Specialized.StringCollection
```

图片剪贴板使用：

```text
System.Windows.Forms
System.Drawing
```

运行环境必须提供：

- Windows PowerShell；
- `System.Windows.Forms`；
- `System.Drawing`；
- 允许 Node.js 启动 PowerShell 子进程。

## CLI Commands

`cmd/clipboard.js` 提供以下命令：

| 命令 | 说明 |
| --- | --- |
| `clipboard read-text` | 读取剪贴板文本 |
| `clipboard write-text <text>` | 写入剪贴板文本 |
| `clipboard read-file` | 读取剪贴板文件路径 |
| `clipboard write-file <file...>` | 写入一个或多个文件路径 |
| `clipboard read-image <output>` | 将剪贴板图片保存为 PNG |
| `clipboard write-image <file>` | 将本地图片写入剪贴板 |

完整命令示例：

```bash
welm-cdp clipboard read-text
```

```bash
welm-cdp clipboard write-text "Hello clipboard"
```

```bash
welm-cdp clipboard read-file
```

```bash
welm-cdp clipboard write-file "/music/song.mp3" "/images/cover.png"
```

```bash
welm-cdp clipboard read-image "/tmp/clipboard-image"
```

```bash
welm-cdp clipboard write-image "/images/cover.png"
```

路径中包含空格时应使用引号。

## 错误处理

不支持的平台统一抛出：

```text
Unsupported platform: PLATFORM
```

File Clipboard 错误会包装为：

```text
readClipboardFile failed: MESSAGE
writeClipboardFile failed: MESSAGE
```

Image Clipboard 错误会包装为：

```text
readClipboardImage failed: MESSAGE
writeClipboardImage failed: MESSAGE
```

macOS native program 不存在时抛出：

```text
program not found: PROGRAM
```

Windows PowerShell 不存在时抛出：

```text
powershell.exe not found
```

## 注意事项

- 当前只支持 macOS 和 Windows。
- Clipboard 模块不需要 Chrome 或 CDP Client。
- 文本写入方法会将参数转换为字符串。
- 文件写入方法返回绝对路径数组。
- 图片读取方法始终输出 PNG 文件。
- 图片读取方法不会自动创建目标目录。
- 图片写入支持的实际格式仍取决于操作系统解码能力。
- macOS 文件和图片功能需要提前构建对应 binary。
- Windows 文件和图片功能依赖 PowerShell 的 STA 模式。
- 使用公共 API 时应从 `welm-cdp/clipboard` 导入。