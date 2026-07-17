# File System API

`welm-cdp/fs` 提供本地文件的同步读写、移动、复制、删除、重命名及递归扫描能力。

```js
import {
  moveFileTo,
  copyFileTo,
  removeFile,
  renameFile,
  readFileText,
  writeFileText,
  readFileJson,
  writeFileJson,
  readFileBuffer,
  writeFileBuffer,
  readFileBase64,
  writeFileBase64,
  scanFiles,
  scanDirs,
} from "welm-cdp/fs";
```

全部 API 都是同步方法；不要在高并发或需要保持事件循环响应的热路径中调用。

## API 一览

### 文件操作

| 方法 | 返回值 | 特殊行为 |
| --- | --- | --- |
| `moveFileTo(filePath, toFilePath, options?)` | `string` | 跨文件系统自动回退为复制后删除 |
| `copyFileTo(filePath, toFilePath, options?)` | `string` | 默认不覆盖 |
| `removeFile(filePath)` | `boolean` | 删除已有普通文件 |
| `renameFile(filePath, name)` | `string` | 仅同目录改名；可保留原扩展名 |

### 内容读写

| 方法 | 返回值 | 内容类型 |
| --- | --- | --- |
| `readFileText(filePath, options?)` | `string` | 文本 |
| `writeFileText(filePath, text, options?)` | `string` | 文本 |
| `readFileJson(filePath, options?)` | `*` | JSON |
| `writeFileJson(filePath, value, options?)` | `string` | JSON |
| `readFileBuffer(filePath)` | `Buffer` | 二进制 |
| `writeFileBuffer(filePath, buffer, options?)` | `string` | `Buffer` 或 `Uint8Array` |
| `readFileBase64(filePath)` | `string` | Base64 |
| `writeFileBase64(filePath, base64, options?)` | `string` | Base64 或 Base64 data URL |

### 递归扫描

| 方法 | 返回值 | 扫描范围 |
| --- | --- | --- |
| `scanFiles(input, options?)` | `FileEntry[]` | 一个文件，或目录树中的全部文件 |
| `scanDirs(dirPath, options?)` | `DirEntry[]` | 目录树中的全部子目录，不含根目录 |

## 通用写入行为

所有写入、复制与移动方法都会自动创建缺失的父目录。

`overwrite` 默认都是 `false`：如果目标文件已存在，`moveFileTo()`、`copyFileTo()` 及全部 `writeFile...()` 方法都直接返回目标路径，**不会修改目标，也不会抛出“已存在”错误**。

需要明确覆盖时：

```js
writeFileText("/tmp/config.txt", "new content", {
  overwrite: true,
});
```

## 文件操作详情

### `moveFileTo(filePath, toFilePath, options?)`

```js
const newPath = moveFileTo("/tmp/a.txt", "/backup/a.txt");
```

- 源路径必须是已有普通文件。
- `toFilePath` 若已存在，必须也是普通文件。
- `overwrite: true` 时，先删除已有目标文件，再移动。
- 源与目标解析后相同，直接返回原路径。
- 跨设备移动遇到 `EXDEV` 时，自动复制后删除源文件。

### `copyFileTo(filePath, toFilePath, options?)`

```js
const copiedPath = copyFileTo("/tmp/a.txt", "/backup/a.txt", {
  overwrite: true,
});
```

- 源路径必须是已有普通文件。
- `overwrite: true` 时覆盖已有目标文件；默认不覆盖。
- 源与目标解析后相同，直接返回原路径。

### `removeFile(filePath)`

```js
removeFile("/tmp/a.txt");
```

- 路径必须是已有普通文件，否则抛出异常。
- 成功后返回 `true`。
- 这是不可恢复的删除操作。

### `renameFile(filePath, name)`

```js
const newPath = renameFile("/tmp/a.txt", "b");
// /tmp/b.txt
```

