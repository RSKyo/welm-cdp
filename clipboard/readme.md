# Clipboard Module

本目录用于封装系统剪贴板能力。

当前支持：

* Text Clipboard：文本剪贴板
* File Clipboard：文件引用剪贴板
* Image Clipboard：图片内容剪贴板

---

## 目录结构

```txt
clipboard/
├── index.js                  # 剪贴板统一入口
│
├── text-clipboard.js         # 文本剪贴板
├── file-clipboard.js         # 文件引用剪贴板
├── image-clipboard.js        # 图片内容剪贴板
│
├── process.js                # 本地程序执行封装
│
├── file-clipboard.swift      # macOS 文件剪贴板实现
├── file-clipboard.bin        # macOS 编译产物
│
├── image-clipboard.swift     # macOS 图片剪贴板实现
├── image-clipboard.bin       # macOS 编译产物
│
└── readme.md
```

目录采用平铺结构。

`index.js` 作为统一入口：

```txt
index.js
    ├── text-clipboard.js
    ├── file-clipboard.js
    └── image-clipboard.js
```

具体实现保持独立。

---

# 1. 对外 API

通过 `index.js` 提供：

```js
readClipboardText()
writeClipboardText(text)

readClipboardFile()
writeClipboardFile(files)

readClipboardImage(outputPath)
writeClipboardImage(imagePath)
```

示例：

```js
import {
  readClipboardText,
  writeClipboardText,
  readClipboardFile,
  writeClipboardFile,
  readClipboardImage,
  writeClipboardImage,
} from "./clipboard/index.js";
```

---

# 2. 三种 Clipboard

## 2.1 Text Clipboard

文本剪贴板处理字符串。

接口：

```js
readClipboardText()

writeClipboardText(text)
```

示例：

```js
await writeClipboardText("hello");

const text = await readClipboardText();
```

平台实现：

macOS：

```txt
pbcopy
pbpaste
```

Windows：

```txt
PowerShell Clipboard API
```

---

## 2.2 File Clipboard

文件剪贴板处理的是：

```txt
文件引用（file reference）
```

不是文件内容。

接口：

```js
readClipboardFile()

writeClipboardFile(files)
```

示例：

```js
await writeClipboardFile(
  "/Users/zzz/Desktop/a.png"
);
```

剪贴板保存的是：

```txt
/Users/zzz/Desktop/a.png
```

之后可以在：

* Finder
* 桌面
* 支持文件粘贴的应用

执行：

```txt
Cmd + V
```

系统会根据文件引用完成粘贴。

---

注意：

下面两个操作含义不同：

复制文件：

```js
writeClipboardFile("/tmp/a.jpg");
```

复制图片内容：

```js
writeClipboardImage("/tmp/a.jpg");
```

前者保存：

```txt
文件引用
```

后者保存：

```txt
图片数据
```

---

## 2.3 Image Clipboard

图片剪贴板处理图片内容。

接口：

```js
writeClipboardImage(imagePath)

readClipboardImage(outputPath)
```

写入：

```js
await writeClipboardImage(
  "/Users/zzz/Desktop/a.jpg"
);
```

读取：

```js
await readClipboardImage(
  "/Users/zzz/Desktop/result.png"
);
```

---

图片剪贴板不保证保留：

* 原始文件名
* 原始路径
* 原始格式

例如：

```txt
JPEG 文件
    ↓
图片剪贴板
    ↓
保存 PNG
```

可能导致：

* 文件大小变化
* 格式变化

如果需要保持原文件信息，应使用：

```js
writeClipboardFile()
```

---

# 3. index.js

`index.js` 只负责导出。

示例：

```js
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

不包含：

* 平台判断
* Native 调用
* 数据转换

---

# 4. process.js

`process.js` 封装系统程序调用。

提供：

```js
runProgram()

runPowerShell()
```

---

## runProgram()

用于运行本地 binary。

例如：

```js
await runProgram(
  fileClipboardBin,
  "read",
);
```

调用流程：

```txt
JavaScript

    ↓

