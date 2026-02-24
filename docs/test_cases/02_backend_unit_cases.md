# 后端单元测试用例 (Rust Unit)

这份文档涵盖了 Tauri/Rust 后端所有核心模块单元级别（Unit Level）的测试用例。每个模块下的函数隔离执行，避免复杂的外部依赖和副作用。

## Feed 解析器 (Feed Parser)

### Case ID: `TC-BE-UNIT-001`
- **模块**: `feed_parser.rs`
- **测试名称**: Feed 解析失败与异常处理
- **关联代码**: `test_fetch_feed_invalid_url`
- **前置条件**: 启动一个无效或不可达的 URL（例如 "not-a-url"）。
- **测试步骤**:
  1. 调用 `fetch_feed("not-a-url")` 异步方法。
  2. 验证结果是 `Err`。
- **预期结果**: 解析器返回错误，且错误信息中包含 "Failed to fetch feed"。

---

## GitHub API (GitHub Client)

### Case ID: `TC-BE-UNIT-002`
- **模块**: `github.rs`
- **测试名称**: URL 格式自动转换（Raw 与 Blob）
- **关联代码**: `test_convert_github_url`
- **前置条件**: 准备三个 URL：标准的 raw 格式，github blob 格式，完全不相关的格式（如 Google）。
- **测试步骤**:
  1. 调用 `convert_github_url` 分别传入三个 URL。
- **预期结果**:
  - Raw 格式返回自身内容。
  - Blob 格式（例如 `/blob/main/`）被准确替换为相应的 `raw.githubusercontent.com` 格式。
  - 不相关格式返回 `None`。

### Case ID: `TC-BE-UNIT-003`
- **模块**: `github.rs`
- **测试名称**: 文件请求失败时的处理
- **关联代码**: `test_fetch_github_file_invalid`
- **前置条件**: 准备一个不支持的 URL（如 `https://google.com`）。
- **测试步骤**:
  1. 调用 `fetch_github_file` 方法请求该 URL。
  2. 验证返回结果。
- **预期结果**: 函数提早退出，返回 `Err("Unsupported URL format")`。

---

## 配置文件检测 (Config Manager)

### Case ID: `TC-BE-UNIT-004`
- **模块**: `config_manager.rs`
- **测试名称**: 自动检测 Node.js 技能入口
- **关联代码**: `test_detect_default_config_node`
- **前置条件**: 
  - 在临时沙箱 (`TempDir`) 创建一个 `package.json`。
  - 创建一个 `index.js` 作为执行入口。
- **测试步骤**:
  1. 调用 `detect_default_config` 并传入该目录路径。
- **预期结果**: 正确识别项目类型，返回 `command` 为 "node"，并附带其对应的参数。

### Case ID: `TC-BE-UNIT-005`
- **模块**: `config_manager.rs`
- **测试名称**: 自动检测 Python 技能入口
- **关联代码**: `test_detect_default_config_python`
- **前置条件**:
  - 创建一个 `pyproject.toml` 文件。
  - 创建一个 `main.py` 作为入口。
- **测试步骤**:
  1. 调用 `detect_default_config` 并传入该目录路径。
- **预期结果**: 正确识别项目类型，返回 `command` 为 "python3"，并附带对应的文件参数。

---

## 工作区项目扫描器 (Workspace Scanner)

### Case ID: `TC-BE-UNIT-006`
- **模块**: `scanner.rs`
- **测试名称**: 本地目录深度遍历及有效工程筛选
- **关联代码**: `test_scan_roots`
- **前置条件**:
  - 在临时目录中构建如下结构：
    - `proj_a`（包含 `.git` 和 `AGENTS.md`）
    - `proj_b`（包含 `.git` 和有 mcp 关键字的 `package.json`）
    - `node_modules`（忽略目录，内置 `.git`）
- **测试步骤**:
  1. 调用 `scan_roots` 扫描创建的基准目录。
  2. 根据项目名称升序排序。
- **预期结果**: 
  - 返回的总工程数量恰好为 2 个。
  - `proj_a` 被标识为非 MCP 项目，但含有 `has_agents_md` 属性。
  - `proj_b` 被标识为 MCP 项目（`has_mcp` = true），且无 agents md。
  - `node_modules` 被成功跳过（防止卡顿和无限递归）。

---

## 套装管理器 (Suite Manager)

### Case ID: `TC-BE-UNIT-007`
- **模块**: `suite_manager.rs`
- **测试名称**: Suite 设置持久化存储的序列化与反序列化
- **关联代码**: `test_save_and_load_suites`
- **前置条件**: 构造一个包含 `id`、`name`、`policy_rules`（Prompt）、`loadout_skills` 的合法 `Suite` 数据对象。
- **测试步骤**:
  1. 将数据直接用 `serde_json` 生成并断言。
  2. 从序列化字符串中再解析回 `Vec<Suite>`。
- **预期结果**: 
  - `Suite` 的长度不变。
  - 核心属性（如 `name`）保持解析前后一致。
