# Dialog API

`welm-cdp/dialog` 提供 macOS 与 Windows 的原生文件系统对话框。

```js
import {
  selectFolder,
  selectFile,
  selectFiles,
  selectSavePath,
} from "welm-cdp/dialog";
```

## API 一览

| 方法 | 返回值 | 用途 |
| --- | --- | --- |
| `selectFolder(options?)` | `Promise<string \| null>` | 选择一个目录 |
| `selectFile(options?)` | `Promise<string \| null>` | 选择一个文件 |
| `selectFiles(options?)` | `Promise<string[] \| null>` | 选择多个文件 |
| `selectSavePath(options?)` | `Promise<string \| null>` | 选择要保存到的目标路径 |

## Options 清单

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- |
| `dialogTitle` | `string` | 因方法而异 | 原生对话框标题或描述 |

| 方法 | 默认 `dialogTitle` |
| --- | --- |
| `selectFolder()` | `"Choose Folder"` |
| `selectFile()` | `"Choose File"` |
| `selectFiles()` | `"Choose Files"` |
| `selectSavePath()` | `"Save File"` |

当前不提供初始目录、默认文件名或文件类型过滤等 options。

## API 详情

### `selectFolder(options?)`

```js
const folderPath = await selectFolder({
  dialogTitle: "Choose Audio Root",
});
```

- 返回选中的目录路径；取消时返回 `null`。
- 用户取消不会抛出异常。

### `selectFile(options?)`

```js
const filePath = await selectFile({
  dialogTitle: "Choose Config File",
});
```

- 返回选中的文件路径；取消时返回 `null`。
- 只允许选择一个文件。

### `selectFiles(options?)`

```js
const filePaths = await selectFiles({
  dialogTitle: "Choose Media Files",
});

if (filePaths !== null) {
  for (const filePath of filePaths) {
    console.log(filePath);
  }
}
```

- 返回选中的文件路径数组；取消时返回 `null`，不是空数组。
- 可选择多个文件。

### `selectSavePath(options?)`

```js
const outputPath = await selectSavePath({
  dialogTitle: "Save Screenshot",
});

if (outputPath !== null) {
  await writeFileBuffer(outputPath, imageBuffer);
}
```

- 返回用户选择的目标路径；取消时返回 `null`。
- **只选择路径，不创建、不写入文件。** 调用方负责后续写入。

## 平台与构建

| 平台 | 实现 |
| --- | --- |
| macOS | 编译后的 `dialog.bin` 原生程序 |
| Windows | PowerShell + `System.Windows.Forms` |

macOS 需要先构建原生程序：

```bash
npm run build:macos:dialog
```

如果 `dialog.bin` 缺失，导入模块时会抛出错误。Windows 不依赖该 binary。

不支持的平台统一抛出：

```text
Unsupported platform: PLATFORM
```