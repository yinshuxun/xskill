# 用户核心场景端到端测试 (E2E User Scenarios)

这份文档专门整理了 8 个最贴近真实用户行为的端到端测试用例。所有的用例都会在沙箱（`XSKILL_TEST_HOME`）中模拟，并在 `integration_tests.rs` 中使用代码实现。

### Case ID: `TC-E2E-001`
- **场景描述**: 创建 Skill 并验证 Hub 生成。
- **测试步骤**: 
  1. 调用 `create_skill` 创建一个新的 Skill。
  2. 验证它被正确生成在本地 Hub 目录 `~/.xskill/skills/` 下。
  3. 读取 `SKILL.md`，验证其内容（name, description, 文本体）是否完全正确。

### Case ID: `TC-E2E-002`
- **场景描述**: 技能多模式跨 Agent 同步。
- **测试步骤**:
  1. 将上一步创建的技能，分别使用 `copy` 模式和 `link` (软链接) 模式同步到其他 agent（如 `cursor`、`windsurf`）。
  2. 断言验证在对应的 Agent 目录下确实存在了这个新创建的 Skill 文件夹或软链。

### Case ID: `TC-E2E-003`
- **场景描述**: 成功删除技能。
- **测试步骤**:
  1. 调用 `delete_skill` 对创建好的技能执行删除。
  2. 验证文件系统中该技能的文件夹已不复存在。

### Case ID: `TC-E2E-004`
- **场景描述**: Import GitHub 技能闭环。
- **测试步骤**:
  1. 模拟调用后端方法导入远端技能 `https://github.com/OthmanAdi/planning-with-files`。
  2. 等待拉取完成后，验证它在 Hub 目录生成。
  3. 执行 sync 操作将其同步给模拟的 Agent。
  4. 最终调用 `delete_skill` 彻底清除。

### Case ID: `TC-E2E-005`
- **场景描述**: 本地已有 Agent 技能的发现与删除。
- **测试步骤**:
  1. 直接在沙箱伪造的 Agent 目录（如 `.claude/skills/fake-skill`）写入技能文件。
  2. 调用 `get_all_local_skills`，验证系统能否正确识别并展示该未知技能。
  3. 调用 `delete_skill` 彻底删除它。

### Case ID: `TC-E2E-006`
- **场景描述**: Project 级别技能的联动。
- **测试步骤**:
  1. 创建模拟的项目文件夹，并在其内部的 `.claude/skills/` 放一个本地技能。
  2. 验证能够直接将其删除。
  3. 从 Hub 中导入一个技能，拷贝（或链接）到这个 Project 的相对路径下，验证路径是否符合预期。

### Case ID: `TC-E2E-007`
- **场景描述**: Marketplace Feed 下载校验。
- **测试步骤**:
  1. Mock 解析一个 Marketplace 的 JSON 列表（Feed）。
  2. 随机选取列表中的一项，调用下载逻辑将其安装到本地 Hub。
  3. 检查下载下来的文件夹结构是否包含预期的 `package.json` 或 `SKILL.md` 等标识文件。

### Case ID: `TC-E2E-008`
- **场景描述**: Suite (套装) 的完整生命周期。
- **测试步骤**:
  1. 拼装一个自定义的 Suite 对象并保存 (`save_suites`)。
  2. 调用 `load_suites` 并展示出列表，验证名字和包含的技能列表。
  3. 从列表中移除它并再次保存，验证成功被删除。
