# Local / Clipboard 模块说明

本目录用于封装本机能力。目前包含两类能力：

```txt
local/
  file.js                  # 本地文件读写能力

  clipboard.js             # 剪贴板能力总入口
  text-clipboard.js        # 文本剪贴板
  file-clipboard.js        # 文件引用剪贴板
  image-clipboard.js       # 图片内容剪贴板

  file-clipboard.swift     # macOS 文件剪贴板实现
  file-clipboard.bin       # 文件剪贴板编译产物

  image-clipboard.swift    # macOS 图片剪贴板实现
  image-clipboard.bin      # 图片剪贴板编译产物

  readme.md                # 本说明文件
```

当前目录采用平铺结构。`local` 表示本机能力，`clipboard.js` 是剪贴板总入口，`text-clipboard.js`、`file-clipboard.js`、`image-clipboard.js` 分别负责具体实现。

## 1. 对外能力

`local/clipboard.js` 汇总并导出 6 个剪贴板能力：

```js
readClipboardText()
writeClipboardText(text)

readClipboardFile()
writeClipboardFile(file)

readClipboardImage(outputPath)
writeClipboardImage(imagePath)
```

推荐外部项目通过 package exports 使用：

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

在 `welm-cdp` 项目内部，也可以按相对路径导入：

```js
import {
  readClipboardText,
  writeClipboardText,
  readClipboardFile,
  writeClipboardFile,
  readClipboardImage,
  writeClipboardImage,
} from "./local/clipboard.js";
```

不建议外部项目直接导入内部文件：

```js
import { readClipboardText } from "welm-cdp/local/text-clipboard.js";
```

`local` 是内部目录名，对外 API 应通过 `welm-cdp/clipboard` 暴露。

## 2. 三类剪贴板的区别

### text clipboard

文本剪贴板读写的是字符串内容。

```js
readClipboardText()
writeClipboardText(text)
```

底层示例：

```txt
macOS:   pbpaste / pbcopy
Windows: Get-Clipboard / Set-Clipboard
```

### file clipboard

文件剪贴板读写的是文件引用，也就是文件路径列表。

```js
readClipboardFile()
writeClipboardFile(file)
```

注意：它不是读取或写入文件内容，而是把文件路径作为系统剪贴板中的 file reference。

例如：

```js
await writeClipboardFile("/Users/zzz/Desktop/a.png");
```

之后在 Finder、桌面、聊天窗口、支持文件粘贴的网页里执行：

```txt
Cmd + V
```

系统或目标应用会根据这个文件引用完成粘贴或上传。

### image clipboard

图片剪贴板读写的是图片内容数据，而不是文件路径。

```js
writeClipboardImage(imagePath)
readClipboardImage(outputPath)
```

因为图片剪贴板里保存的是图片数据，不一定有原始文件名或路径，所以读取图片时必须提供输出路径。

例如：

```js
await readClipboardImage("/Users/zzz/Desktop/from-clipboard.png");
```

如果要保持原始文件格式、大小和文件名，应使用：

```js
writeClipboardFile("/Users/zzz/Desktop/a.jpg");
```

如果要模拟截图、网页“复制图片”、聊天软件粘贴图片，应使用：

```js
writeClipboardImage("/Users/zzz/Desktop/a.jpg");
```

## 3. clipboard.js 总入口

`local/clipboard.js` 只做能力汇总，不写具体实现。

建议结构：

```js
// -----------------------------------------------------------------------------
// clipboard.js
// -----------------------------------------------------------------------------
// Local clipboard capability facade.
//
// Exports:
//   - readClipboardText
//   - writeClipboardText
//   - readClipboardFile
//   - writeClipboardFile
//   - readClipboardImage
//   - writeClipboardImage
// -----------------------------------------------------------------------------

export {
  readClipboardText,
  writeClipboardText,
} from "./text-clipboard.js";

export {
  readClipboardFile,
  writeClipboardFile,
} from "./file-clipboard.js";

export {
  readClipboardImage,
  writeClipboardImage,
} from "./image-clipboard.js";
```

这样外部只需要一个入口：

```js
import { writeClipboardText, writeClipboardFile, writeClipboardImage } from "welm-cdp/clipboard";
```

## 4. package.json exports

推荐在 `package.json` 中只导出总入口：

