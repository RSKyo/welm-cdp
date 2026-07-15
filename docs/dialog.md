# Dialog

Last modified: 2026-07-16

`dialog.js` 提供 macOS 和 Windows 原生文件系统选择对话框，用于：

- 选择一个目录；
- 选择一个文件；
- 选择多个文件；
- 选择保存文件时使用的目标路径。

当前支持的平台：

| 平台 | 实现方式 |
| --- | --- |
| macOS | Swift 编译的原生程序 `dialog/dialog.bin` |
| Windows | PowerShell + `System.Windows.Forms` |
| Linux 和其它平台 | 不支持 |

Dialog 模块不依赖 Chrome，也不使用 CDP。它只是作为 `welm-cdp` 中的本地系统能力统一对外提供。

## Package Export

`package.json` 将 Dialog 模块导出为：

```json
{
  "exports": {
    "./dialog": "./dialog/dialog.js"
  }
}
```

其它项目应通过公共入口导入：

```js
import {
  selectFolder,
  selectFile,
  selectFiles,
  selectSavePath,
} from "welm-cdp/dialog";
```

不应依赖包内部路径：

```js
// 不推荐
import { selectFolder } from "welm-cdp/dialog/dialog.js";
```

`dialog/process.js`、Swift 源码和编译后的 binary 都属于内部实现，不通过 `package.json` 单独导出。

如果直接在当前项目中使用：

```js
import {
  selectFolder,
  selectFile,
  selectFiles,
  selectSavePath,
} from "./dialog/dialog.js";
```

## 快速开始

选择目录：

```js
import { selectFolder } from "welm-cdp/dialog";

const folderPath = await selectFolder({
  dialogTitle: "Choose Audio Root",
});

if (folderPath === null) {
  console.log("User cancelled");
} else {
  console.log(folderPath);
}
```

选择多个文件：

```js
import { selectFiles } from "welm-cdp/dialog";

const filePaths = await selectFiles({
  dialogTitle: "Choose Audio Files",
});

if (filePaths !== null) {
  for (const filePath of filePaths) {
    console.log(filePath);
  }
}
```

## 导出方法

### `selectFolder(options)`

打开原生目录选择对话框。

```js
const folderPath = await selectFolder();
```

自定义标题：

```js
const folderPath = await selectFolder({
  dialogTitle: "Choose Music Library",
});
```

默认标题：

```text
Choose Folder
```

返回值：

```js
Promise<string | null>
```

- 用户选择目录时，返回所选目录路径；
- 用户取消时，返回 `null`。

### `selectFile(options)`

打开原生单文件选择对话框。

```js
const filePath = await selectFile();
```

自定义标题：

```js
const filePath = await selectFile({
  dialogTitle: "Choose Config File",
});
```

默认标题：

```text
Choose File
```

返回值：

```js
Promise<string | null>
```

- 用户选择文件时，返回所选文件路径；
- 用户取消时，返回 `null`。

### `selectFiles(options)`

打开原生多文件选择对话框。

```js
const filePaths = await selectFiles();
```

自定义标题：

```js
const filePaths = await selectFiles({
  dialogTitle: "Choose Media Files",
});
```

默认标题：

```text
Choose Files
```

返回值：

```js
Promise<string[] | null>
```

- 用户选择文件时，返回所选文件路径数组；
- 即使只选择一个文件，仍返回数组；
- 用户取消时，返回 `null`。

### `selectSavePath(options)`

打开原生保存对话框，让用户选择目标文件路径。

```js
const filePath = await selectSavePath();
```

自定义标题：

```js
const filePath = await selectSavePath({
  dialogTitle: "Save Screenshot",
});
```

默认标题：

```text
Save File
```

返回值：

```js
Promise<string | null>
```

- 用户确认时，返回所选择的目标路径；
- 用户取消时，返回 `null`。

该方法只选择路径，不会创建或写入文件。调用方需要自行保存内容：

```js
import fs from "node:fs/promises";
import { selectSavePath } from "welm-cdp/dialog";

const filePath = await selectSavePath({
  dialogTitle: "Save Screenshot",
});

if (filePath !== null) {
  await fs.writeFile(filePath, imageBuffer);
}
```

## Options

所有导出方法都支持：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `dialogTitle` | 根据方法决定 | 原生对话框的标题或说明文字 |

各方法的默认标题：

| 方法 | 默认标题 |
| --- | --- |
| `selectFolder()` | `"Choose Folder"` |
| `selectFile()` | `"Choose File"` |
| `selectFiles()` | `"Choose Files"` |
| `selectSavePath()` | `"Save File"` |

当前没有提供初始目录、默认文件名或文件类型过滤选项。

## macOS

### 实现方式

macOS 使用 Swift 编写的原生程序：

```text
dialog/dialog.swift
```

编译结果：

```text
dialog/dialog.bin
```

`dialog.js` 根据操作向原生程序传入不同命令：

| JavaScript 方法 | Native 命令 |
| --- | --- |
| `selectFolder()` | `folder` |
| `selectFile()` | `file` |
| `selectFiles()` | `files` |
| `selectSavePath()` | `save` |

例如：

```js
await runProgram(dialogBin, "folder", title);
```

### Binary 检查

只有在 macOS 上导入模块时，才会检查 `dialog.bin`：

