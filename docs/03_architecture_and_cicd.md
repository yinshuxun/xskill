# Skill Hub for Mac - 技术架构与自动化发布计划

## 1. 技术栈选择 (Tech Stack)

为了保证 Mac 桌面端的轻量化、高性能以及较小的安装包体积，我们放弃传统的 Electron，选择 **Tauri** 作为底层框架。

- **核心框架**: Tauri v2 (基于 Rust，极小体积，原生性能)
- **前端框架**: React 18 + TypeScript + Vite
- **UI 组件库**: Tailwind CSS + shadcn/ui (提供极简、现代的 Mac 风格 UI)
- **本地存储**: Tauri 官方插件 `tauri-plugin-store` (基于 JSON) 或 `tauri-plugin-sql` (SQLite)
- **爬虫模块**: Rust 后端实现异步 HTTP 请求 (reqwest) 和 HTML 解析 (scraper)，保证抓取效率。
- **AI 模块**: 前端通过 HTTP 调用本地 Ollama 接口或云端大模型 API。

---

## 2. 项目结构设计 (Project Structure)

```text
skill-hub-mac/
├── src-tauri/               # Rust 后端代码 (Tauri)
│   ├── src/
│   │   ├── main.rs          # 入口文件
│   │   ├── commands.rs      # 前后端通信接口 (IDE同步、文件读写)
│   │   ├── crawler.rs       # 市场爬虫逻辑
│   │   ├── feed_parser.rs   # 内部订阅源解析逻辑
│   │   ├── git_manager.rs   # Git 仓库克隆与更新逻辑
│   │   └── config.rs        # 本地配置管理
│   ├── tauri.conf.json      # Tauri 配置文件
│   └── Cargo.toml           # Rust 依赖管理
├── src/                     # 前端代码 (React)
│   ├── components/          # UI 组件 (shadcn/ui)
│   ├── pages/               # 页面视图 (列表页、市场页、设置页)
│   ├── hooks/               # 自定义 Hooks
│   ├── lib/                 # 工具函数 (API 调用、状态管理)
│   ├── App.tsx              # 前端入口
│   └── main.tsx
├── package.json             # Node 依赖管理
└── .github/
    └── workflows/           # GitHub Actions CI/CD 配置
```

---

## 3. 核心模块技术方案

### 3.1 IDE 配置文件同步
- **原理**：Cursor、Claude Desktop 等工具的 MCP 配置通常存储在特定的本地路径（如 `~/Library/Application Support/Cursor/User/globalStorage/.../mcp.json`）。
- **实现**：Rust 后端提供 `sync_to_ide` 命令，读取目标 JSON 文件，将 Skill Hub 中启用的技能合并进去，并写回文件。

### 3.2 市场爬虫
- **原理**：定期请求目标网站（如 skillsmp.com 的 API 或 HTML），解析出 Skill 的 GitHub 仓库地址、描述和安装命令。
- **实现**：使用 Rust 的 `reqwest` 库发起请求，数据缓存在本地 SQLite 中，前端通过分页读取。

### 3.3 快捷创建脚手架
- **实现**：在 `src-tauri` 中内置基础的 MCP 模板压缩包。用户点击创建时，Rust 后端将模板解压到用户指定目录，并调用系统命令执行 `npm install`。

### 3.4 内部技能分发与订阅 (Internal Skill Feeds)
- **原理**：通过读取公司内部 Git 仓库托管的 `registry.json` 文件，实现去中心化的内部技能分发。
- **实现**：
  - `feed_parser.rs`：负责定时拉取和解析用户配置的多个订阅源 URL，将数据合并后提供给前端展示。
  - `git_manager.rs`：当用户点击安装内部 Skill 时，在后台静默执行 `git clone` 将仓库拉取到本地，并在更新时执行 `git pull`。
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

### 4.2 示例 Workflow (预览)
*(具体 YAML 将在开发阶段写入 `.github/workflows/release.yml`)*

```yaml
name: Release Mac App
on:
  push:
    tags:
      - 'v*'
jobs:
  build-and-release:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
      - name: Install frontend dependencies
        run: npm install
      - name: Build Tauri App
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Skill Hub ${{ github.ref_name }}'
          releaseBody: 'See the assets to download the latest version.'
          releaseDraft: false
          prerelease: false
```