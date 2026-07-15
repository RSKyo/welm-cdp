# FS

Last modified: 2026-07-16

`welm-cdp/fs` 提供同步的本地文件系统工具，包含文件操作、文本/JSON/二进制/Base64 读写，以及递归文件和目录扫描。

该入口不是 `node:fs` 的重新导出。它在 `node:fs` 之上提供更具体的便捷方法，例如自动创建父目录、默认禁止覆盖，以及生成统一的扫描结果。

## Package Export

`package.json` 将模块导出为：

```json
{
  "exports": {
    "./fs": "./fs/index.js"
  }
}
```

其它项目通过公共入口导入：

```js
import {
  readFileText,
  writeFileJson,
  copyFileTo,
  scanFiles,
} from "welm-cdp/fs";
```

不要依赖包内部文件：

```js
// 不推荐
import { scanFiles } from "welm-cdp/fs/scan.js";
```

## 特性

- 所有方法均为同步方法；
- 写文件时自动创建缺失的父目录；
- 写入、复制和移动默认不覆盖已有文件；
- 支持文本、JSON、Buffer、`Uint8Array` 和 Base64；
- 支持递归扫描文件和子目录；
- 支持扩展名、名称关键词和隐藏项过滤；
- 扫描结果包含由 `node:path.parse()` 生成的路径字段。

## 快速开始

```js
import {
  writeFileJson,
  readFileJson,
  scanFiles,
} from "welm-cdp/fs";

writeFileJson(
  "./data/config.json",
  { enabled: true },
  { overwrite: true },
);

const config = readFileJson("./data/config.json");

const jsonFiles = scanFiles("./data", {
  includeExts: ["json"],
});
```

## 文件操作

### `moveFileTo(filePath, toFilePath, options)`

移动文件。目标父目录不存在时会自动创建；跨文件系统移动时会自动改用复制后删除源文件。

```js
const targetPath = moveFileTo(
  "./temp/report.txt",
  "./archive/report.txt",
  { overwrite: true },
);
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `overwrite` | `false` | 是否覆盖已存在的目标文件 |

当目标文件已存在且 `overwrite` 为 `false` 时，不移动源文件，直接返回目标路径。源路径和目标路径指向同一文件时，也直接返回源路径。

返回目标文件路径 `string`。

### `copyFileTo(filePath, toFilePath, options)`

复制文件，并自动创建目标父目录。

```js
const targetPath = copyFileTo(
  "./report.txt",
  "./backup/report.txt",
);
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `overwrite` | `false` | 是否覆盖已存在的目标文件 |

当目标文件已存在且不允许覆盖时，直接返回目标路径。返回值为 `string`。

### `removeFile(filePath)`

删除一个已存在的文件：

```js
removeFile("./temp/report.txt");
```

删除成功返回 `true`。路径不存在或指向目录时抛出错误。

### `renameFile(filePath, name)`

在原目录中重命名文件：

```js
const newPath = renameFile("./report.txt", "final");
// ./final.txt
```

如果 `name` 没有扩展名，会保留原扩展名。`name` 只能是文件名，不能包含目录路径。目标文件已存在时抛出错误。

## 文本和 JSON

### `readFileText(filePath, options)`

读取文本文件：

```js
const text = readFileText("./notes.txt");
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `encoding` | `"utf8"` | Node.js 支持的文本编码 |

返回文件内容字符串。

### `writeFileText(filePath, text, options)`

写入文本文件，允许写入空字符串：

```js
writeFileText("./notes.txt", "hello", {
  overwrite: true,
});
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `encoding` | `"utf8"` | 文本编码 |
| `overwrite` | `false` | 是否覆盖已有文件 |

返回目标文件路径。

### `readFileJson(filePath, options)`

读取并解析 JSON 文件。文件开头的 UTF-8 BOM 会被自动移除。

```js
const value = readFileJson("./config.json");
```

支持 `options.encoding`，默认值为 `"utf8"`。返回 `JSON.parse()` 的解析结果。

### `writeFileJson(filePath, value, options)`

序列化并写入 JSON：

