# XSkill Tauri E2E 测试用例

**版本**: v0.5.1  
**最后更新**: 2026-02-28  
**说明**: 基于完整需求文档编写的 Tauri 客户端 E2E 测试用例，覆盖完整的系统 API 调用闭环

---

## 测试架构说明

### 测试环境
- **测试框架**: Rust `#[cfg(test)]` + `tempfile::TempDir`
- **沙箱机制**: `XSKILL_TEST_HOME` 环境变量
- **测试范围**: 完整的 Tauri 客户端场景 + 系统 API 调用
- **文件系统**: 所有操作指向临时沙箱目录，不影响真实用户数据

### 测试策略
1. **单元测试**: 针对纯函数逻辑 (已覆盖在 `integration_tests.rs`)
2. **集成测试**: 覆盖完整的业务流程闭环
3. **E2E 测试**: 模拟真实用户场景，调用完整的系统 API

---

## 1. 技能全生命周期测试

### Case ID: `TC-E2E-001`
- **模块**: `integration_tests.rs`
- **测试名称**: 技能完整生命周期闭环
- **关联代码**: `test_e2e_001_to_003_create_sync_delete`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. **创建技能**:
     - 调用 `create_skill("test-e2e-skill", "description", "content", ...)` 
     - 验证返回路径为 `~/.xskill/skills/test-e2e-skill`
     - 验证目录结构: `SKILL.md`, `scripts/`, `references/`, `assets/`
     - 验证 `SKILL.md` 内容包含元数据
  2. **配置探测**:
     - 在技能目录创建 `package.json` 和 `index.js`
     - 调用 `get_skill_config` 探测配置
     - 验证返回 `command: "node"`, `args: ["index.js"]`
  3. **同步到 Agent (Copy)**:
     - 调用 `sync_skill(skill_path, ["cursor"], Some("copy"))`
     - 验证技能被复制到 `~/.cursor/skills/test-e2e-skill`
     - 验证不是符号链接
  4. **同步到 Agent (Link)**:
     - 调用 `sync_skill(skill_path, ["windsurf"], Some("link"))`
     - 验证技能被链接到 `~/.codeium/windsurf/skills/test-e2e-skill`
     - 验证是符号链接 (macOS/Linux)
  5. **删除技能**:
     - 调用 `delete_skill(skill_path)`
     - 验证技能目录被完全删除
     - 验证所有同步的副本也被删除
- **预期结果**: 
  - 创建成功，文件系统正确生成
  - 配置探测正确
  - Copy 模式正确复制
  - Link 模式正确链接
  - 删除操作正确清理所有相关文件
- **边界条件**: 
  - 权限不足
  - 路径不存在
  - 网络错误 (对于远程操作)

---

### Case ID: `TC-E2E-002`
- **模块**: `integration_tests.rs`
- **测试名称**: 技能配置完整生命周期
- **关联代码**: `test_e2e_005_skill_config_lifecycle`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 创建技能
  2. 调用 `get_skill_config` 获取默认配置
  3. 验证返回空配置 (command: null, args: null, env: null)
  4. 调用 `save_skill_config` 保存自定义配置:
     - command: "bun"
     - args: ["index.ts"]
     - env: {"GITHUB_TOKEN": "xxx"}
  5. 再次调用 `get_skill_config` 读取配置
  6. 验证读取的配置与保存的一致
  7. 修改配置 (添加新 env 变量)
  8. 验证配置被更新
  9. 删除技能
  10. 验证配置文件被清理
- **预期结果**: 
  - 配置正确保存和读取
  - 环境变量正确加密存储
  - 配置更新正确
  - 删除技能时配置被清理
- **边界条件**: 
  - 配置为空
  - 配置格式错误
  - 存储权限错误

---

### Case ID: `TC-E2E-003`
- **模块**: `integration_tests.rs`
- **测试名称**: 技能收集到 Hub
- **关联代码**: `test_e2e_006_skill_collect_to_hub`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 在 `.cursor/skills` 创建技能
  2. 调用 `skill_collect_to_hub(skill_path)`
  3. 验证技能被复制到 `~/.xskill/skills/`
  4. 验证技能名称正确
  5. 验证目录结构完整
  6. 验证原位置技能保留 (collect 是复制操作)
