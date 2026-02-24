# Skill Hub for Mac - 产品需求文档 (PRD)

## 1. 产品定位
一款专为 Vibe Coding 开发者设计的 Mac 桌面端应用，用于本地化管理、创建、同步和发现 AI Skills (基于 MCP 协议)。主打轻量、极简、隐私安全。

## 2. 核心用户场景
- **场景 A (内部定制)**：开发者小王需要写一个读取公司内部知识库的 Skill，他使用 Skill Hub 快速创建模板，本地调试后，一键同步到自己的 OpenCode 中使用。
- **场景 B (公共发现)**：开发者小李想找一个能操作 Figma 的 Skill，他在 Skill Hub 中搜索，工具通过爬虫从公共市场拉取了最新的 Figma MCP，小李点击“安装到 Cursor”，即可直接使用。
- **场景 C (多工具切换)**：开发者小张同时使用 Cursor 和 Windsurf，他在 Skill Hub 中统一管理所有 Skills，任何修改都会自动同步到这两个 IDE 的配置文件中。

---

## 3. 需求清单 (Feature List)

### 3.1 本地技能管理 (Local Skill Management)
- **中心化仓库 (Central Repository)**：
  - 采用 "Install once, use everywhere" 理念。
  - 所有托管的 Skills 统一存储在 `~/.xskill/skills` (可配置) 目录下。
  - 支持从 Git 仓库、本地文件夹、压缩包导入 Skill 到中心仓库。
- **技能列表视图**：展示本地已安装的所有 Skills，包含名称、描述、图标、来源（本地创建/市场下载/导入）、状态（启用/禁用）。
- **技能详情页**：查看 Skill 的具体配置（环境变量、执行命令、参数说明）。
- **快捷创建 (Scaffolding)**：
  - 提供官方标准模板（TypeScript / Python）。
  - 一键生成项目结构，自动执行 `npm install` 或 `pip install`。
- **智能导入与接管 (Onboarding & Migration)**：
  - **自动扫描**：启动时扫描常见的 IDE 配置文件 (Cursor, Claude, OpenCode) 和目录。
  - **指纹识别 (Fingerprinting)**：通过计算目录内容哈希，识别不同位置的重复 Skill。
  - **一键接管**：提供向导将散落在各处的 Skills 移动或复制到中心仓库统一管理。
- **本地化存储**：所有配置和元数据存储在本地 SQLite 或 JSON 文件中，确保企业数据绝对安全。

### 3.1.1 三层存储架构 (Three-Tier Storage Architecture)

参考 `skills-hub` 竞品设计，XSkill 采用三层架构组织 Skill 的物理存储：

| Tier | 路径（默认） | 说明 |
|------|------------|------|
| **Hub** | `~/.xskill/skills/` | 全局中心仓库，所有工具共享，是 Source of Truth |
| **Agent** | `~/.cursor/skills/`, `~/.config/opencode/skills/`, etc. | 各 AI 工具的全局 Skills 目录 |
| **Project** | `<project>/.cursor/skills/`, `<project>/.agent/skills/`, etc. | 单个项目内的 Skills |

**操作语义：**
- **Sync (Copy)**：从 Hub 复制到 Agent/Project 目录，独立副本，互不影响
- **Sync (Link)**：从 Hub 创建 Symlink 到 Agent/Project 目录，Hub 修改即时生效
- **Collect**：逆向将 Agent/Project 层的 Skill 归集到 Hub，统一管理

**卡片 UI 设计（已实现）：**
- Tier 指示器：用彩色 Badge 区分 Hub（蓝）、Agent（橙）、Project（紫）
- Agent 徽章：展示该 Skill 已同步到哪些 AI 工具（16 个 Agent 图标，见 `docs/supported-agents.md`）
- Sync 下拉菜单：Copy / Link 两种模式
- Collect 按钮：将 Agent/Project 层 Skill 归集到 Hub


