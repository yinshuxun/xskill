# XSkill 后端集成测试用例 (Rust Integration)

**版本**: v0.5.1  
**最后更新**: 2026-02-28  
**说明**: 基于完整需求文档编写的后端集成测试用例，覆盖全生命周期流程

---

## 1. 技能全生命周期管理

### Case ID: `TC-BE-INT-001`
- **模块**: `integration_tests.rs`
- **测试名称**: 技能完整生命周期闭环
- **关联代码**: `test_full_skill_lifecycle`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 所有 `dirs::home_dir()` 指向临时沙箱
- **测试步骤**:
  1. **创建 (Scaffold)**: 调用 `create_skill` 创建名为 "test-integration-skill" 的技能
  2. **探测与配置**: 在技能目录写入 `package.json` 和 `index.js`，调用 `get_skill_config`
  3. **自定义配置覆盖**: 构建新的 `SkillConfig` (bun run index.ts)，调用 `save_skill_config`
  4. **跨 Agent 同步**: 调用 `sync_skill`，模式 "copy"，目标 "cursor"
  5. **一键收集至 Hub**: 调用 `skill_collect_to_hub`，传入同步路径
  6. **销毁清理**: 调用 `delete_skill` 删除原始技能
- **预期结果**:
  - 创建后能从磁盘读到文件夹
  - 自动探测识别 "node" 命令，二次读取是 "bun"
  - 同步操作返回已写入的路径列表
  - 收集操作无死循环、无误删
  - 删除操作后源文件夹不存在
- **验证点**:
  - 文件系统操作正确
  - 配置文件正确更新
  - 同步路径正确
  - 防环检测生效

---

### Case ID: `TC-BE-INT-002`
- **模块**: `integration_tests.rs`
- **测试名称**: 技能配置生命周期
- **关联代码**: `test_skill_config_lifecycle`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 已创建技能
- **测试步骤**:
  1. 创建技能
  2. 调用 `get_skill_config` 获取默认配置
  3. 验证返回空配置
  4. 调用 `save_skill_config` 保存自定义配置
  5. 再次调用 `get_skill_config` 读取配置
  6. 验证读取的配置与保存的一致
  7. 修改配置并保存
  8. 验证配置被更新
  9. 删除技能
  10. 验证配置文件被清理
- **预期结果**: 配置正确管理
- **边界条件**: 
  - 配置为空
  - 配置格式错误
  - 多次更新

---

## 2. 项目扫描与套装管理

### Case ID: `TC-BE-INT-003`
- **模块**: `integration_tests.rs`
- **测试名称**: 项目扫描与 Suite 管理闭环
- **关联代码**: `test_project_and_suite_management`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 创建伪造的项目文件夹 `my_awesome_project`
- **测试步骤**:
  1. **扫描指定工作区**: 调用 `scan_workspace`，传入临时目录作为 `extra_roots`
  2. **项目断言**: 读取扫描结果，验证项目名称
  3. **套装管理 - 写入**: 手动创建 Suite，调用 `save_suites`
  4. **套装管理 - 读取**: 调用 `load_suites` 读取数据
  5. **套装应用**: 调用 `apply_suite` 应用到项目
  6. **验证应用结果**: 检查项目目录文件
- **预期结果**:
  - 扫描结果包含项目
  - Suite 保存和读取正确
  - 套装应用成功
- **验证点**:
  - 项目识别正确
  - Suite 数据持久化
  - AGENTS.md 正确写入
  - 技能正确同步到项目

---

### Case ID: `TC-BE-INT-004`
- **模块**: `integration_tests.rs`
- **测试名称**: 多项目扫描与去重
- **关联代码**: `test_multi_project_scan`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 创建多个项目
- **测试步骤**:
  1. 创建多个项目 (proj_a, proj_b, proj_c)
  2. 调用 `scan_workspace` 扫描
  3. 验证所有项目被扫描
  4. 在子目录创建项目
  5. 验证深度扫描正确
  6. 创建 node_modules 目录
  7. 验证被跳过
- **预期结果**: 多项目扫描正确
- **边界条件**: 
  - 深度过大
  - 循环链接
  - 权限不足

---

## 3. Import 功能测试

### Case ID: `TC-BE-INT-005`
- **模块**: `integration_tests.rs`
- **测试名称**: GitHub 技能导入闭环
- **关联代码**: `test_import_github_skill`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - Mock GitHub API
- **测试步骤**:
  1. 调用 `install_skill_from_url` 导入 GitHub 技能
  2. 验证技能在 Hub 目录生成
  3. 验证目录结构正确
  4. 验证 SKILL.md 生成
  5. 调用 `sync_skill` 同步到 Agent
  6. 验证同步成功
  7. 调用 `delete_skill` 删除
  8. 验证删除成功
