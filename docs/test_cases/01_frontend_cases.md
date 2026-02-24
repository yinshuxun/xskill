# 前端测试用例 (React UI)

这份文档记录了项目中针对 React 组件和 Hooks 所编写的全部自动化测试用例。每个用例分配了唯一的 `Case ID`，便于后续与代码文件（`.test.tsx`）进行注释关联。

## App 主页面

### Case ID: `TC-FE-001`
- **模块**: `App.tsx`
- **测试名称**: 基础渲染无崩溃
- **关联代码**: `src/App.test.tsx` -> `renders without crashing`
- **前置条件**: 无特殊依赖。
- **测试步骤**:
  1. 调用 `render(<App />)` 挂载组件。
- **预期结果**: 组件挂载成功，没有任何运行时抛出异常。

---

## 技能卡片 (SkillCard)

### Case ID: `TC-FE-002`
- **模块**: `SkillCard.tsx`
- **测试名称**: 正确渲染技能基础信息和层级 Badge
- **关联代码**: `src/components/SkillCard.test.tsx` -> `renders skill information correctly`
- **前置条件**: 
  - 构造包含名称、描述和 `.xskill/hub` 路径的 `mockSkill`。
  - 构造有效的 Agent Tool 列表 `mockTools`。
- **测试步骤**:
  1. 将 mock 数据作为 props 传入并渲染 `SkillCard`。
  2. 使用 `screen.getByText` 查找对应信息。
- **预期结果**: 
  - 技能名称和描述被正确显示。
  - 由于路径包含 `.xskill/hub`，UI 上必须正确计算并展示 "Hub Skill" 的层级 Badge。

### Case ID: `TC-FE-003`
- **模块**: `SkillCard.tsx`
- **测试名称**: 响应配置按钮的点击事件
- **关联代码**: `src/components/SkillCard.test.tsx` -> `handles configure click`
- **前置条件**: 
  - 提供 `onConfigure` 的 mock callback（利用 `vi.fn()`）。
- **测试步骤**:
  1. 渲染 `SkillCard`。
  2. 使用 `screen.getAllByRole('button')` 获取操作按钮。
  3. 模拟点击配置按钮（Wrench 图标所在按钮）。
- **预期结果**: `onConfigure` mock 函数被成功调用，且传入了正确的 `mockSkill` 对象。

---

## 项目技能管理弹窗 (ManageProjectSkillsDialog)

### Case ID: `TC-FE-004`
- **模块**: `ManageProjectSkillsDialog.tsx`
- **测试名称**: 弹窗渲染并自动尝试加载项目目录下的技能
- **关联代码**: `src/components/ManageProjectSkillsDialog.test.tsx` -> `renders correctly and tries to load skills...`
- **前置条件**: 
  - Mock `@tauri-apps/plugin-fs` 的 `readDir`，当访问 `.cursor` 目录时返回伪造的文件列表。
  - Mock 一个合法的 `project` 对象传入组件。
- **测试步骤**:
  1. 在 `act` 环境下渲染组件，并设置 `isOpen={true}`。
  2. 验证弹窗的标题和正在扫描的项目名是否出现。
  3. 使用 `waitFor` 等待异步文件读取完成。
- **预期结果**: 
  - 弹窗正确渲染标题 "Manage Project Skills"。
  - 异步加载完成后，从 Mock 数据中返回的技能名称（如 `cursor-skill-1`）被显示在列表中。
  - 正确识别并显示其来源为 ".cursor/skills"。

### Case ID: `TC-FE-005`
- **模块**: `ManageProjectSkillsDialog.tsx`
- **测试名称**: 通过 invoke 调用后端执行技能删除
- **关联代码**: `src/components/ManageProjectSkillsDialog.test.tsx` -> `handles deleting a skill via invoke`
- **前置条件**: 
  - 前置条件同 `TC-FE-004`，确保技能列表已加载。
  - Mock `@tauri-apps/api/core` 的 `invoke` 接口。
  - Mock `window.confirm` 使其自动返回 `true`。
- **测试步骤**:
  1. 渲染组件并等待技能列表加载完毕。
  2. 定位到列表中技能的 "删除" (Trash) 按钮并点击。
  3. 等待删除操作完成。
- **预期结果**: 
  - 触发了 `window.confirm`。
  - `invoke` 被调用，并传入了准确的命令名 `delete_skill` 和绝对路径参数（如 `.../.cursor/skills/cursor-skill-1`）。
