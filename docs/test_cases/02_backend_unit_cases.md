# XSkill 后端单元测试用例 (Rust Unit)

**版本**: v0.5.1  
**最后更新**: 2026-02-28  
**说明**: 基于完整需求文档编写的后端单元测试用例，覆盖所有核心功能

---

## 1. Feed 解析器测试

### Case ID: `TC-BE-UNIT-001`
- **模块**: `feed_parser.rs`
- **测试名称**: Feed 解析失败与异常处理
- **关联代码**: `test_fetch_feed_invalid_url`
- **前置条件**: 启动一个无效或不可达的 URL
- **测试步骤**:
  1. 调用 `fetch_feed("not-a-url")`
  2. 验证返回结果是 `Err`
  3. 验证错误信息包含 "Failed to fetch feed"
- **预期结果**: 解析器正确处理无效 URL
- **边界条件**: 
  - 网络超时
  - DNS 解析失败
  - SSL 证书错误

---

### Case ID: `TC-BE-UNIT-002`
- **模块**: `feed_parser.rs`
- **测试名称**: Feed 解析成功与数据提取
- **关联代码**: `test_fetch_feed_valid_url`
- **前置条件**: 
  - Mock 一个有效的 Feed URL
  - 返回有效的 JSON 数据
- **测试步骤**:
  1. 调用 `fetch_feed("https://example.com/feed.json")`
  2. 验证返回结果是 `Ok`
  3. 验证返回的 FeedEntry 数量正确
  4. 验证每个条目的字段完整
- **预期结果**: 解析器正确提取 Feed 数据
- **边界条件**: 
  - 空 Feed
  - 格式错误的 Feed
  - 部分字段缺失的 Feed

---

## 2. GitHub API 测试

### Case ID: `TC-BE-UNIT-003`
- **模块**: `github.rs`
- **测试名称**: URL 格式自动转换 (Raw 与 Blob)
- **关联代码**: `test_convert_github_url`
- **前置条件**: 准备三个 URL
- **测试步骤**:
  1. 调用 `convert_github_url` 传入 raw 格式 URL
  2. 验证返回自身内容
  3. 调用 `convert_github_url` 传入 blob 格式 URL
  4. 验证转换为 raw 格式
  5. 调用 `convert_github_url` 传入不相关格式 URL
  6. 验证返回 `None`
- **预期结果**: URL 转换逻辑正确
- **边界条件**: 
  - 非 GitHub URL
  - 已经是 raw 格式的 URL
  - 子目录 URL

---

### Case ID: `TC-BE-UNIT-004`
- **模块**: `github.rs`
- **测试名称**: 文件请求失败处理
- **关联代码**: `test_fetch_github_file_invalid`
- **前置条件**: 准备一个不支持的 URL
- **测试步骤**:
  1. 调用 `fetch_github_file("https://google.com")`
  2. 验证返回 `Err("Unsupported URL format")`
  3. 验证函数提早退出
- **预期结果**: 函数正确拒绝不支持的 URL
- **边界条件**: 
  - 超时处理
  - 网络错误
  - 权限错误

---

### Case ID: `TC-BE-UNIT-005`
- **模块**: `github.rs`
- **测试名称**: GitHub 文件成功获取
- **关联代码**: `test_fetch_github_file_valid`
- **前置条件**: 
  - Mock 一个有效的 GitHub URL
  - 返回有效的文件内容
- **测试步骤**:
  1. 调用 `fetch_github_file("https://raw.githubusercontent.com/...")`
  2. 验证返回文件内容
  3. 验证内容正确
- **预期结果**: 正确获取 GitHub 文件内容
- **边界条件**: 
  - 文件不存在
  - 权限不足
  - 内容编码问题

---

## 3. 配置文件检测测试

### Case ID: `TC-BE-UNIT-006`
- **模块**: `config_manager.rs`
- **测试名称**: 自动检测 Node.js 技能入口
- **关联代码**: `test_detect_default_config_node`
- **前置条件**: 
  - 在临时目录创建 `package.json`
  - 创建 `index.js` 作为入口