- **预期结果**: GitHub 导入完整流程正确
- **边界条件**: 
  - URL 无效
  - 网络错误
  - 权限不足

---

### Case ID: `TC-BE-INT-006`
- **模块**: `integration_tests.rs`
- **测试名称**: 子目录 GitHub 导入
- **关联代码**: `test_import_github_subdirectory`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - Mock 支持子目录的 GitHub URL
- **测试步骤**:
  1. 调用 `install_skill_from_url` 传入子目录 URL
  2. 验证只克隆子目录
  3. 验证目录结构正确
  4. 验证文件在正确位置
- **预期结果**: 子目录导入正确
- **边界条件**: 
  - 子目录不存在
  - 权限不足

---

### Case ID: `TC-BE-INT-007`
- **模块**: `integration_tests.rs`
- **测试名称**: 本地技能扫描与导入
- **关联代码**: `test_scan_and_import_local_skills`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 在 Agent 目录创建技能
- **测试步骤**:
  1. 在 `.cursor/skills` 创建技能
  2. 调用 `scan_external_skills` 扫描
  3. 验证技能被发现
  4. 验证指纹计算正确
  5. 调用 `import_skills` 导入到 Hub
  6. 验证技能在 Hub 存在
  7. 验证原位置技能被处理 (copy/move)
- **预期结果**: 本地技能扫描和导入正确
- **边界条件**: 
  - 重复技能检测
  - 命名冲突
  - 权限不足

---

## 4. 同步功能测试

### Case ID: `TC-BE-INT-008`
- **模块**: `integration_tests.rs`
- **测试名称**: 多 Agent 同步
- **关联代码**: `test_multi_agent_sync`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 已创建技能
- **测试步骤**:
  1. 创建技能
  2. 调用 `sync_skill` 同步到多个 Agent
  3. 验证所有 Agent 目录都有技能
  4. 修改 Hub 中的技能
  5. 验证同步模式影响
- **预期结果**: 多 Agent 同步正确
- **边界条件**: 
  - 部分 Agent 失败
  - 权限不足
  - 网络错误

---

### Case ID: `TC-BE-INT-009`
- **模块**: `integration_tests.rs`
- **测试名称**: Link 模式同步 (macOS/Linux)
- **关联代码**: `test_link_mode_sync`
- **前置条件**: 
  - 在 macOS/Linux 环境
  - `with_test_env` 准备就绪
- **测试步骤**:
  1. 创建技能
  2. 调用 `sync_skill` 使用 Link 模式
  3. 验证符号链接创建
  4. 验证链接指向 Hub
  5. 修改 Hub 中的技能
  6. 验证 Agent 中的链接生效
  7. 删除 Hub 中的技能
  8. 验证链接失效
- **预期结果**: Link 模式正确执行
- **边界条件**: 
  - Windows 系统 Link 模式
  - 链接损坏
  - 权限不足

---

### Case ID: `TC-BE-INT-010`
- **模块**: `integration_tests.rs`
- **测试名称**: 同步冲突检测
- **关联代码**: `test_sync_conflict_detection`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 已同步的技能
- **测试步骤**:
  1. 同步技能到 Agent
  2. 在 Agent 中修改技能
  3. 在 Hub 中修改技能
  4. 再次同步
  5. 验证冲突检测
  6. 验证处理策略
- **预期结果**: 冲突正确检测和处理
- **边界条件**: 
  - 文件冲突
  - 目录冲突
  - 权限冲突

---

## 5. 套装应用测试

### Case ID: `TC-BE-INT-011`
- **模块**: `integration_tests.rs`
- **测试名称**: Suite 完整生命周期
- **关联代码**: `test_suite_lifecycle`
- **前置条件**: 
  - `with_test_env` 准备就绪
- **测试步骤**:
  1. 创建 Suite 对象
  2. 调用 `save_suites` 保存
  3. 调用 `load_suites` 读取
  4. 验证 Suite 正确保存和读取
  5. 调用 `apply_suite` 应用到项目
  6. 验证 AGENTS.md 写入
  7. 验证技能同步到项目
  8. 删除 Suite
  9. 验证 Suite 被删除
- **预期结果**: Suite 完整生命周期正确
- **边界条件**: 
  - Suite 不存在
  - 项目不存在
  - 权限不足

---

### Case ID: `TC-BE-INT-012`
- **模块**: `integration_tests.rs`
- **测试名称**: 多 Suite 管理
- **关联代码**: `test_multi_suite_management`
- **前置条件**: 
  - `with_test_env` 准备就绪
