# Skill Hub for Mac - 技术架构与自动化发布计划

## 1. 技术栈选择 (Tech Stack)

为了保证 Mac 桌面端的轻量化、高性能以及较小的安装包体积，我们放弃传统的 Electron，选择 **Tauri** 作为底层框架。

- **核心框架**: Tauri v2 (基于 Rust，极小体积，原生性能)
- **前端框架**: React 18 + TypeScript + Vite
- **UI 组件库**: Tailwind CSS + shadcn/ui (提供极简、现代的 Mac 风格 UI)
- **本地存储**: Tauri 官方插件 `tauri-plugin-store` (基于 JSON) 或 `tauri-plugin-sql` (SQLite)
- **网络层**: Rust 后端实现异步 HTTP 请求 (reqwest) 和 GitHub API 客户端。
- **AI 模块**: 前端通过 HTTP 调用本地 Ollama 接口或云端大模型 API。

---

## 2. 项目结构设计 (Project Structure)

```text
skill-hub-mac/
├── src-tauri/               # Rust 后端代码 (Tauri)
│   ├── src/
│   │   ├── main.rs          # 入口文件
│   │   ├── commands.rs      # 前后端通信接口
│   │   ├── scanner.rs       # 工作区扫描引擎 (New)
│   │   ├── github.rs        # GitHub API 客户端 (New)
│   │   ├── git_manager.rs   # Git 仓库克隆与更新逻辑
│   │   ├── config_manager.rs # 技能配置管理
│   │   ├── ide_sync.rs      # IDE 同步逻辑
│   │   └── lib.rs           # 库入口
│   ├── tauri.conf.json      # Tauri 配置文件
│   └── Cargo.toml           # Rust 依赖管理
├── src/                     # 前端代码 (React)
│   ├── components/          # UI 组件 (shadcn/ui)
│   ├── pages/               # 页面视图
│   ├── hooks/               # 自定义 Hooks
│   ├── lib/                 # 工具函数
│   ├── App.tsx              # 前端入口
│   └── main.tsx
├── package.json             # Node 依赖管理
└── .github/
    └── workflows/           # GitHub Actions CI/CD 配置
```

---

## 3. 核心模块技术方案

### 3.1 IDE 配置文件同步与中心化管理
- **中心化存储**：Skill Hub 使用 `~/.xskill/skills` 作为 Skills 的默认存储中心。
- **配置注入**：Rust 后端提供 `sync_to_ide` 命令，读取目标 JSON 文件，将 Skill Hub 中启用的技能配置（Command, Args, Env）精准注入到对应 IDE 的配置中。

### 3.2 工作区扫描与智能发现 (Workspace Scanner)
- **原理**：不再局限于单一的存储目录，而是主动扫描用户的代码工作区（如 `~/workspace`）。
- **实现**：
  - `scanner.rs`: 使用 `walkdir` 递归扫描配置的根目录。
  - **项目识别**：通过 `.git` 目录识别项目根路径。
  - **技能识别**：检测项目中是否包含 `mcp.json`、`package.json` (含 mcp 关键词) 或 `AGENTS.md`。
- **价值**：实现“零配置”接入，用户现有的项目即是技能库。

### 3.3 远程仓库集成 (Remote Fetcher)
- **原理**：直接与 GitHub API 交互，获取最新的 Skills 和 Rules，不依赖中间服务器。
- **实现**：
  - `github.rs`: 使用 `reqwest` 实现 GitHub API 客户端。
  - **智能解析**：支持解析 `github.com` 和 `raw.githubusercontent.com` 链接，自动处理分支和路径。
  - **内容获取**：直接拉取 `AGENTS.md` 或 `mcp.json` 内容。

### 3.4 技能配置与安全存储 (Skill Configuration)
- **原理**：MCP Server 的配置是一个复杂的 JSON 对象，包含 `command`, `args`, `env` 等字段。
- **实现**：
  - `config_manager.rs`: 负责加载和保存每个 Skill 的用户自定义配置。
  - **动态表单**：前端根据 Skill 元数据生成配置表单。
  - **安全存储**：敏感数据加密存储。

### 3.5 技能套件 (Suites/Kits)
- **概念**：将一组 Skills (工具) 和 Rules (规范/AGENTS.md) 打包成一个“套件”。
- **工作流**：用户选择一个项目，点击“应用套件”，系统自动配置好所有工具并写入规范文件，实现一键环境就绪。

---

## 4. 自动化构建与发布 (CI/CD Pipeline)

我们将使用 GitHub Actions 实现代码推送到 `main` 分支或打 Tag 时，自动构建并发布 Mac 的 `.dmg` 安装包。

### 4.1 GitHub Actions 工作流设计

**触发条件**：
- 当推送带有 `v*` 前缀的 Tag 时（例如 `v1.0.0`）。

**执行步骤**：
1. **环境准备**：检出代码，设置 Node.js 和 Rust 环境。
2. **安装依赖**：执行 `npm install` 安装前端依赖。
3. **前端构建**：执行 `npm run build` 编译 React 代码。
4. **Tauri 构建**：执行 `npm run tauri build`，Rust 编译器将打包生成 `.app` 和 `.dmg` 文件。
5. **自动发布 (Release)**：使用 `softprops/action-gh-release` 插件，自动在 GitHub 仓库创建一个新的 Release，并将生成的 `.dmg` 文件作为附件上传。
