# XSkill 项目总蓝图与开发计划 (Master TODO)

本文件记录了从项目构想到最终完整版发布的全部任务清单。当前正在进行的阶段是 **Phase 2: 快捷创建与内部生态闭环**。

---

## Phase 1: MVP (最小可行性产品) - ✅ 已完成
- [x] **初始化项目架构**: 使用 Tauri v2 (Rust) + React 18 + Vite + Tailwind CSS 初始化基础目录结构。
- [x] **UI 框架搭建**: 引入 shadcn/ui，搭建符合 Mac 原生体验的极简 Dashboard (Sidebar, Header, 技能卡片)。
- [x] **Rust 模块重构**: 将 `main.rs` 拆分为 `commands.rs`, `config.rs`, `crawler.rs`, `feed_parser.rs`, `git_manager.rs`, `ide_sync.rs`。
- [x] **IDE 配置同步逻辑**: 实现 Rust 后端精准解析和安全合并 Mac 本地 Cursor (`cline_mcp_settings.json`) 与 OpenCode (`mcp.json`) 的 MCP 配置。
- [x] **前后端联调通信**: 前端点击 `Sync Cursor`/`Sync OpenCode` 能够成功调用 Rust 写入本地文件系统并反馈结果。
- [x] **环境排坑**: 解决并记录 Rust 编译器版本 `edition2024` (time-core) 与 `Cargo.lock` 版本兼容性导致的底层依赖报错。

---

## Phase 2: 快捷创建与内部生态闭环 - ✅ 基本完成

### 2.1 快捷创建脚手架 (Scaffolding)
- [x] **添加 Tauri Dialog 依赖**: 在 `src-tauri/Cargo.toml` 中引入 `tauri-plugin-dialog`，用于调出 Mac 原生的文件/目录选择器。
- [x] **后端生成逻辑**: 在 `src-tauri/src/scaffold.rs` 实现生成标准 MCP (TS/Python) 模板文件的代码（如 `package.json`, `index.ts`）。
- [x] **自动化初始化**: 模板生成后，Rust 在后台通过 `std::process::Command` 自动执行 `git init` 并在对应目录执行 `npm install`。
- [x] **前端弹窗与交互**: 将顶部 `[+ New Skill]` 改造成表单弹窗 (包含 Name, Description, 语言单选, 本地路径选择)。接入 Loading 态与成功 Toast 反馈。

### 2.2 内部订阅源与 Git 分发 (Internal Feeds)
- [x] **订阅配置管理**: 允许用户在前端“设置”页配置内部 Git 仓库的 `registry.json` (Custom Feed URL)。
- [x] **订阅解析器 (Feed Parser)**: Rust 定时拉取并解析配置的 URL，返回 JSON 给前端展示，标记为 `[Internal]`。
- [x] **Git 克隆与拉取 (Git Manager)**: 用户点击“安装”时，Rust 在后台静默执行 `git clone`，点击“更新”时执行 `git pull`。
- [ ] **一键分享/发布**: 在脚手架写完 Skill 后，前端提供“Share to Internal”按钮，自动生成 JSON 配置片段并引导用户向内部 Git 仓库提交 PR。

### 2.5 智能接管与中心化重构 (Onboarding & Centralization) - 🚀 New
- [x] **中心化存储迁移**: 
  - [x] 确定 `~/.xskill/skills` 为默认存储路径。
  - [x] 重构 `skill_manager.rs`，确保新安装的 Skill 都在此目录下。
- [x] **指纹识别模块 (Fingerprinting)**:
  - [x] 实现 `fingerprint.rs`，计算目录内容的 SHA256 哈希（忽略 .git, node_modules, dist 等）。
  - [x] 验证哈希算法在不同目录路径下的稳定性。
- [x] **全盘扫描与接管 (Onboarding)**:
  - [x] 实现 `onboarding.rs`，扫描 `~/.cursor`, `~/.claude` 等常见配置路径，解析已引用的 MCP Server。
  - [x] 前端实现 "Import Skills" 向导，列出扫描到的外部 Skills。
  - [x] 支持 "Move" (移动) 和 "Copy" (复制) 两种接管模式。
- [ ] **多源导入**:
  - [ ] 支持直接输入 Git URL 导入。
  - [ ] 支持选择本地文件夹导入。

## Phase 3: 市场聚合与 AI 智能化 - ⏳ 待处理

### 3.1 爬虫模块 (Crawler)
- [ ] **GitHub 官方源**: 定期抓取官方 MCP 仓库的更新，同步到本地客户端的 Marketplace 模块。
- [ ] **第三方市场源**: 抓取 `skillsmp.com` 等主流供应站的公开数据，提供一键克隆安装功能。

### 3.2 技能配置管理 (Skill Configuration) - 🛠️ 重构
- [ ] **参数化配置面板**:
  - [ ] 废弃单一的“环境变量表单”，改为完整的 **MCP Server 配置编辑器**。
  - [ ] 支持编辑 `command` (可执行文件路径/npx), `args` (启动参数数组), `env` (环境变量键值对)。
  - [ ] 对于本地 Skill，自动填充 `command` 为 `node /path/to/index.js` 或 `python ...`。
- [ ] **敏感数据加密**:
  - [ ] 引入 `tauri-plugin-stronghold` 或使用系统 Keychain 存储 API Keys。
  - [ ] 确保 `env` 中的敏感值在 UI 上默认掩码显示。
- [ ] **动态表单生成**:
  - [ ] (可选) 支持解析 `mcp.json` schema，为特定 Skill 生成定制化表单（如文件选择器、下拉框）。

### 3.3 AI 智能搜索
- [ ] **本地/云端 LLM 接入**: 支持配置本地 Ollama 或 OpenAI/Anthropic API Key。
- [ ] **自然语言匹配**: 用户输入“帮我处理 Excel”，系统调用模型分析意图，并从本地已安装或在线 Marketplace 中推荐最相关的 MCP 插件。

---

## Phase 4: 自动化发布与产品化 - ⏳ 待处理

### 4.1 UI 体验极致化
- [ ] **Mac 系统托盘**: 实现 Menu Bar 小图标，支持在桌面顶栏快速查看 Skill 状态与一键同步。
- [ ] **真数据持久化**: 将目前前端的 Dummy Data 替换为通过 `tauri-plugin-store` (或 SQLite) 读写的真实本地状态。

### 4.2 GitHub Actions CI/CD
- [x] **自动化测试流**: 配置 `.github/workflows`，代码推送到 main 时自动进行 Lint、TS Check 和 Rust `cargo check`。
- [x] **自动化打包 Mac 版本**: 配置 Tag Release 流水线，调用 `tauri build`，自动生成跨平台芯片支持的 `.dmg` 安装包。
- [x] **自动化 Release 发布**: 生成 DMG 后自动上传为 GitHub Release 附件供用户直接下载。

### 4.3 文档完善
- [ ] **新手入门安利指南**: 基于现有思路，输出一篇针对 Vibe Coding 和 MCP 概念的白皮书/软文。
- [ ] **开源 README 修缮**: 增加架构图、动图演示和使用手册，准备正式开源。

---

## 当前阶段验证计划 (Phase 2)
- [ ] 点击 `New Skill` 走通全流程，选择一个空目录。
- [ ] 检查生成的目录是否包含正确的 TS/Python 代码。
- [ ] 检查目标目录是否已经 `git init` 且有 `node_modules`。

## 当前阶段复盘 (Retrospective)
- **待填写**: 当 Phase 2 完成后，在这里总结本次开发的顺利点和踩过的坑。