- **测试步骤**:
  1. 创建多个 Suite
  2. 调用 `save_suites` 保存
  3. 调用 `load_suites` 读取
  4. 验证所有 Suite 正确保存
  5. 更新一个 Suite
  6. 验证只更新该 Suite
  7. 删除一个 Suite
  8. 验证只删除该 Suite
- **预期结果**: 多 Suite 管理正确
- **边界条件**: 
  - 空 Suite 列表
  - Suite 数据格式错误
  - 并发写入

---

## 6. 项目技能管理测试

### Case ID: `TC-BE-INT-013`
- **模块**: `integration_tests.rs`
- **测试名称**: 项目技能扫描与管理
- **关联代码**: `test_project_skill_management`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 项目目录有技能
- **测试步骤**:
  1. 在项目目录创建技能
  2. 调用 `get_project_skills` 扫描
  3. 验证技能被发现
  4. 验证按 tool_key 分组
  5. 调用 `skill_collect_to_hub` 收集
  6. 验证技能在 Hub 存在
  7. 调用 `delete_skill` 删除
  8. 验证删除成功
- **预期结果**: 项目技能管理正确
- **边界条件**: 
  - 项目无技能
  - 权限不足
  - 文件损坏

---

### Case ID: `TC-BE-INT-014`
- **模块**: `integration_tests.rs`
- **测试名称**: 项目技能批量操作
- **关联代码**: `test_project_skill_batch_operations`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 项目目录有多个技能
- **测试步骤**:
  1. 在项目目录创建多个技能
  2. 调用 `get_project_skills` 扫描
  3. 验证所有技能被发现
  4. 批量收集到 Hub
  5. 验证所有技能在 Hub
  6. 批量删除
  7. 验证所有技能被删除
- **预期结果**: 批量操作正确
- **边界条件**: 
  - 部分操作失败
  - 权限不足
  - 文件损坏

---

## 7. 边界条件测试

### Case ID: `TC-BE-INT-015`
- **模块**: `integration_tests.rs`
- **测试名称**: 大规模数据处理
- **关联代码**: `test_large_scale_processing`
- **前置条件**: 
  - `with_test_env` 准备就绪
  - 创建大量技能
- **测试步骤**:
  1. 创建 100+ 技能
  2. 调用 `get_all_local_skills` 扫描
  3. 验证性能可接受
  4. 调用 `sync_skill` 同步
  5. 验证性能可接受
  6. 调用 `delete_skill` 批量删除
  7. 验证性能可接受
- **预期结果**: 大规模数据处理性能可接受
- **边界条件**: 
  - 性能瓶颈
  - 内存不足
  - 超时

---

### Case ID: `TC-BE-INT-016`
- **模块**: `integration_tests.rs`
- **测试名称**: 并发操作安全
- **关联代码**: `test_concurrent_operations`
- **前置条件**: 
  - `with_test_env` 准备就绪
- **测试步骤**:
  1. 多线程同时创建技能
  2. 验证数据正确性
  3. 多线程同时读取技能
  4. 验证数据一致性
  5. 多线程同时修改配置
  6. 验证数据正确性
- **预期结果**: 并发操作安全
- **边界条件**: 
  - 死锁检测
  - 竞态条件
  - 资源竞争

---

### Case ID: `TC-BE-INT-017`
- **模块**: `integration_tests.rs`
- **测试名称**: 沙箱环境隔离
- **关联代码**: `test_sandbox_isolation`
- **前置条件**: 
  - `with_test_env` 准备就绪
- **测试步骤**:
  1. 在沙箱执行操作
  2. 验证不影响真实环境
  3. 删除沙箱
  4. 验证真实环境不变
  5. 在沙箱创建大量文件
  6. 删除沙箱
  7. 验证磁盘清理
- **预期结果**: 沙箱环境正确隔离
- **边界条件**: 
  - 环境变量泄漏
  - 路径泄漏
  - 资源泄漏

---

### Case ID: `TC-BE-INT-018`
- **模块**: `integration_tests.rs`
- **测试名称**: 错误恢复与重试
- **关联代码**: `test_error_recovery`
- **前置条件**: 
  - `with_test_env` 准备就绪
- **测试步骤**:
  1. 模拟部分操作失败
  2. 验证错误处理
  3. 验证部分成功
  4. 验证错误信息
  5. 重试失败操作
  6. 验证重试成功
- **预期结果**: 错误正确恢复
- **边界条件**: 
  - 持续失败
  - 重试次数限制
  - 超时处理