```json
{
  "exports": {
    "./chrome": "./cdp/chrome.js",
    "./runtime": "./cdp/runtime.js",
    "./dom": "./cdp/dom.js",
    "./input": "./cdp/input.js",
    "./mouse": "./cdp/mouse.js",
    "./screenshot": "./cdp/screenshot.js",

    "./clipboard": "./local/clipboard.js",
    "./file": "./local/file.js"
  }
}
```

不建议导出：

```json
{
  "exports": {
    "./clipboard/text": "./local/text-clipboard.js",
    "./clipboard/file": "./local/file-clipboard.js",
    "./clipboard/image": "./local/image-clipboard.js"
  }
}
```

原因：现在已经有 `clipboard.js` 总入口，外部项目不需要知道内部拆分。

## 5. 编译 file-clipboard.swift

`file-clipboard.swift` 是 macOS 下文件剪贴板的桥接实现，用于读写系统剪贴板中的文件引用。

推荐提前编译，不要在运行时自动编译。

```bash
swiftc local/file-clipboard.swift -o local/file-clipboard.bin
```

或使用 package script：

```bash
npm run compile:file-clipboard
```

## 6. 编译 image-clipboard.swift

`image-clipboard.swift` 是 macOS 下图片剪贴板的桥接实现，用于读写系统剪贴板中的图片内容。

```bash
swiftc local/image-clipboard.swift -o local/image-clipboard.bin
```

或使用 package script：

```bash
npm run compile:image-clipboard
```

## 7. 添加 package.json 脚本

可以在 `package.json` 中添加：

```json
{
  "scripts": {
    "compile:file-clipboard": "swiftc local/file-clipboard.swift -o local/file-clipboard.bin",
    "compile:image-clipboard": "swiftc local/image-clipboard.swift -o local/image-clipboard.bin",
    "compile:clipboard": "npm run compile:file-clipboard && npm run compile:image-clipboard"
  }
}
```

然后运行：

```bash
npm run compile:clipboard
```

也可以只编译文件剪贴板：

```bash
npm run compile:file-clipboard
```

或者只编译图片剪贴板：

```bash
npm run compile:image-clipboard
```

## 8. 测试 file-clipboard.bin

### 测试写入文件引用

```bash
local/file-clipboard.bin write /Users/zzz/Desktop/a.png
```

如果执行成功，剪贴板中会出现这个文件引用。

可以在 Finder、桌面、聊天输入框或支持文件粘贴的网页里执行：

```txt
Cmd + V
```

如果目标应用支持文件粘贴，应该能看到文件被粘贴或上传。

### 测试读取文件引用

```bash
local/file-clipboard.bin read
```

输出示例：

```json
["/Users/zzz/Desktop/a.png"]
```

如果剪贴板中没有文件引用，通常应该返回空数组：

```json
[]
```

## 9. 测试 image-clipboard.bin

### 测试写入图片内容

```bash
local/image-clipboard.bin write /Users/zzz/Desktop/a.jpg
```

执行成功后，可以在支持图片粘贴的应用中执行：

```txt
Cmd + V
```

### 测试读取图片内容

先把图片数据放入剪贴板。推荐用 macOS 截图到剪贴板：

```bash
screencapture -c
```

框选区域后运行：

```bash
local/image-clipboard.bin read /Users/zzz/Desktop/from-clipboard.png
```

如果桌面生成了 `from-clipboard.png`，说明图片剪贴板读取成功。

注意：不要用 Finder 里选中图片文件后 `Cmd + C` 来测试图片读取。Finder 复制图片文件时，剪贴板里通常是文件引用，不是图片内容。

## 10. Node 层调用示例

### 文本剪贴板

```js
import {
  readClipboardText,
  writeClipboardText,
} from "welm-cdp/clipboard";

await writeClipboardText("hello clipboard");

const text = await readClipboardText();
console.log(text);
```

### 写入文件引用

```js
import { writeClipboardFile } from "welm-cdp/clipboard";

await writeClipboardFile("/Users/zzz/Desktop/a.png");
```

### 读取文件引用

```js
import { readClipboardFile } from "welm-cdp/clipboard";

const files = await readClipboardFile();
console.log(files);
```

输出示例：

```js
[
  "/Users/zzz/Desktop/a.png"
]
```

### 写入多个文件引用

