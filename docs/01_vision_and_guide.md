# Skill Hub for Mac - 新手安利与最终愿景

## 1. 什么是 Skill 和 MCP？(新手安利向)

如果你最近开始接触 **Vibe Coding**（即通过与 AI 对话来编写代码，比如使用 Cursor、OpenCode、Windsurf 等工具），你一定会遇到一个词：**Skill（技能）** 或者 **MCP（Model Context Protocol，模型上下文协议）**。

### 简单来说：
- **AI 的大脑是孤立的**：大语言模型（如 Claude、GPT-4）虽然聪明，但它们默认无法直接读取你本地的文件、无法操作你的 Jira、无法连接你的公司数据库。
- **MCP 是桥梁**：由 Anthropic（Claude 的母公司）提出的 MCP 协议，就像是给 AI 安装的“USB 接口”。通过这个标准协议，AI 可以安全地连接到外部工具和数据源。
- **Skill 是具体的工具包**：一个 Skill 就是一个实现了 MCP 协议的插件。比如“Jira Skill”让 AI 能读写 Jira 任务，“GitHub Skill”让 AI 能提 PR。

### 为什么你需要关注它？
在 Vibe Coding 时代，**AI 的能力上限取决于它能使用的工具（Skills）**。拥有强大的本地化、定制化 Skills，意味着你的 AI 助手可以帮你完成从写代码、查文档、到部署上线的一条龙服务。

---

## 2. 为什么我们需要一个本地的 Mac 桌面端？

目前市场上有很多 Skill 聚合网站（如 skillsmp.com、smithery.ai），它们提供了海量的公共 Skills。但它们存在几个痛点：
1. **太复杂、太臃肿**：网页端充斥着各种复杂的配置和不相关的推荐，对于只想安静写代码的开发者来说，噪音太大。
2. **缺乏本地联动**：网页上的 Skill 很难一键同步到你本地的 Cursor 或 OpenCode 中，往往需要手动复制配置、安装依赖。
3. **隐私与企业安全**：很多公司内部的业务（如内部 API、私有 GitLab、自建 Jira）需要定制专属的内部 Skills。这些绝对不能放到公共网站上。

**Skill Hub for Mac 的诞生就是为了解决这些问题：**
它是一个**轻量、极简、完全本地化**的桌面管理工具。它只做三件事：**发现、管理、一键同步**。

---

## 3. 最终愿景清单 (Ultimate Vision)

我们的目标是将 Skill Hub 打造为 Vibe Coding 时代的“Homebrew”或“App Store”，但它完全属于你个人。

- [x] **极简的本地管理**：像管理 Mac 本地应用一样管理你的 AI Skills，清晰的列表、一键启用/禁用。
- [x] **无缝的 IDE 联动**：检测本地安装的 Vibe Coding 工具（Cursor, OpenCode, Windsurf），一键将 Skill 配置同步过去，无需手动改 JSON。
- [x] **企业级私有化支持**：支持快速创建、调试和打包公司内部专属的 Skills，数据完全保留在本地，不经过任何第三方服务器。
- [x] **全网聚合爬虫**：内置爬虫引擎，自动从 skillsmp.com、GitHub 等主流平台抓取最新、最热的公共 Skills，在本地形成你的私人技能库。
- [x] **AI 智能推荐与搜索**：接入本地大模型（如 Ollama）或云端 API，当你输入“我想处理 Excel”时，AI 自动为你搜索并推荐最合适的本地或线上 Skill。
- [x] **开箱即用的快捷创建**：提供脚手架模板，让你在 1 分钟内用 TypeScript 或 Python 初始化一个全新的自定义 Skill。

---

## 4. 强大的 CLI 支持

除了 GUI，我们还提供了强大的命令行工具，支持自动化同步和脚本化操作。你可以使用 `xskill sync --all` 一键同步所有技能，或者使用 `xskill create --name <name>` 快速创建新技能。

详细使用说明请参考 [CLI Guide](./CLI.md)。
