# welm-cdp 设计演化记录（v1.0）

---

# 1. 项目目标

welm-cdp = 基于 Chrome CDP 的 CLI 自动化系统

核心目标：

- 控制 Chrome 浏览器（CDP）
- 提供 CLI 命令系统
- 支持自动化操作
- 未来支持 agent / workflow 编排
- capability 可组合生成业务流程

---

# 2. 架构演化阶段

---

## Stage 1：page.js 时代（已废弃）

### 结构

page.js = dom + input + wait + screenshot 混合

### 问题

- 职责混乱
- 无模块边界
- CLI + capability + registry 混合
- 难维护

---

## Stage 2：page 拆分阶段（已完成）

拆分为：

cmd/page/
  dom.js
  input.js
  wait.js
  screenshot.js

### 特点

- 按能力域拆分
- page abstraction 存在但已弱化
- capability 分组清晰

---

## Stage 3：page 完全删除阶段（当前）

最终结构：

cmd/
  dom.js
  input.js
  wait.js
  screenshot.js

### 特点

- page 概念完全移除
- domain-based command system
- flat command structure
- 无 index registry（已废弃）

---

## Stage 4：当前稳定架构模型

CLI
  ↓
cmd/dom.js | cmd/input.js | cmd/wait.js | cmd/screenshot.js
  ↓
CDP capability layer

---

# 3. 三层系统模型（最终定义）

---

## 1. CDP Capability 层（底层能力）

dom.js
input.js
wait.js
screenshot.js

特点：

- 原子能力
- 不含 CLI 语义
- 可复用
- 最底层执行逻辑

---

## 2. Command 层（当前核心层）

cmd/dom.js
cmd/input.js
cmd/wait.js
cmd/screenshot.js

特点：

- CLI 执行单元（command）
- handler(ctx) 结构
- argv + options
- 1:1 command → function
- 无 page abstraction
- 无 centralized registry

---

## 3. CLI Runtime（隐式存在）

run(argv)
→ resolve command group
→ execute handler

特点：

- 动态命令分发
- file-based loading
- 无 index.js registry

---

# 4. 关键设计原则

---

## 1. page abstraction 已废弃

page = 过渡结构（已删除）

---

## 2. command = 唯一执行单元

CLI 调用的所有都是 command：

- 单步命令
- 组合命令
- 业务级命令

---

## 3. cmd 不参与业务编排

cmd = 单步执行 + 调试入口

---

## 4. 业务不依赖 cmd

业务 = capability 组合  
不是 cmd 组合

---

# 5. 当前系统本质

welm-cdp = domain-based CLI command system over CDP capabilities

---

# 6. 当前未进入阶段（重要）

## Business Command Layer（未实现）

示例：

- loginFlow
- scrapeFlow
- captureSession
- exportData

特点：

- capability 组合
- 高层业务语义
- 非 CLI 单步命令

---

# 7. 思维模型（核心）

## 三个层级

CDP = 能力（what can be done）  
CMD = 执行单元（how CLI triggers it）  
BUSINESS = 能力组合（why / workflow）

---

# 8. 当前架构总结

你当前系统：

✔ CLI CDP command system  
❌ 非 business workflow system  

---

# 9. 当前稳定结论

- page 已删除
- cmd = CLI command groups
- capability 已分层
- business layer 未引入
- cmd ≠ business
- cmd ≠ capability

---

# 10. 新聊天启动记忆卡（极简）

welm-cdp 当前状态：

- page 已删除
- cmd/dom input wait screenshot 为 command groups
- command = CLI 执行单元
- business 未引入
- 不使用 page abstraction
- 不使用 index registry
- capability 与 cmd 已分层




welm-cdp 当前设计状态（v1.0）：

1. 架构已完成 page.js 阶段废弃
- page abstraction 已完全删除
- 不再存在 page 层

2. 当前目录结构：
cmd/
  dom.js
  input.js
  wait.js
  screenshot.js

3. 系统分层：

（1）CDP Capability 层
- dom.js / input.js / wait.js / screenshot.js
- 提供原子能力
- 不包含 CLI 语义

（2）Command 层（当前核心）
- cmd/dom.js 等
- CLI 执行单元（command）
- handler(ctx) 结构
- argv + options
- 1:1 command → function
- 无 index registry（无集中入口）

（3）CLI Runtime（隐式）
- run(argv)
- resolve command group
- execute handler

4. 核心设计原则：
- page 概念已彻底废弃
- command = CLI 唯一执行单元
- cmd 不参与业务编排
- business ≠ cmd（业务不通过 cmd 组合）
- capability 才是组合基础

5. 当前系统本质：
welm-cdp = domain-based CLI command system over CDP capabilities

6. 当前未引入层：
- business workflow layer（loginFlow / scrapeFlow 等未存在）

7. 思维模型：
CDP = 能力
CMD = 执行单元
BUSINESS = 能力组合（尚未实现）