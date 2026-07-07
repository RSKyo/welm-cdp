# Dialog Module

本目录用于封装系统文件对话框能力。

当前支持：

* Folder Dialog：选择目录
* File Dialog：选择单个文件
* Files Dialog：选择多个文件
* Save Dialog：选择保存位置

---

## 目录结构

```txt
dialog/
├── dialog.js              # 对话框能力
├── process.js             # 本地程序执行封装
│
├── dialog.swift           # macOS 实现
├── dialog.bin             # macOS 编译产物
│
└── readme.md
```

目录采用平铺结构。

---

# 1. 对外 API

提供四个能力：

```js
selectFolder(options)

selectFile(options)

selectFiles(options)

selectSaveFile(options)
```

支持：

```js
{
  dialogTitle: "Choose Folder"
}
```

示例：

```js
import {
  selectFolder,
  selectFile,
  selectFiles,
  selectSaveFile,
} from "welm-cdp/dialog";
```

---

# 2. Folder Dialog

选择一个目录。

```js
const folder = await selectFolder();
```

返回：

```txt
/Users/zzz/Music
```

取消：

```js
null
```

常见用途：

* Audio Library
* Workspace
* Export Directory
* Scan Directory

---

# 3. File Dialog

选择一个已有文件。

```js
const file = await selectFile();
```

返回：

```txt
/Users/zzz/Desktop/a.mp3
```

取消：

```js
null
```

适用于：

* 打开配置文件
* 打开媒体文件
* 导入数据

---

# 4. Files Dialog

选择多个已有文件。

```js
const files = await selectFiles();
```

返回：

```js
[
  "/Users/zzz/a.mp3",
  "/Users/zzz/b.mp3",
]
```

取消：

```js
null
```

适用于：

* 批量导入
* 批量处理
* 多文件扫描

---

# 5. Save Dialog

选择保存位置。

```js
const output = await selectSaveFile();
```

返回：

```txt
/Users/zzz/Desktop/output.json
```

取消：

```js
null
```

注意：

Save Dialog 不负责保存文件。

它仅返回：

```txt
目标文件路径
```

真正保存文件应由业务代码完成。

例如：

```js
const output = await selectSaveFile();

if (output) {
  await fs.writeFile(output, data);
}
```

---

# 6. dialogTitle

所有接口支持：

```js
{
  dialogTitle: "Choose Audio Library"
}
```

例如：

```js
await selectFolder({
  dialogTitle: "Choose Audio Library",
});
```

未指定时使用默认标题：

```txt
Folder

Choose Folder
```

```txt
File

Choose File
```

```txt
Files

Choose Files
```

```txt
Save

Save File
```

---

# 7. process.js

本目录使用：

```js
runProgram()

runPowerShell()
```

封装系统调用。

---

## runProgram()

macOS：

```txt
JavaScript
    ↓
process.js
    ↓
dialog.bin
    ↓
Swift
```

---

## runPowerShell()

Windows：

```txt
JavaScript
    ↓
process.js
    ↓
PowerShell
    ↓
Windows Forms Dialog
```

---

# 8. 平台实现

## macOS

使用：

```txt
Swift

↓

dialog.bin

↓

Node.js
```

编译：

```bash
swiftc dialog/dialog.swift -o dialog/dialog.bin
```

或者：

```bash
npm run compile:dialog
```

---

## Windows

Windows 不使用 Swift。

通过：

```txt
Node.js

↓

PowerShell

↓

FolderBrowserDialog

OpenFileDialog

SaveFileDialog
```

实现。

无需编译。

---

# 9. 测试

选择目录：

```bash
dialog/dialog.bin folder
```

指定标题：

```bash
dialog/dialog.bin folder "Choose Audio Library"
```

选择文件：

```bash
dialog/dialog.bin file
```

选择多个文件：

```bash
dialog/dialog.bin files
```

保存：

```bash
dialog/dialog.bin save
```

---

# 10. Node 示例

目录：

```js
const folder = await selectFolder();
```

文件：

```js
const file = await selectFile();
```

多个文件：

```js
const files = await selectFiles();
```

保存：

```js
const output = await selectSaveFile();

if (output) {
  await fs.writeFile(output, data);
}
```

---

# 11. 设计原则

## 一个接口对应一种对话框

```txt
selectFolder()

selectFile()

selectFiles()

selectSaveFile()
```

保持职责单一。

---

## Save Dialog 仅负责路径选择

它不会：

* 创建文件
* 写入文件
* 复制文件

只返回：

```txt
目标路径
```

---

## JavaScript 与 Native 分离

macOS：

```txt
JavaScript

↓

Swift
```

Windows：

```txt
JavaScript

↓

PowerShell
```

JavaScript 层提供统一 API。

---

## 返回值约定

Folder：

```js
string | null
```

File：

```js
string | null
```

Files：

```js
string[] | null
```

Save：

```js
string | null
```

---

# 12. 发布检查

确认包含：

```txt
dialog/dialog.js

dialog/process.js

dialog/dialog.swift

dialog/dialog.bin
```

检查：

```bash
npm pack --dry-run
```

确认：

```bash
chmod +x dialog/dialog.bin
```

Git 权限：

```bash
git ls-files -s dialog/dialog.bin
```

应显示：

```txt
100755
```

表示可执行权限已经保存。