```js
import { writeClipboardFile } from "welm-cdp/clipboard";

await writeClipboardFile([
  "/Users/zzz/Desktop/a.png",
  "/Users/zzz/Desktop/b.pdf",
]);
```

### 写入图片内容

```js
import { writeClipboardImage } from "welm-cdp/clipboard";

await writeClipboardImage("/Users/zzz/Desktop/a.jpg");
```

### 读取图片内容

```js
import { readClipboardImage } from "welm-cdp/clipboard";

await readClipboardImage("/Users/zzz/Desktop/from-clipboard.png");
```

## 11. 设计原则

### clipboard.js 是总入口

`clipboard.js` 只负责汇总能力：

```txt
clipboard.js
  -> text-clipboard.js
  -> file-clipboard.js
  -> image-clipboard.js
```

具体实现仍然放在三个独立文件中。

### readClipboardFile 不需要输出目录

`readClipboardFile()` 读取的是剪贴板里的文件路径，不需要把文件另存到某个目录。

```txt
readClipboardFile()
  返回已有文件路径列表
```

如果用户在 Finder 或目标应用里执行 `Cmd + V`，系统会根据剪贴板中的文件引用完成保存或粘贴。

### readClipboardImage 需要输出路径

`readClipboardImage(outputPath)` 读取的是图片数据，剪贴板里不一定有原始文件路径，所以必须提供保存路径。

```txt
readClipboardImage(outputPath)
  把图片数据保存为文件
```

### file clipboard 和 image clipboard 不要混合

```txt
writeClipboardFile("/Users/zzz/Desktop/a.jpg")
  复制的是文件引用

writeClipboardImage("/Users/zzz/Desktop/a.jpg")
  复制的是图片内容
```

两者不是同一个能力，不应该合并。

### local/file.js 和 local/file-clipboard.js 不要混合

```txt
local/file.js
  本地文件系统能力，例如读写文本、JSON、扫描文件

local/file-clipboard.js
  系统剪贴板中的文件引用能力
```

两者名字接近，但领域不同。

## 12. 常见问题

### 为什么 writeClipboardImage 后 readClipboardImage，文件大小可能变大？

因为 image clipboard 会经过图片解码和重新编码。

例如原始文件是 JPEG，但读取剪贴板图片时保存成 PNG，文件体积可能明显变大。

```txt
JPEG 文件
  ↓
图片数据剪贴板
  ↓
重新保存为 PNG
```

如果要保留原始 JPEG 的文件大小、格式和元数据，应使用：

```js
writeClipboardFile("/Users/zzz/Desktop/a.jpg");
```

而不是：

```js
writeClipboardImage("/Users/zzz/Desktop/a.jpg");
```

### 为什么 Finder 里复制图片文件后，readClipboardImage 可能读不到？

因为 Finder 复制图片文件时，剪贴板里通常是 file reference，不是 image data。

此时应该使用：

```js
readClipboardFile()
```

如果是截图到剪贴板，或者浏览器右键“复制图片”，才更适合使用：

```js
readClipboardImage(outputPath)
```

## 13. 推荐测试顺序

### 文件剪贴板

```bash
npm run compile:file-clipboard
local/file-clipboard.bin write /Users/zzz/Desktop/a.png
local/file-clipboard.bin read
```

然后在 Finder 或支持文件粘贴的地方执行：

```txt
Cmd + V
```

### 图片剪贴板

```bash
npm run compile:image-clipboard
screencapture -c
local/image-clipboard.bin read /Users/zzz/Desktop/from-clipboard.png
```

如果桌面生成了 `from-clipboard.png`，说明图片剪贴板读取成功。

## 14. 打包检查

如果这个包会被其他项目通过 `file:`、GitHub 或 npm 安装，需要确认 `.bin` 文件会被包含。

执行：

```bash
npm pack --dry-run
```

确认输出中包含：

```txt
local/clipboard.js
local/text-clipboard.js
local/file-clipboard.js
local/file-clipboard.bin
local/image-clipboard.js
local/image-clipboard.bin
local/file.js
```

还要确认 `.bin` 有执行权限：

```bash
chmod +x local/file-clipboard.bin
chmod +x local/image-clipboard.bin

git ls-files -s local/file-clipboard.bin local/image-clipboard.bin
```

如果前面是 `100755`，说明可执行权限已被 git 记录。