```js
const dialogBin =
  process.platform === "darwin"
    ? assertDialogBin()
    : null;
```

binary 不存在时抛出：

```text
dialog binary not found: PATH. Run: npm run build:macos:dialog
```

Windows 不会检查或使用这个 binary。

## Package Scripts

`package.json` 提供以下 macOS 原生工具构建脚本：

```json
{
  "scripts": {
    "build:macos:dialog": "swiftc dialog/dialog.swift -o dialog/dialog.bin",

    "build:macos:file-clipboard": "swiftc clipboard/file-clipboard.swift -o clipboard/file-clipboard.bin",
    "build:macos:image-clipboard": "swiftc clipboard/image-clipboard.swift -o clipboard/image-clipboard.bin",
    "build:macos:clipboard": "npm run build:macos:file-clipboard && npm run build:macos:image-clipboard",

    "build:macos": "npm run build:macos:dialog && npm run build:macos:clipboard"
  }
}
```

### 只构建 Dialog

```bash
npm run build:macos:dialog
```

该命令执行：

```bash
swiftc dialog/dialog.swift -o dialog/dialog.bin
```

它会将 Swift 源码编译为可执行的 `dialog/dialog.bin`。

### 构建全部 Clipboard 原生程序

```bash
npm run build:macos:clipboard
```

它会依次执行：

```text
build:macos:file-clipboard
build:macos:image-clipboard
```

### 构建全部 macOS 原生程序

```bash
npm run build:macos
```

它会依次执行：

```text
build:macos:dialog
build:macos:clipboard
```

如果只修改了 Dialog，运行 `npm run build:macos:dialog` 即可。

执行构建前，需要在 macOS 上安装可用的 Swift 编译器，通常由 Xcode Command Line Tools 提供。

`package.json` 没有配置自动执行这些构建命令的 `prepare`、`prepack` 或 `postinstall` 脚本，因此构建原生程序是显式操作。

## Windows

Windows 不使用 Swift binary，而是通过 PowerShell 创建 `System.Windows.Forms` 对话框：

| 功能 | Windows 类型 |
| --- | --- |
| 选择目录 | `FolderBrowserDialog` |
| 选择一个文件 | `OpenFileDialog` + `Multiselect = false` |
| 选择多个文件 | `OpenFileDialog` + `Multiselect = true` |
| 选择保存路径 | `SaveFileDialog` |

Windows 不需要运行 `build:macos:*` 脚本。

运行环境需要：

- Windows PowerShell；
- 可用的 `System.Windows.Forms`；
- 允许 Node.js 启动 PowerShell 子进程。

多文件选择通过下面的方式强制序列化为 JSON 数组：

```powershell
ConvertTo-Json -InputObject @($dialog.FileNames) -Compress
```

因此，选择一个或多个文件都会解析为 JavaScript 数组。

## 用户取消

macOS 原生程序和 Windows PowerShell 都使用退出码 `2` 表示用户取消。

`dialog.js` 同时识别数字和字符串形式：

```js
error.code === 2 || error.code === "2"
```

取消属于正常操作，不会抛出异常。所有公开方法统一返回：

```js
null
```

推荐显式处理：

```js
const filePath = await selectFile();

if (filePath === null) {
  return;
}

await processFile(filePath);
```

## 错误处理

除用户取消外的错误会被包装后重新抛出。

错误消息格式：

```text
selectFolder failed: MESSAGE
selectFile failed: MESSAGE
selectFiles failed: MESSAGE
selectSavePath failed: MESSAGE
```

错误内容按以下顺序选择：

1. `error.stderr?.trim()`；
2. `error.message`；
3. 方法对应的默认错误信息。

不支持的平台会直接抛出：

```text
Unsupported platform: PLATFORM
```

例如，在 Linux 上调用时：

```text
Unsupported platform: linux
```

## 推荐使用方式

### 选择并保存文件

```js
import fs from "node:fs/promises";
import { selectSavePath } from "welm-cdp/dialog";

export async function saveImage(imageBuffer) {
  const filePath = await selectSavePath({
    dialogTitle: "Save Image",
  });

  if (filePath === null) {
    return null;
  }

  await fs.writeFile(filePath, imageBuffer);

  return filePath;
}
```

### 选择项目根目录

```js
import { selectFolder } from "welm-cdp/dialog";

export async function chooseRoot() {
  const folderPath = await selectFolder({
    dialogTitle: "Choose Project Root",
  });

  if (folderPath === null) {
    return null;
  }

  await config.set("project.root", folderPath);

  return folderPath;
}
```

## 注意事项

- 当前只支持 macOS 和 Windows。
- 用户取消时返回 `null`，不会抛出异常。
- `selectSavePath()` 只返回目标路径，不会创建或写入文件。
- `selectFiles()` 选择一个文件时仍返回数组。
- macOS 使用前必须确保 `dialog/dialog.bin` 已完成构建。
- 单独构建 Dialog 使用 `npm run build:macos:dialog`。
- 构建所有 macOS 原生程序使用 `npm run build:macos`。
- Windows 不依赖 `dialog.bin`，也不需要执行 macOS 构建脚本。
- 应通过 `welm-cdp/dialog` 导入，不应依赖包内部路径。