### 3.2 多 IDE 快捷同步 (IDE Integration)
- **环境检测**：自动扫描 Mac 本地安装的 Vibe Coding 工具（支持 Cursor, OpenCode, Windsurf, Claude Desktop 等）。
- **配置生成与注入 (Config Generation)**：
  - 基于 Skill 的定义（Command, Args, Env）生成标准的 MCP JSON 配置。
  - 自动将配置注入到对应 IDE 的配置文件中（如 `claude_desktop_config.json` 或 `mcp.json`）。
- **多 Profile 支持**：允许为不同项目或 IDE 创建不同的配置组合（例如：Project A 使用 Skill X+Y，Project B 使用 Skill Z）。

### 3.3 技能配置管理 (Skill Configuration)
- **参数化配置 (Parameterized Config)**：
  - 不仅仅是环境变量，支持对 MCP Server 的 `command` (执行命令) 和 `args` (启动参数) 进行完整配置。
  - 例如：为 `filesystem` Server 配置允许访问的目录路径 (Args)，为 `weather` Server 配置 API Key (Env)。
- **动态表单 (Dynamic Form)**：
  - 解析 Skill 的元数据（如果存在），生成友好的配置表单。
  - 对于通用 Skill，提供 JSON 编辑器或 Key-Value 编辑器。
- **敏感数据安全**：API Keys 等敏感信息使用系统 Keychain 或加密存储，绝不明文保存于 Git 仓库中。
- **公共市场聚合**：内置爬虫模块，定期从主流供应商（如 skillsmp.com, smithery.ai, GitHub MCP 官方仓库）抓取热门 Skills。
- **统一搜索**：在本地客户端内直接搜索全网 Skills。
- **一键安装**：解析远程仓库，自动克隆代码、安装依赖并注册到本地库。

### 3.4 内部技能分发与订阅 (Internal Skill Feeds)
- **自定义订阅源**：允许用户在设置中添加自定义的 JSON 订阅源 URL（例如公司内部 GitLab 的 `registry.json` Raw URL）。
- **多源聚合**：客户端将内置公共源与用户添加的内部源数据聚合展示，并使用标签（如 `[Public]`, `[Internal]`）进行区分。
- **一键分享/发布**：当用户在本地使用“快捷创建”开发完一个 Skill 后，提供“分享到内部”按钮，自动生成配置代码并引导用户向内部 Git 仓库提交 PR。

### 3.4 AI 智能搜索与推荐 (AI-Powered Search)
- **自然语言搜索**：用户输入“帮我找一个能查天气的工具”，系统通过 AI 匹配最合适的 Skill。
- **本地模型支持**：支持配置本地 Ollama 模型或 OpenAI/Anthropic API 进行语义搜索和推荐。
### 3.6 极简 UI/UX 设计
- **Mac 原生体验**：支持深色/浅色模式，毛玻璃效果，符合 macOS 设计规范。
- **系统托盘 (Menu Bar)**：支持在 Mac 顶部状态栏快速切换和查看 Skills 状态。

---

## 4. 进度完成清单 (Roadmap & TODOs)

### Phase 1: MVP (最小可行性产品)
- [ ] 确定技术栈并初始化项目结构。
- [ ] 实现本地 SQLite/JSON 存储逻辑。
- [ ] 实现基础 UI：技能列表、添加/删除技能。
- [ ] 实现 IDE 同步核心逻辑（解析和修改 Cursor/Claude 配置文件）。

### Phase 2: 核心功能扩展
- [ ] 实现“快捷创建”脚手架功能（TS/Python 模板）。
- [ ] 实现环境变量统一管理面板。
- [ ] 接入爬虫模块，抓取 GitHub 官方 MCP 仓库数据。

### Phase 3: 智能化与全网聚合
- [ ] 完善爬虫，接入 skillsmp.com 等第三方市场。
- [ ] 接入 AI 模型配置界面，实现自然语言搜索。
- [ ] 优化 UI 细节，添加系统托盘支持。

### Phase 4: 自动化与发布
- [ ] 配置 GitHub Actions 自动化测试。
- [ ] 配置自动化构建流程，生成 Mac `.dmg` 安装包。
- [ ] 编写用户使用手册和开源 README。