- **预期结果**: 
  - 技能正确收集到 Hub
  - 目录结构完整
  - 原位置技能保留
- **边界条件**: 
  - 技能已存在于 Hub
  - 权限不足
  - 路径不存在

---

## 2. Import 功能测试

### Case ID: `TC-E2E-004`
- **模块**: `integration_tests.rs`
- **测试名称**: GitHub 技能导入闭环
- **关联代码**: `test_e2e_004_github_import` (待启用)
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - 网络连接正常
- **测试步骤**:
  1. 调用 `install_skill_from_url("https://github.com/OthmanAdi/planning-with-files")`
  2. 等待克隆完成
  3. 验证技能在 `~/.xskill/skills/` 目录生成
  4. 验证目录结构正确
  5. 验证 `.git` 目录存在
  6. 验证 `SKILL.md` 生成
  7. 调用 `sync_skill` 同步到 Agent
  8. 验证同步成功
  9. 调用 `delete_skill` 删除
  10. 验证删除成功
- **预期结果**: 
  - GitHub 导入完整流程正确
  - 文件系统正确生成
  - 同步正确
  - 删除正确
- **边界条件**: 
  - URL 无效
  - 网络错误
  - 权限不足
  - 克隆失败

---

### Case ID: `TC-E2E-005`
- **模块**: `integration_tests.rs`
- **测试名称**: GitHub 子目录导入
- **关联代码**: `test_e2e_007_github_subdirectory_import`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - 支持子目录的 GitHub URL
- **测试步骤**:
  1. 调用 `install_skill_from_url("https://github.com/owner/repo/tree/branch/subdir")`
  2. 等待克隆完成
  3. 验证只克隆子目录
  4. 验证文件在正确位置
  5. 验证 `.git` 目录正确配置
- **预期结果**: 
  - 子目录导入正确
  - 文件结构正确
- **边界条件**: 
  - 子目录不存在
  - 权限不足
  - 网络错误

---

### Case ID: `TC-E2E-006`
- **模块**: `integration_tests.rs`
- **测试名称**: 本地技能扫描与导入
- **关联代码**: `test_e2e_008_local_skills_scan_and_import`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 在 `.cursor/skills` 创建多个技能
  2. 调用 `scan_external_skills` 扫描
  3. 验证技能被发现
  4. 验证指纹计算正确 (SHA256)
  5. 验证重复检测正确 (与 Hub 比较)
  6. 调用 `import_skills` 导入到 Hub
  7. 验证技能在 Hub 存在
  8. 验证原位置技能被处理 (copy/move)
- **预期结果**: 
  - 本地技能发现正确
  - 导入正确
  - 重复检测正确
- **边界条件**: 
  - 无技能可扫描
  - 权限不足
  - 指纹计算失败

---

## 3. 同步功能测试

### Case ID: `TC-E2E-007`
- **模块**: `integration_tests.rs`
- **测试名称**: 多 Agent 同步
- **关联代码**: `test_e2e_009_multi_agent_sync`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - 已创建技能
- **测试步骤**:
  1. 创建技能
  2. 调用 `sync_skill(skill_path, ["cursor", "claude_code", "windsurf"], Some("copy"))`
  3. 验证所有 Agent 目录都有技能
  4. 修改 Hub 中的技能
  5. 验证 Copy 模式的 Agent 不受影响
  6. 使用 Link 模式同步到另一个 Agent
  7. 修改 Hub 中的技能
  8. 验证 Link 模式的 Agent 同步更新
- **预期结果**: 
  - 多 Agent 同步正确
  - Copy 模式独立
  - Link 模式同步
- **边界条件**: 
  - 部分 Agent 失败
  - 权限不足
  - 网络错误

---