- **测试步骤**:
  1. 调用 `detect_default_config` 并传入目录路径
  2. 验证返回 `command` 为 "node"
  3. 验证返回 `args` 包含 "index.js"
- **预期结果**: 正确识别 Node.js 项目
- **边界条件**: 
  - `package.json` 格式错误
  - `main` 字段缺失
  - 入口文件不存在

---

### Case ID: `TC-BE-UNIT-007`
- **模块**: `config_manager.rs`
- **测试名称**: 自动检测 Python 技能入口
- **关联代码**: `test_detect_default_config_python`
- **前置条件**: 
  - 创建 `pyproject.toml` 文件
  - 创建 `main.py` 作为入口
- **测试步骤**:
  1. 调用 `detect_default_config` 并传入目录路径
  2. 验证返回 `command` 为 "python3"
  3. 验证返回 `args` 包含 "main.py"
- **预期结果**: 正确识别 Python 项目
- **边界条件**: 
  - `pyproject.toml` 格式错误
  - 入口文件不存在
  - 多个入口文件

---

### Case ID: `TC-BE-UNIT-008`
- **模块**: `config_manager.rs`
- **测试名称**: 自定义配置保存与读取
- **关联代码**: `test_save_and_load_custom_config`
- **前置条件**: 
  - 创建技能目录
  - 准备自定义配置
- **测试步骤**:
  1. 调用 `save_skill_config` 保存自定义配置
  2. 调用 `get_skill_config` 读取配置
  3. 验证读取的配置与保存的一致
- **预期结果**: 配置正确持久化和读取
- **边界条件**: 
  - 配置为空
  - 配置格式错误
  - 存储权限错误

---

## 4. 工作区扫描器测试

### Case ID: `TC-BE-UNIT-009`
- **模块**: `scanner.rs`
- **测试名称**: 本地目录深度遍历及有效工程筛选
- **关联代码**: `test_scan_roots`
- **前置条件**: 
  - 在临时目录构建测试结构
  - `proj_a` (包含 `.git` 和 `AGENTS.md`)
  - `proj_b` (包含 `.git` 和有 mcp 关键字的 `package.json`)
  - `node_modules` (忽略目录)
- **测试步骤**:
  1. 调用 `scan_roots` 扫描基准目录
  2. 验证返回的项目数量为 2
  3. 验证 `proj_a` 被标识为非 MCP 项目
  4. 验证 `proj_b` 被标识为 MCP 项目
  5. 验证 `node_modules` 被跳过
- **预期结果**: 扫描器正确识别项目
- **边界条件**: 
  - 深度过大
  - 循环链接
  - 权限不足

---

### Case ID: `TC-BE-UNIT-010`
- **模块**: `scanner.rs`
- **测试名称**: 项目属性检测
- **关联代码**: `test_detect_project_attributes`
- **前置条件**: 
  - 创建不同类型的项目
- **测试步骤**:
  1. 创建带 `.git` 的项目
  2. 验证 `has_git` 为 true
  3. 创建带 `mcp.json` 的项目
  4. 验证 `has_mcp` 为 true
  5. 创建带 `AGENTS.md` 的项目
  6. 验证 `has_agents_md` 为 true
- **预期结果**: 项目属性正确检测
- **边界条件**: 
  - 属性文件格式错误
  - 属性文件缺失

---

## 5. 套装管理器测试

### Case ID: `TC-BE-UNIT-011`
- **模块**: `suite_manager.rs`
- **测试名称**: Suite 设置持久化存储的序列化与反序列化
- **关联代码**: `test_save_and_load_suites`
- **前置条件**: 构造一个合法的 Suite 数据对象
- **测试步骤**:
  1. 构造 Suite 对象 (id, name, policy_rules, loadout_skills)
  2. 调用 `save_suites` 保存
  3. 调用 `load_suites` 读取
  4. 验证 Suite 数量不变
  5. 验证核心属性一致
