<div align="center">
  <img src="src/assets/app-icon.svg" width="120" alt="XSkill Logo" />
  <h1>XSkill: 跨端 AI Agent 技能协同中枢</h1>
  <p><strong>"Vibe Coding" 时代的数字资产调度器</strong></p>
</div>

---

## 🌟 项目背景 (Background)

随着 Cursor、Windsurf、Claude Desktop、Cline 等多款 AI 驱动的 IDE 及终端工具的爆发，我们正式进入了 **"Vibe Coding"** 的纪元。

然而，AI 编码工具的碎片化带来了一个致命痛点：**“上下文与技能孤岛”**。
- 你的 Cursor 积累了优秀的 `.cursor/skills` 或 `rules`。
- 你的 Windsurf 需要重新配置一遍系统提示词。
- 你的 CLI Agent (如 Claude Code) 找不到你在别处写好的专家级 Prompt。
- 团队间共享复杂的 AI 工作流（涵盖规则、依赖包、AST 工具）变得极其困难。

**XSkill** 是一款基于 **Tauri + Rust + React** 构建的轻量级桌面应用。它作为 AI Agent 的**中央技能 Hub**，致力于一键统一管理、分发、同步和应用全网的 AI 技能资产。

---

## 🚀 核心能力 (Core Capabilities)

1. **统一数字中枢 (Central Hub)**：将散落在各个项目、各大 IDE 中的 Skill 文件集中在 `~/.xskill/skills` 进行统一管理。
2. **跨端物理级同步 (Cross-Agent Sync)**：支持将单个技能通过 **Copy (硬拷贝)** 或 **Symlink (软链接)** 模式，一键下发至 Cursor、Windsurf、Claude 等本地 AI 工具的指定配置目录。
3. **工作区扫描与套装 (Project Scanner & Suites)**：
   - 自动扫描本地代码仓库（识别 Git、MCP 配置等）。
   - 将多个 Skill 与自定义 Prompt 打包成 **Suite (套装)**，一键注入到目标项目中（如生成 `AGENTS.md` 及 `.cursor/skills`）。
4. **开源技能市场 (Marketplace)**：对接云端 Skill 市场，支持通过 Github Tree URL 自动解析并**稀疏克隆 (Sparse-checkout)** 大仓库中的单一技能目录。

---

## 🎯 核心指标响应 (Competition Metrics)

### 1. 创新性 (Creativity)
* **视角的升维**：市面上的工具都在教人“如何写代码”，而 XSkill 瞄准的是**“如何管理帮你写代码的 AI”**。这是 AI 辅助编程领域的基础设施级创新。
* **物理层的联通**：首创通过 OS 级别的文件调度与软链接网络，打破不同商业 IDE 之间的壁垒，让一套 AI 资产可以在多个工具中“热更新”。

### 2. 技术难度 (Technical Difficulty)
* **复杂文件树调度**：Rust 后端需要处理防环检测（循环软链）、递归删除保护、以及隐藏目录探针等高危底层文件系统操作。
* **全生命周期沙箱测试**：为了防止 E2E 测试误删用户本地文件，自主设计了 `XSKILL_TEST_HOME` 环境变量沙箱层，实现了 100% 隔离的后端并发多线程集成测试。
* **AST 级 Monorepo 精准提取**：不依赖全量 Clone，后端通过组合 `git clone --filter=tree:0` 和 `git sparse-checkout`，实现了对 Github 庞大仓库（如 Vercel Next.js 源码）中单个子目录级技能的毫秒级精确无感拉取。
* **高性能 UI 渲染**：前端采用 Framer Motion 物理引擎驱动，搭载基于虚拟滚动的 Marketplace 瀑布流，保证渲染上千卡片时 60fps 满帧运行。

### 3. 实用性 (Practicality)
* **直击痛点**：对于任何深度依赖 AI 编程的开发者（即 Vibe Coder），在不同项目和工具间复制粘贴 `.cursorrules` 已经成为日常困扰。XSkill 让这一切变成了 1 秒钟的 GUI 点击。
* **开箱即用**：提供一键打开文件夹、一键复制绝对路径、多工具热插拔等高度贴合极客开发者直觉的快捷操作。
* **团队提效**：通过 Suite (套装) 功能，技术 TL 可以将架构规范打包成一个 Suite，团队成员一键 Apply 到本地项目即可让 AI 遵循统一架构标准。

### 4. 完成度 (Completeness)
XSkill 不是一个 Demo，而是一个**达到了生产可用级别（Production-Ready）**的完整数字产品：
* **架构完整**：Tauri (Rust) + Vite (React 19) + Tailwind CSS v4 的现代化重型客户端架构。
* **UI/UX 极致打磨**：遵循高级设计工程学（Bento UI、Liquid Glass Refraction、Spring Animation），实现了极佳的 macOS 级原生交互质感，支持完美的深/浅色模式无缝切换。
* **质量保证**：已接入 GitHub Actions，配备了完善的 React Component 单元测试和 Rust 核心链路 E2E 闭环集成测试，测试覆盖率高。
* **分发就绪**：应用图标、应用版本控制、打包产物机制均已完备，可直接打出 `.dmg` / `.app` 给用户安装使用。

---

<div align="center">
  <p><i>Made for the Vibe Coding Era.</i></p>
</div>