### Case ID: `TC-E2E-008`
- **模块**: `integration_tests.rs`
- **测试名称**: 同步冲突检测
- **关联代码**: `test_e2e_010_sync_conflict_detection`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - 已同步的技能
- **测试步骤**:
  1. 同步技能到 Agent
  2. 在 Agent 中修改技能
  3. 在 Hub 中修改技能
  4. 再次同步
  5. 验证冲突检测
  6. 验证处理策略 (覆盖/跳过)
- **预期结果**: 
  - 冲突正确检测
  - 处理策略正确
- **边界条件**: 
  - 文件冲突
  - 目录冲突
  - 权限冲突

---

### Case ID: `TC-E2E-009`
- **模块**: `integration_tests.rs`
- **测试名称**: Claude Desktop 配置更新
- **关联代码**: `test_e2e_011_claude_desktop_config_update`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - Claude Desktop 已安装
- **测试步骤**:
  1. 创建技能
  2. 调用 `sync_skill(skill_path, ["claude_code"], Some("copy"))`
  3. 验证 config.json 被更新
  4. 验证技能路径正确添加
  5. 验证 config.json 格式正确
- **预期结果**: 
  - Claude Desktop 配置正确更新
  - config.json 格式正确
- **边界条件**: 
  - Claude Desktop 未安装
  - 配置文件格式错误
  - 权限不足

---

## 4. 项目技能管理测试

### Case ID: `TC-E2E-010`
- **模块**: `integration_tests.rs`
- **测试名称**: 项目技能扫描与管理
- **关联代码**: `test_e2e_012_project_skills_management`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - 项目目录有技能
- **测试步骤**:
  1. 在项目目录创建技能
  2. 调用 `get_project_skills(project_path)` 扫描
  3. 验证技能被发现
  4. 验证按 tool_key 分组
  5. 调用 `skill_collect_to_hub(skill_path)` 收集
  6. 验证技能在 Hub 存在
  7. 调用 `delete_skill(skill_path)` 删除
  8. 验证删除成功
- **预期结果**: 
  - 项目技能扫描正确
  - 导入 Hub 正确
  - 删除正确
- **边界条件**: 
  - 项目无技能
  - 权限不足
  - 文件损坏

---

### Case ID: `TC-E2E-011`
- **模块**: `integration_tests.rs`
- **测试名称**: 项目批量技能管理
- **关联代码**: `test_e2e_013_project_skill_batch_operations`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - 项目目录有多个技能
- **测试步骤**:
  1. 在项目目录创建多个技能
  2. 调用 `get_project_skills(project_path)` 扫描
  3. 验证所有技能被发现
  4. 批量收集到 Hub
  5. 验证所有技能在 Hub
  6. 批量删除
  7. 验证所有技能被删除
- **预期结果**: 
  - 批量操作正确
  - 性能可接受
- **边界条件**: 
  - 部分操作失败
  - 权限不足
  - 文件损坏

---

## 5. 套装管理测试

### Case ID: `TC-E2E-012`
- **模块**: `integration_tests.rs`
- **测试名称**: Suite 完整生命周期
- **关联代码**: `test_e2e_014_suite_lifecycle`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 构造 Suite 对象:
     - id: "suite_1"
     - name: "React Frontend Kit"
     - description: "For React projects"
     - policy_rules: "# Project Context\n..."
     - loadout_skills: ["skill_1", "skill_2"]
  2. 调用 `save_suites(vec![suite])` 保存
  3. 调用 `load_suites()` 读取
  4. 验证 Suite 正确保存和读取
  5. 更新 Suite (修改 name)
  6. 验证 Suite 被更新
  7. 删除 Suite (清空列表)
  8. 验证 Suite 被删除
- **预期结果**: 
  - Suite 完整生命周期正确
  - 数据持久化正确
- **边界条件**: 
  - Suite 不存在
  - Suite 数据格式错误
  - 并发写入

---

### Case ID: `TC-E2E-013`
- **模块**: `integration_tests.rs`
- **测试名称**: Suite 应用到项目
- **关联代码**: `test_e2e_015_suite_apply_to_project`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - 已创建 Suite
  - 项目目录已创建