- **预期结果**: Suite 正确持久化和读取
- **边界条件**: 
  - Suite 数据格式错误
  - 存储权限错误
  - 并发写入

---

### Case ID: `TC-BE-UNIT-012`
- **模块**: `suite_manager.rs`
- **测试名称**: Suite 更新与删除
- **关联代码**: `test_update_and_delete_suites`
- **前置条件**: 
  - 已保存多个 Suite
- **测试步骤**:
  1. 更新一个 Suite
  2. 验证更新成功
  3. 删除一个 Suite
  4. 验证删除成功
  5. 验证 Suite 数量正确
- **预期结果**: Suite 更新和删除正确
- **边界条件**: 
  - 更新不存在的 Suite
  - 删除不存在的 Suite
  - 空 Suite 列表

---

## 6. 技能管理测试

### Case ID: `TC-BE-UNIT-013`
- **模块**: `skill_manager.rs`
- **测试名称**: 技能名称格式验证
- **关联代码**: `test_validate_skill_name`
- **前置条件**: 准备不同的名称
- **测试步骤**:
  1. 验证有效名称通过
  2. 验证大写名称失败
  3. 验证包含特殊字符的名称失败
  4. 验证过长的名称失败
  5. 验证过短的名称失败
- **预期结果**: 名称格式验证正确
- **边界条件**: 
  - Unicode 字符
  - 空字符串
  - 空格

---

### Case ID: `TC-BE-UNIT-014`
- **模块**: `skill_manager.rs`
- **测试名称**: 技能目录结构创建
- **关联代码**: `test_create_skill_directory`
- **前置条件**: 有效的技能名称
- **测试步骤**:
  1. 调用 `create_skill_directory`
  2. 验证目录创建成功
  3. 验证目录结构正确 (scripts/, references/, assets/)
  4. 验证 README 占位文件创建
- **预期结果**: 目录结构正确创建
- **边界条件**: 
  - 目录已存在
  - 权限不足
  - 路径过长

---

### Case ID: `TC-BE-UNIT-015`
- **模块**: `skill_manager.rs`
- **测试名称**: SKILL.md 模板生成
- **关联代码**: `test_generate_skill_md`
- **前置条件**: 准备技能元数据
- **测试步骤**:
  1. 调用 `generate_skill_md`
  2. 验证 YAML 头部正确
  3. 验证 Overview 部分
  4. 验证 When to Use 部分
  5. 验证 When NOT to Use 部分
  6. 验证 Procedures 部分
  7. 验证 Error Handling 部分
  8. 验证 References 部分
- **预期结果**: SKILL.md 模板正确生成
- **边界条件**: 
  - 元数据缺失
  - 元数据格式错误
  - 特殊字符处理

---

## 7. IDE 同步测试

### Case ID: `TC-BE-UNIT-016`
- **模块**: `ide_sync.rs`
- **测试名称**: 同步模式选择 (Copy vs Link)
- **关联代码**: `test_sync_modes`
- **前置条件**: 
  - 有效的技能目录
  - 目标工具目录
- **测试步骤**:
  1. 调用 `sync_skill` 使用 Copy 模式
  2. 验证技能被复制
  3. 调用 `sync_skill` 使用 Link 模式
  4. 验证符号链接创建
  5. 验证链接指向正确
- **预期结果**: 同步模式正确执行
- **边界条件**: 
  - Windows 系统 Link 模式
  - 权限不足
  - 目标已存在

---

### Case ID: `TC-BE-UNIT-017`
- **模块**: `ide_sync.rs`
- **测试名称**: Claude Desktop 配置更新
- **关联代码**: `test_update_claude_desktop_config`
- **前置条件**: 
  - Claude Desktop 已安装
  - 有效的技能路径
- **测试步骤**:
  1. 调用 `sync_skill` 同步到 Claude
  2. 验证 config.json 被更新
  3. 验证技能路径正确添加
