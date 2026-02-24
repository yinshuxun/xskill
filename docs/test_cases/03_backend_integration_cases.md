# 后端集成测试用例 (Rust Integration)

这份文档涵盖了 Tauri/Rust 后端全生命周期级别的集成测试（Integration Level）。这些测试通过 `XSKILL_TEST_HOME` 环境变量将真实的文件系统操作指向一个临时的沙箱目录 (`TempDir`)，以确保在模拟真实跨模块协作时，**不会修改或破坏用户本地硬盘的配置及代码数据**。

## 技能全生命周期管理

### Case ID: `TC-BE-INT-001`
- **模块**: `integration_tests.rs`
- **测试名称**: 技能完整生命周期闭环 (`test_full_skill_lifecycle`)
- **关联代码**: 涵盖了 `scaffold.rs`、`config_manager.rs`、`ide_sync.rs`、`skill_manager.rs` 四个模块的核心逻辑。
- **前置条件**: 
  - `with_test_env` 准备就绪，所有的 `dirs::home_dir()` 全部指向临时创建的 `home_path` 沙箱。
- **测试步骤**:
  1. **创建 (Scaffold)**：调用 `create_skill` 生成一个名为 "test-integration-skill" 的技能，包含元数据 `xskill` 工具源和一些测试的脚手架内容。
  2. **探测与配置 (Config Auto-detect)**：手动在技能目录内写入 `package.json` 和 `index.js`，然后调用 `get_skill_config`。
  3. **自定义配置覆盖 (Save Custom Config)**：构建一个新的 `SkillConfig`（例如使用 `bun run index.ts`），调用 `save_skill_config` 持久化，再读取验证。
  4. **跨 Agent 同步 (Sync)**：调用 `sync_skill`，模式设定为 `"copy"`，目标设为 `"cursor"`。检查是否正确地拷贝到了沙箱的 `.cursor/skills` 下。
  5. **一键收集至 Hub (Collect)**：调用 `skill_collect_to_hub`，传入同步过去的路径，验证能否正确拷贝回中央 Hub（即 `.xskill/skills` 下）。
  6. **销毁清理 (Delete)**：调用 `delete_skill` 删除原始创建的技能。
- **预期结果**:
  - 创建后必须能从磁盘读到该文件夹。
  - 自动探测应识别出 `node` 命令，而二次读取时必须是 `bun`，证明配置文件正确被修改。
  - 同步操作返回已写入的目标路径列表，并且该路径实际存在于临时家目录结构中。
  - 收集操作无死循环、无误删（由于加入了防环检测逻辑）。
  - 删除操作执行后，源文件夹不复存在。

---

## 项目扫描与套装 (Suite) 闭环管理

### Case ID: `TC-BE-INT-002`
- **模块**: `integration_tests.rs`
- **测试名称**: 项目扫描与 Suite (套装) 管理 (`test_project_and_suite_management`)
- **关联代码**: 涵盖了 `scanner.rs` 和 `suite_manager.rs` 两个模块。
- **前置条件**:
  - `with_test_env` 准备就绪。
  - 在临时目录中创建一个伪造的项目文件夹 `my_awesome_project`。
  - 在该文件夹内创建 `.git` 目录，使其符合项目的最低识别标准。
- **测试步骤**:
  1. **扫描指定工作区 (Scan Workspace)**：调用 `scan_workspace`，并将临时目录作为附加的扫描根路径（`extra_roots`）传入。
  2. **项目断言**：读取扫描结果并验证被扫描出来的项目名称与伪造名称是否一致。
  3. **套装管理 - 写入 (Save Suite)**：手动创建一个 `Suite` 结构体，分配 ID 为 "suite_1"，配置系统级 Prompt "policy_rules" 以及对应的技能集合。调用 `save_suites` 保存该套装。
  4. **套装管理 - 读取 (Load Suite)**：随后立刻调用 `load_suites` 从沙箱磁盘读取套装数据。
- **预期结果**:
  - `scan_workspace` 的返回集中必须确切包含该项目，并且 `projects.len() == 1`。
  - 该项目的名称应精确匹配 `"my_awesome_project"`。
  - 读取回来的 `Suite` 数组长度必须为 1。
  - 解析得到的 Suite name 必须为 `"Test Suite"`。