```js
writeFileJson("./config.json", { enabled: true }, {
  spaces: 2,
  finalNewline: true,
  overwrite: true,
});
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `spaces` | `2` | JSON 缩进空格数 |
| `finalNewline` | `true` | 是否在末尾追加换行 |
| `encoding` | `"utf8"` | 文本编码 |
| `overwrite` | `false` | 是否覆盖已有文件 |

不能被 JSON 序列化的值会抛出错误。返回目标文件路径。

## Buffer 和 Base64

### `readFileBuffer(filePath)`

```js
const buffer = readFileBuffer("./image.png");
```

返回 Node.js `Buffer`。

### `writeFileBuffer(filePath, buffer, options)`

```js
writeFileBuffer("./image.png", buffer, {
  overwrite: true,
});
```

`buffer` 可以是 `Buffer` 或 `Uint8Array`。`options.overwrite` 默认为 `false`。

### `readFileBase64(filePath)`

```js
const base64 = readFileBase64("./image.png");
```

返回不带 Data URL 前缀的 Base64 字符串。

### `writeFileBase64(filePath, base64, options)`

```js
writeFileBase64("./image.png", base64, {
  overwrite: true,
});
```

支持纯 Base64 字符串以及带 `data:...;base64,` 前缀的 Data URL。`options.overwrite` 默认为 `false`。

## 扫描

### `scanFiles(input, options)`

递归扫描文件。`input` 可以是文件路径或目录路径。

```js
const files = scanFiles("./media", {
  includeExts: [".mp3", "flac"],
  excludeKeywords: ["demo", "temp"],
  includeHidden: false,
});
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `includeExts` | 未设置 | 只返回这些扩展名的文件 |
| `excludeExts` | 未设置 | 排除这些扩展名的文件 |
| `includeKeywords` | 未设置 | 文件名包含任一关键词时保留 |
| `excludeKeywords` | 未设置 | 文件名包含任一关键词时排除 |
| `includeHidden` | `false` | 是否包含隐藏文件和隐藏目录中的文件 |

扩展名和关键词不区分大小写。单个字符串和字符串数组都可以使用；空数组等同于未设置过滤条件。不存在的路径返回空数组。

每个结果包含：

```js
{
  root,
  dir,
  base,
  ext,
  name,
  filePath,
}
```

### `scanDirs(dirPath, options)`

递归扫描指定目录下的子目录，不包含根目录本身：

```js
const dirs = scanDirs("./media", {
  includeKeywords: ["album"],
  excludeKeywords: ["temp"],
});
```

支持 `includeKeywords`、`excludeKeywords` 和 `includeHidden`。关键词只决定目录是否出现在结果中，不会阻止继续遍历不匹配的父目录。

每个结果包含：

```js
{
  root,
  dir,
  base,
  ext,
  name,
  dirPath,
}
```

## 覆盖行为

所有写入、复制和移动方法默认都不会覆盖已有文件：

```js
writeFileText("./result.txt", "new content");
```

如果文件已经存在，方法返回目标路径并保留原内容。需要覆盖时显式传入：

```js
writeFileText("./result.txt", "new content", {
  overwrite: true,
});
```

## Command Adapter

`cmd/fs.js` 为项目 CLI 提供 `FS_COMMANDS`。命令适配层没有通过 `package.json` 对外导出，而是由项目内部的 CLI 路由注册。

提供的命令：

```text
fs move <source> <target>
fs copy <source> <target>
fs remove <file>
fs rename <file> <name>
fs read-text <file>
fs write-text <file> [text...]
fs read-json <file>
fs write-json <file> <json>
fs read-base64 <file>
fs write-base64 <file> <base64>
fs scan-files <path>
fs scan-dirs <path>
```

命令处理器接收的 `options` 会传给对应的 FS 方法，因此 CLI 解析器可以提供 `overwrite`、`encoding`、`spaces`、`finalNewline`、扫描过滤条件等选项。

Buffer 适合由 JavaScript 直接处理，因此命令适配层不提供 Buffer 的终端输入输出命令；需要通过终端传递二进制内容时，可以使用 Base64 命令。