- `name` 必须是非空纯文件名，不能包含 macOS 或 Windows 路径分隔符。
- 新名称未包含扩展名时，保留原文件扩展名；包含扩展名时使用新扩展名。
- 目标文件已经存在时抛出异常；该方法没有 `overwrite` 选项。
- 只在原目录内改名。

## 内容读写详情

### 文本与 JSON

| 方法 | Options | 特殊说明 |
| --- | --- | --- |
| `readFileText(filePath, { encoding = "utf8" })` | `encoding` | 返回文本内容 |
| `writeFileText(filePath, text, { encoding = "utf8", overwrite = false })` | `encoding`、`overwrite` | `text` 必须是字符串，可为空 |
| `readFileJson(filePath, { encoding = "utf8" })` | `encoding` | 会移除 UTF-8 BOM 后再 `JSON.parse()` |
| `writeFileJson(filePath, value, { spaces = 2, finalNewline = true, encoding = "utf8", overwrite = false })` | 如左 | 使用 `JSON.stringify()`；不可序列化值直接抛出异常 |

### 二进制与 Base64

| 方法 | Options | 特殊说明 |
| --- | --- | --- |
| `readFileBuffer(filePath)` | 无 | 返回 `Buffer` |
| `writeFileBuffer(filePath, buffer, { overwrite = false })` | `overwrite` | `buffer` 必须是 `Buffer` 或 `Uint8Array` |
| `readFileBase64(filePath)` | 无 | 返回不带 data URL 前缀的 Base64 字符串 |
| `writeFileBase64(filePath, base64, { overwrite = false })` | `overwrite` | 支持 `data:*;base64,...` 前缀；会去除所有空白 |

Base64 输入不是字符串、包含非法字符或长度无效时，`writeFileBase64()` 会抛出 `invalid base64`。

## 扫描 Options

| 选项 | 类型 | 默认值 | `scanFiles` | `scanDirs` | 说明 |
| --- | --- | --- | --- | --- | --- |
| `includeExts` | `string \| string[]` | 无 | 是 | 否 | 仅包含这些扩展名；可写 `.mp3` 或 `mp3` |
| `excludeExts` | `string \| string[]` | 无 | 是 | 否 | 排除这些扩展名 |
| `includeKeywords` | `string \| string[]` | 无 | 是 | 是 | 名称包含任一关键字才返回 |
| `excludeKeywords` | `string \| string[]` | 无 | 是 | 是 | 名称包含任一关键字时排除 |
| `includeHidden` | `boolean` | `false` | 是 | 是 | 是否包含以 `.` 开头的文件或目录 |

扩展名与关键字比较都忽略大小写。传入空数组等同于不设置该过滤器；传入空白字符串会抛出异常。

## 扫描详情

### `scanFiles(input, options?)`

```js
const files = scanFiles("/music", {
  includeExts: [".mp3", "flac"],
  excludeKeywords: ["demo"],
});
```

- `input` 可为单个文件或目录。
- 输入不存在、隐藏（默认）或不是普通文件/目录时，返回 `[]`。
- 目录输入会递归扫描所有子目录，只返回文件条目。
- 过滤只决定条目是否返回，不会阻止进入不匹配的父目录。

### `scanDirs(dirPath, options?)`

```js
const dirs = scanDirs("/music", {
  includeKeywords: "album",
});
```

- `dirPath` 必须是目录；不存在或不是目录时返回 `[]`。
- 递归返回全部子目录，不包含输入的根目录。
- `includeExts`、`excludeExts` 不适用于目录。
- 过滤只决定目录是否返回，不会阻止继续遍历该目录。

### 扫描条目结构

```js
// FileEntry
{
  root: "/",
  dir: "/music",
  base: "song.mp3",
  ext: ".mp3",
  name: "song",
  filePath: "/music/song.mp3",
}

// DirEntry
{
  root: "/",
  dir: "/music",
  base: "album",
  ext: "",
  name: "album",
  dirPath: "/music/album",
}
```