process.js

    ↓

binary

    ↓

Swift
```

用于：

* file-clipboard.bin
* image-clipboard.bin

---

## runPowerShell()

用于 Windows 平台。

例如：

```js
await runPowerShell(
  script,
  args,
);
```

调用流程：

```txt
JavaScript

    ↓

process.js

    ↓

PowerShell

    ↓

Windows API
```

---

# 5. 平台实现

## macOS

使用 Swift 编译 Native Binary。

结构：

```txt
Swift
  ↓
binary
  ↓
Node.js
```

---

### file-clipboard

编译：

```bash
swiftc \
clipboard/file-clipboard.swift \
-o clipboard/file-clipboard.bin
```

---

### image-clipboard

编译：

```bash
swiftc \
clipboard/image-clipboard.swift \
-o clipboard/image-clipboard.bin
```

---

## Windows

Windows 不使用 Swift binary。

通过：

```txt
Node.js
    ↓
PowerShell
    ↓
Windows Clipboard API
```

实现。

不需要额外编译。

---

# 6. 编译命令

推荐 package.json：

```json
{
  "scripts": {
    "compile:file-clipboard":
      "swiftc clipboard/file-clipboard.swift -o clipboard/file-clipboard.bin",

    "compile:image-clipboard":
      "swiftc clipboard/image-clipboard.swift -o clipboard/image-clipboard.bin",

    "compile:clipboard":
      "npm run compile:file-clipboard && npm run compile:image-clipboard"
  }
}
```

编译全部：

```bash
npm run compile:clipboard
```

单独编译：

```bash
npm run compile:file-clipboard

npm run compile:image-clipboard
```

---

# 7. 测试

## File Clipboard

写入：

```bash
clipboard/file-clipboard.bin \
write \
/Users/zzz/Desktop/a.png
```

读取：

```bash
clipboard/file-clipboard.bin read
```

输出：

```json
[
  "/Users/zzz/Desktop/a.png"
]
```

---

## Image Clipboard

截图到剪贴板：

```bash
screencapture -c
```

读取：

```bash
clipboard/image-clipboard.bin \
read \
/Users/zzz/Desktop/result.png
```

成功后生成：

```txt
result.png
```

---

注意：

不要使用 Finder：

```txt
选择图片文件
    ↓
Cmd + C
```

测试图片读取。

Finder 复制图片文件时通常复制：

```txt
文件引用
```

不是：

```txt
图片数据
```

这种情况应该使用：

```js
readClipboardFile()
```

---

# 8. 设计原则

## index.js 是唯一入口

外部只依赖：

```txt
clipboard/index.js
```

内部实现可以自由调整。

---

## File Clipboard 与 Image Clipboard 不合并

原因：

File Clipboard：

```txt
文件引用
```

Image Clipboard：

```txt
图片数据
```

两者属于不同系统能力。

---

## Native 实现与 JavaScript 分离

macOS：

```txt
Swift
 ↓
binary
 ↓
JavaScript
```

Windows：

```txt
PowerShell
 ↓
JavaScript
```

JavaScript 层只负责统一 API。

---

## 返回值约定

### Text

返回：

```js
string
```

---

### File

返回：

```js
string[]
```

---

### Image

读取：

```js
outputPath
```

写入：

```js
imagePath
```

---

# 9. 发布检查

确认包含：

```txt
clipboard/index.js

clipboard/text-clipboard.js

clipboard/file-clipboard.js

clipboard/image-clipboard.js

clipboard/process.js

clipboard/file-clipboard.bin

clipboard/image-clipboard.bin
```

检查：

```bash
npm pack --dry-run
```

确认 binary 权限：

```bash
chmod +x clipboard/file-clipboard.bin
chmod +x clipboard/image-clipboard.bin
```

Git 权限：

```bash
git ls-files -s \
clipboard/file-clipboard.bin \
clipboard/image-clipboard.bin
```

应显示：

```txt
100755
```

表示可执行权限已保存。