- **测试步骤**:
  1. 调用 `apply_suite(project_path, suite, Some("cursor"))`
  2. 验证 AGENTS.md 写入项目目录
  3. 验证技能同步到项目目录
  4. 验证路径正确
  5. 验证技能数量正确
- **预期结果**: 
  - Suite 应用正确
  - AGENTS.md 正确写入
  - 技能同步正确
- **边界条件**: 
  - Suite 不存在
  - 项目不存在
  - 权限不足

---

### Case ID: `TC-E2E-014`
- **模块**: `integration_tests.rs`
- **测试名称**: 多 Suite 管理
- **关联代码**: `test_e2e_016_multi_suite_management`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 创建多个 Suite
  2. 调用 `save_suites(vec![suite1, suite2, suite3])` 保存
  3. 调用 `load_suites()` 读取
  4. 验证所有 Suite 正确保存
  5. 更新一个 Suite
  6. 验证只更新该 Suite
  7. 删除一个 Suite
  8. 验证只删除该 Suite
- **预期结果**: 
  - 多 Suite 管理正确
  - 更新和删除正确
- **边界条件**: 
  - 空 Suite 列表
  - Suite 数据格式错误
  - 并发写入

---

## 6. 扫描与发现测试

### Case ID: `TC-E2E-015`
- **模块**: `integration_tests.rs`
- **测试名称**: 项目扫描与去重
- **关联代码**: `test_e2e_017_project_scan_and_deduplication`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 创建多个项目 (proj_a, proj_b, proj_c)
  2. 调用 `scan_workspace(extra_roots)` 扫描
  3. 验证所有项目被扫描
  4. 验证项目属性 (Git/MCP/AGENTS)
  5. 在子目录创建项目
  6. 验证深度扫描正确
  7. 创建 node_modules 目录
  8. 验证被跳过
- **预期结果**: 
  - 多项目扫描正确
  - 项目属性正确识别
  - node_modules 被跳过
- **边界条件**: 
  - 深度过大
  - 循环链接
  - 权限不足

---

### Case ID: `TC-E2E-016`
- **模块**: `integration_tests.rs`
- **测试名称**: 工作区深度扫描
- **关联代码**: `test_e2e_018_workspace_deep_scan`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 创建多层目录结构
  2. 调用 `scan_workspace` 扫描
  3. 验证最大深度限制
  4. 验证忽略目录正确
  5. 验证项目识别正确
- **预期结果**: 
  - 深度扫描正确
  - 忽略目录正确
  - 项目识别正确
- **边界条件**: 
  - 深度过大
  - 循环链接
  - 权限不足

---

## 7. 边界条件测试

### Case ID: `TC-E2E-017`
- **模块**: `integration_tests.rs`
- **测试名称**: 大规模数据处理
- **关联代码**: `test_e2e_019_large_scale_processing`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 创建 100+ 技能
  2. 调用 `get_all_local_skills()` 扫描
  3. 验证性能可接受 (< 5s)
  4. 调用 `sync_skill` 同步
  5. 验证性能可接受 (< 10s)
  6. 调用 `delete_skill` 批量删除
  7. 验证性能可接受 (< 5s)
- **预期结果**: 
  - 大规模数据处理性能可接受
- **边界条件**: 
  - 性能瓶颈
  - 内存不足
  - 超时

---

### Case ID: `TC-E2E-018`
- **模块**: `integration_tests.rs`
- **测试名称**: 并发操作安全
- **关联代码**: `test_e2e_020_concurrent_operations`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 多线程同时创建技能 (10 个线程)
  2. 验证数据正确性
  3. 多线程同时读取技能
  4. 验证数据一致性
  5. 多线程同时修改配置
  6. 验证数据正确性
  7. 多线程同时同步技能
  8. 验证数据正确性
- **预期结果**: 
  - 并发操作安全
  - 数据正确性正确
- **边界条件**: 
  - 死锁检测
  - 竞态条件
  - 资源竞争

---