- **预期结果**: Claude Desktop 配置正确更新
- **边界条件**: 
  - Claude Desktop 未安装
  - 配置文件格式错误
  - 权限不足

---

## 8. Git 操作测试

### Case ID: `TC-BE-UNIT-018`
- **模块**: `git_ops.rs`
- **测试名称**: GitHub 仓库克隆
- **关联代码**: `test_clone_github_repo`
- **前置条件**: 
  - 有效的 GitHub URL
  - 可写的目录
- **测试步骤**:
  1. 调用 `clone_skill`
  2. 验证仓库被克隆
  3. 验证目录结构正确
  4. 验证 `.git` 目录存在
- **预期结果**: 仓库正确克隆
- **边界条件**: 
  - URL 无效
  - 权限不足
  - 网络错误

---

### Case ID: `TC-BE-UNIT-019`
- **模块**: `git_ops.rs`
- **测试名称**: 子目录克隆 (sparse-checkout)
- **关联代码**: `test_clone_subdirectory`
- **前置条件**: 
  - 支持子目录的 GitHub URL
- **测试步骤**:
  1. 调用 `install_skill_from_url` 传入子目录 URL
  2. 验证只克隆子目录
  3. 验证目录结构正确
- **预期结果**: 子目录正确克隆
- **边界条件**: 
  - 子目录不存在
  - 权限不足

---

### Case ID: `TC-BE-UNIT-020`
- **模块**: `git_ops.rs`
- **测试名称**: 技能更新 (git pull)
- **关联代码**: `test_update_skill`
- **前置条件**: 
  - 已克隆的技能
  - 远程仓库有更新
- **测试步骤**:
  1. 调用 `update_skill`
  2. 验证执行 `git pull --ff-only`
  3. 验证更新成功
- **预期结果**: 技能正确更新
- **边界条件**: 
  - 分支冲突
  - 网络错误
  - 权限不足

---

## 9. 数据存储测试

### Case ID: `TC-BE-UNIT-021`
- **模块**: `storage.rs`
- **测试名称**: 技能列表持久化
- **关联代码**: `test_save_and_load_skills`
- **前置条件**: 准备技能列表
- **测试步骤**:
  1. 调用 `save_skills` 保存
  2. 调用 `load_skills` 读取
  3. 验证数据一致
- **预期结果**: 技能列表正确持久化
- **边界条件**: 
  - 数据格式错误
  - 存储权限错误

---

### Case ID: `TC-BE-UNIT-022`
- **模块**: `storage.rs`
- **测试名称**: Feed 列表持久化
- **关联代码**: `test_save_and_load_feeds`
- **前置条件**: 准备 Feed 列表
- **测试步骤**:
  1. 调用 `save_feeds` 保存
  2. 调用 `load_feeds` 读取
  3. 验证数据一致
- **预期结果**: Feed 列表正确持久化
- **边界条件**: 
  - 数据格式错误
  - 存储权限错误

---

## 10. 边界条件测试

### Case ID: `TC-BE-UNIT-023`
- **模块**: 多个模块
- **测试名称**: 异常处理与错误传播
- **关联代码**: `test_error_handling`
- **前置条件**: 模拟各种错误场景
- **测试步骤**:
  1. 模拟文件不存在
  2. 验证返回合适的错误
  3. 模拟权限不足
  4. 验证返回权限错误
  5. 模拟网络超时
  6. 验证返回超时错误
- **预期结果**: 错误正确传播
- **边界条件**: 
  - 嵌套错误
  - 错误链

---

### Case ID: `TC-BE-UNIT-024`
- **模块**: 多个模块
- **测试名称**: 并发安全
- **关联代码**: `test_concurrent_access`
- **前置条件**: 多线程环境
- **测试步骤**:
  1. 多线程同时读取
  2. 验证数据一致性
  3. 多线程同时写入
  4. 验证数据正确性
  5. 混合读写操作
  6. 验证数据正确性
- **预期结果**: 并发操作安全
- **边界条件**: 
  - 高并发
  - 死锁检测
