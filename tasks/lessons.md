# Vibe Coding & AI 协作经验沉淀 (Lessons Learned)

这份文档总结了在开发 `XSkill` 项目全周期中，与 AI Agent 结对编程所沉淀的最佳实践、高频踩坑点（Bug）及其解法，以及如何利用外部 Skill 提升工程与设计质量的实战经验。

---

## 🛠️ 一、AI 结对编程排错经验 (Bug Triage & Fixes)

在本项目开发中，遇到了几个 AI 经常容易忽略但极其致命的底层问题。通过与 AI 结对，我们总结了以下核心修复策略：

### 1. Tauri/Rust 跨端文件系统的高危操作
* **Bug 场景**: 在实现 "Collect to Hub" 技能同步时，如果用户把已经在 Hub 里的软链重新拉回 Hub，触发了 `copy_dir_all` 或删除逻辑，会导致源目录被**递归自删 (Self-deletion)**，造成严重的不可逆数据丢失。
* **AI 的盲区**: AI 往往会直白地生成 `if dst.exists() { fs::remove_dir_all(dst) }`，而忽略了文件系统的相对路径闭环或软链循环。
* **修复经验**: 强制要求 AI 在进行任何覆盖级 IO 操作前，先调用 `fs::canonicalize(&src)` 和 `fs::canonicalize(&dst)` 获取绝对物理路径。如果两者的解析路径相同，则立即 `return Ok()` 拦截操作。

### 2. Github Monorepo 级联目录拉取失败
* **Bug 场景**: 用户从 Marketplace 点击导入一个 Github Skill（如 `Next.js/.claude-plugin/xxx` 子目录），原生 `git clone` 会报错因为那不是一个 Repo 的根目录。
* **AI 的盲区**: 简单的 URL 正则拆分。当遇到带有树层级 (`/tree/main/`) 的 GitHub 链接时束手无策。
* **修复经验**: 引导 AI 使用 **Git Sparse-checkout（稀疏检出）** 配合 `--filter=tree:0`。首先 clone 一个极度轻量的空壳目录，开启 no-cone，单独 set 子目录，然后再进行 pull/checkout。这样能在几秒内精确拔取巨大仓库中的任意一个小 Skill 文件夹。

### 3. Tauri 前后端 IPC 变量名序列化断层
* **Bug 场景**: 前端调用 `invoke("install_skill_from_url", { repoUrl: url })` 报错提示 missing required key `repoUrl`。
* **AI 的盲区**: Rust 后端默认开启了警告，AI 在后端写了 `repoUrl` 但 Rust 规范是 `repo_url`。当 AI 单方面修改了 Rust 代码的命名而没有同步更新前端 TypeScript 时，Tauri 宏的自动序列化就会崩塌。
* **修复经验**: 在解决前后端交互报错时，优先排查宏注解函数的参数名是否采用了下划线风格 (snake_case)，并确保前端 payload 字典里的 Key 精确对应。

### 4. 并发测试环境下的“幽灵”竞争
* **Bug 场景**: 编写 E2E Rust 集成测试时，频繁报出 `os error 2` 找不到文件。
* **AI 的盲区**: `cargo test` 默认是多线程并发执行的。所有的测试用例都在同时修改同一个 `XSKILL_TEST_HOME` 环境变量并疯狂读写同一个模拟沙箱，导致互相覆盖和清空。
* **修复经验**: 在配置 CI 和 `package.json` 时，必须为全局环境变量依赖的集成测试加上 `cargo test -- --test-threads=1` 串行执行锁。

---

## 🎨 二、借助云端 Skill 进行架构与审美升维

在此项目中，我们通过引用外部的高阶提示词（Skill），极大提升了 AI 输出的代码质感和组件成熟度。

### 1. 使用 `taste-skill` 突破 UI 审美瓶颈
* **问题**: 默认的 LLM 倾向于生成具有强烈“AI 感”的 UI——紫色渐变滥用、居中对齐、默认卡片边框、生硬的页面切换。
* **引入**: 我们使用了 `https://github.com/Leonxlnx/taste-skill` 来约束大模型的前端行为。
* **成效**:
  * **字体的更换**: 强制 AI 从 `Inter` 切换至高级感的 `Geist Sans`。
  * **微动效引擎**: 引导 AI 引入并使用了 `framer-motion`。将生硬的列表替换为拥有 `spring (stiffness: 400)` 阻尼特性的平滑入场（Bento UI 级联入场）。
  * **阴影与质感**: 使用了无边框配合大范围弥散阴影 (`shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`)，替代了粗糙的 `border` 描边，实现了所谓的“液态玻璃”折射感。

---

## 🤖 三、Vibe Coding 完整实战心法 (Meta Lessons)

作为全生命周期主导者，在无需自己敲代码的前提下，把控一个中大型 Desktop App 落地的经验：

1. **分离“核心逻辑”与“宿主状态”**：
   对于 Tauri 应用，不要让 AI 把核心算法（如 `git_manager.rs`, `ide_sync.rs`）和前端弹窗事件（如 `window.emit`）紧紧绑在一起。必须强制要求 AI 拆分出一个独立的 `core_xxx` 函数，这不仅有利于防死锁，更是后续进行 Headless 集成测试（沙箱测试）的先决条件。
   
2. **测试先行，沙箱隔离 (TDD & Sandbox)**：
   让 AI 开发破坏性功能（增删改本地配置目录）时，**千万不要在真实的本机开发环境里裸跑**。
   * 第一步必须是要求 AI 实现一个能读取特定环境变量（如 `XSKILL_TEST_HOME`）的底层探测器。
   * 把所有的破坏性操作用例隔离在 `TempDir` 临时系统文件夹里跑完。等自动化用例 100% 绿灯时，再让前端开放这个按钮。这拦截了本项目开发中至少 3 次直接导致本地应用崩溃的删库危机。

3. **面对 UI/UX 不要说“不好看”，要提供具体的设计体系**：
   AI 对“美丑”没有概念，对“规范”却极其敏感。通过直接引入 `tailwind.css v4` 的高阶规范库或者开源设计 Skill（如 Taste Skill），把抽象的“想要高级感”转化为具体的 CSS 指令（如使用特定的阴影参数、特定的透明度），产出的界面就能从 Demo 级飞跃到商用级。

4. **全局思维：跨端调用的兜底机制**：
   当 AI 构建“去别的文件夹读文件”这类功能时，永远要问 AI 两个问题：
   * “如果目标目录包含隐藏文件（以 `.` 开头）或者多层软链，你的代码会不会死循环？”
   * “如果请求远端数据（如 reqwest 请求 Github），弱网环境下这个请求会不会永远挂起，阻塞掉整个 Tauri 后端进程？”（由此引入了全局超时控制和环路检测）。