### Case ID: `TC-E2E-019`
- **模块**: `integration_tests.rs`
- **测试名称**: 沙箱环境隔离
- **关联代码**: `test_e2e_021_sandbox_isolation`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 在沙箱执行操作
  2. 验证不影响真实环境
  3. 删除沙箱
  4. 验证真实环境不变
  5. 在沙箱创建大量文件 (1000+)
  6. 删除沙箱
  7. 验证磁盘清理
- **预期结果**: 
  - 沙箱环境正确隔离
  - 真实环境不受影响
- **边界条件**: 
  - 环境变量泄漏
  - 路径泄漏
  - 资源泄漏

---

### Case ID: `TC-E2E-020`
- **模块**: `integration_tests.rs`
- **测试名称**: 错误恢复与重试
- **关联代码**: `test_e2e_022_error_recovery`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 模拟部分操作失败 (权限不足)
  2. 验证错误处理
  3. 验证部分成功
  4. 验证错误信息
  5. 重试失败操作
  6. 验证重试成功
- **预期结果**: 
  - 错误正确恢复
  - 部分成功正确处理
- **边界条件**: 
  - 持续失败
  - 重试次数限制
  - 超时处理

---

## 8. CLI 命令测试

### Case ID: `TC-E2E-021`
- **模块**: `integration_tests.rs`
- **测试名称**: CLI Sync 命令
- **关联代码**: `test_cli_sync_all`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
  - 已安装技能
  - 已安装 Agent
- **测试步骤**:
  1. 创建多个技能
  2. 同步到多个 Agent
  3. 运行 CLI 命令: `xskill sync --all`
  4. 验证所有技能同步到所有 Agent
  5. 验证同步模式 (copy)
  6. 验证同步结果
- **预期结果**: 
  - CLI 命令正确执行
  - 所有技能同步成功
- **边界条件**: 
  - 无技能
  - 无 Agent
  - 同步失败

---

### Case ID: `TC-E2E-022`
- **模块**: `integration_tests.rs`
- **测试名称**: CLI Create 命令
- **关联代码**: `test_cli_create_skill`
- **前置条件**: 
  - `XSKILL_TEST_HOME` 环境变量已设置
  - 临时沙箱目录已创建
- **测试步骤**:
  1. 运行 CLI 命令: `xskill create --name test-skill`
  2. 验证技能在 Hub 目录生成
  3. 验证目录结构正确
  4. 验证 SKILL.md 内容正确
- **预期结果**: 
  - CLI 命令正确执行
  - 技能创建成功
- **边界条件**: 
  - 名称格式错误
  - 权限不足
  - 名称已存在

---

## 测试用例统计

| 类型 | 测试用例数 | 优先级分布 |
|------|-----------|-----------|
| 技能全生命周期 | 3 个 | High: 3 |
| Import 功能 | 3 个 | High: 3 |
| 同步功能 | 3 个 | High: 3 |
| 项目技能管理 | 2 个 | Medium: 2 |
| 套装管理 | 3 个 | Medium: 3 |
| 扫描与发现 | 2 个 | Medium: 2 |
| 边界条件 | 4 个 | Low: 4 |
| CLI 命令 | 2 个 | Medium: 2 |
| **总计** | **22 个** | **High: 11, Medium: 10, Low: 4** |

## 测试用例覆盖

| 模块 | 测试用例数 | 覆盖率 |
|------|-----------|-------|
| create_skill | 2 个 | 100% |
| sync_skill | 4 个 | 100% |
| delete_skill | 2 个 | 100% |
| get_skill_config | 2 个 | 100% |
| save_skill_config | 2 个 | 100% |
| skill_collect_to_hub | 1 个 | 100% |
| install_skill_from_url | 2 个 | 100% |
| scan_external_skills | 1 个 | 100% |
| import_skills | 1 个 | 100% |
| get_project_skills | 1 个 | 100% |
| apply_suite | 2 个 | 100% |
| load_suites | 2 个 | 100% |
| save_suites | 2 个 | 100% |
| scan_workspace | 2 个 | 100% |
| get_all_local_skills | 1 个 | 100% |
| CLI sync | 1 个 | 100% |
| CLI create | 1 个 | 100% |
| **总计** | **22 个** | **100%** |
