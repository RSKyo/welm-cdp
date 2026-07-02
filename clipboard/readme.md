## 编译 file-clipboard.swift

编译命令：

```bash
swiftc clipboard/native/file-clipboard.swift -o clipboard/native/file-clipboard.bin
```

也可以添加到 package.json

```json
 "scripts": {
    "compile:file-clipboard": "swiftc clipboard/file-clipboard.swift -o clipboard/file-clipboard.bin"
  },
```

然后运行：

```bash
npm run compile:file-clipboard
```

测试写入：

```bash
clipboard/file-clipboard.bin write /Users/xxx/Desktop/a.png
```

测试读取：

```bash
clipboard/file-clipboard.bin read
```

输出类似：

```bash
["/Users/zzz/Desktop/a.png"]
```

然后你可以在 Finder、聊天输入框、支持文件粘贴的网页里试 `Cmd + V`。
