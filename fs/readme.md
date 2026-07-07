# File System Module

本目录用于封装本地文件系统能力。

当前提供：

* Path Utilities：路径与目录操作
* File Utilities：文件读写
* Scan Utilities：文件和目录扫描

---

## 目录结构

```txt
fs/
├── index.js              # 文件系统统一入口
│
├── path.js               # 路径与目录工具
├── file.js               # 文件读写工具
├── scan.js               # 文件和目录扫描工具
│
└── readme.md
```

目录采用平铺结构。

`index.js` 作为统一入口：

```txt
index.js
    ├── path.js
    ├── file.js
    └── scan.js
```

具体实现保持独立。

---

# 1. 对外 API

通过 `index.js` 提供：

## Path

```js
exists(filePath)

isFile(filePath)

isDirectory(dirPath)

joinPath(...segments)

ensureDir(dirPath)

removeDir(dirPath)
```

---

## File

```js
readFileText(filePath, options)

writeFileText(filePath, text, options)

readFileJson(filePath, options)

writeFileJson(filePath, value, options)

readFileBuffer(filePath)

writeFileBuffer(filePath, buffer)

readFileBase64(filePath)

writeFileBase64(filePath, base64)
```

---

## Scan

```js
scanFiles(input, options)

scanDirs(dirPath, options)
```

---

# 2. Path Utilities

文件：

```txt
path.js
```

用于：

* 判断路径是否存在
* 判断文件类型
* 拼接路径
* 创建目录
* 删除目录

所有方法均为同步方法。

---

## exists()

判断路径是否存在。

```js
exists("/tmp/test")
```

返回：

```js
true | false
```

---

## isFile()

判断是否为文件。

```js
isFile("/tmp/test.txt")
```

返回：

```js
true | false
```

---

## isDirectory()

判断是否为目录。

```js
isDirectory("/tmp/music")
```

返回：

```js
true | false
```

---

## joinPath()

路径拼接：

```js
joinPath(
  "/Users/zzz",
  "Music",
  "a.mp3",
)
```

返回：

```txt
/Users/zzz/Music/a.mp3
```

---

## ensureDir()

创建目录。

```js
ensureDir("/tmp/cache/audio")
```

特点：

* 自动递归创建父目录
* 目录已存在不会失败

---

## removeDir()

删除目录。

```js
removeDir("/tmp/cache")
```

特点：

* 递归删除
* 目录不存在也成功

---

# 3. File Utilities

文件：

```txt
file.js
```

用于文件内容读写。

所有方法均为同步方法。

---

# Text

## readFileText()

读取文本：

```js
const text = readFileText(
  "/tmp/test.txt",
);
```

默认：

```txt
utf8
```

---

## writeFileText()

写入文本：

```js
writeFileText(
  "/tmp/test.txt",
  "hello",
);
```

特点：

* 自动创建父目录

例如：

```js
writeFileText(
  "/tmp/a/b/c.txt",
  "hello",
);
```

如果：

```txt
/tmp/a/b
```

不存在，会自动创建。

---

# JSON

## readFileJson()

读取 JSON：

```js
const config = readFileJson(
  "/tmp/config.json",
);
```

支持：

* UTF-8 BOM

---

## writeFileJson()

写入 JSON：

```js
writeFileJson(
  "/tmp/config.json",
  {
    name: "test",
  },
);
```

默认：

```json
{
  "name": "test"
}
```

格式：

* 2 空格缩进
* 最后一行换行

---

# Buffer

## readFileBuffer()

读取二进制：

```js
const buffer = readFileBuffer(
  "/tmp/image.png",
);
```

---

## writeFileBuffer()

写入二进制：

```js
writeFileBuffer(
  "/tmp/image.png",
  buffer,
);
```

支持：

```js
Buffer

Uint8Array
```

---

# Base64

## readFileBase64()

读取 Base64：

```js
const base64 = readFileBase64(
  "/tmp/image.png",
);
```

---

## writeFileBase64()

写入 Base64：

```js
writeFileBase64(
  "/tmp/image.png",
  base64,
);
```

支持：

```txt
data:image/png;base64,...
```

格式。

---

# 4. Scan Utilities

文件：

```txt
scan.js
```

用于递归扫描文件和目录。

---

# scanFiles()

扫描文件。

支持输入：

* 文件路径
* 目录路径

例如：

```js
scanFiles("/Users/zzz/Music")
```

返回：

```js
[
  {
    root,
    dir,
    base,
    ext,
    name,
    filePath,
  }
]
```

注意：

* 只返回文件
* 不返回目录

---

# scanDirs()

扫描目录。

例如：

```js
scanDirs("/Users/zzz/Music")
```

返回：

```js
[
  {
    root,
    dir,
    base,
    ext,
    name,
    dirPath,
  }
]
```

注意：

* 返回子目录
* 不包含输入根目录

---

# 5. Scan Options

## 文件扫描

`scanFiles()` 支持：

```js
{
  includeExts,
  excludeExts,
  includeKeywords,
  excludeKeywords,
  includeHidden,
}
```

---

## includeExts

包含指定扩展名：

```js
{
  includeExts: [
    ".mp3",
    ".flac",
  ]
}
```

也支持：

```js
{
  includeExts: [
    "mp3",
    "flac",
  ]
}
```

内部会自动补充：

```txt
.
```

---

## excludeExts

排除扩展名：

```js
{
  excludeExts:[
    ".jpg"
  ]
}
```

---

## includeKeywords

文件名包含关键字：

```js
{
  includeKeywords:[
    "live"
  ]
}
```

匹配：

```txt
concert-live.mp3
```

---

## excludeKeywords

排除关键字：

```js
{
  excludeKeywords:[
    "demo"
  ]
}
```

---

## includeHidden

默认：

```js
false
```

隐藏文件和目录不会返回。

开启：

```js
{
  includeHidden:true
}
```

---

# 6. 设计原则

## index.js 只是入口

```txt
index.js
    ↓
path.js
file.js
scan.js
```

不添加业务逻辑。

---

## 文件读写保持扁平

公共方法：

```js
readFileText()

writeFileText()

readFileJson()

writeFileJson()
```

不互相调用。

这样：

* API 清晰
* 调试简单
* 单个方法职责明确

---

## Path / File / Scan 分离

### path.js

关注：

```txt
路径
目录
```

---

### file.js

关注：

```txt
文件内容
```

---

### scan.js

关注：

```txt
文件发现
目录遍历
```

---

三个模块保持独立。

---

# 7. 使用示例

## 导入

```js
import {
  readFileJson,
  writeFileJson,
  scanFiles,
  ensureDir,
} from "./fs/index.js";
```

---

## 创建目录

```js
ensureDir("/tmp/project");
```

---

## 写 JSON

```js
writeFileJson(
  "/tmp/project/config.json",
  {
    name:"test",
  },
);
```

---

## 读取 JSON

```js
const config = readFileJson(
  "/tmp/project/config.json",
);
```

---

## 扫描音乐文件

```js
const files = scanFiles(
  "/Users/zzz/Music",
  {
    includeExts:[
      ".mp3",
      ".flac",
    ],
  },
);
```

---

# 8. 设计定位

`fs` 是基础能力模块。

它只负责：

```txt
文件系统能力
```

不负责：

* 业务规则
* 媒体解析
* 配置管理
* CLI 命令

上层模块应基于：

```txt
fs
```

组合业务能力。
