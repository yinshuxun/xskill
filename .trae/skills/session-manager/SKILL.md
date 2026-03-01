# Session Manager Skill

## 技能描述

Session Manager 是一个专门用于管理和记录会话的技能，帮助用户捕获、组织和回顾每次会话的内容，确保上下文不会丢失。

## 功能特性

- **会话记录**：自动或手动记录会话内容，包括参与者、时间、核心内容、行动项和参考资料
- **会话分类**：支持按类型（会议、头脑风暴、 bug 修复、规划）分类会话
- **模板生成**：提供标准化的会话记录模板
- **搜索和过滤**：支持按日期、主题、类型等维度搜索和过滤会话记录
- **集成到 todo.md**：将会话记录自动同步到项目的 todo.md 文件

## 使用方法

### 1. 开始新会话

```bash
# 开始一个新的会议会话
session-manager start --title "项目规划会议" --type meeting --participants "团队成员"

# 开始一个新的头脑风暴会话
session-manager start --title "新功能创意" --type brainstorming --participants "产品团队, 开发团队"
```

### 2. 添加会话内容

```bash
# 添加核心内容
session-manager add --content "讨论了项目的技术架构"

# 添加行动项
session-manager add --action "完成技术方案文档" --assignee "张三" --deadline "2026-03-10"

# 添加参考资料
session-manager add --reference "技术架构设计文档" --url "https://example.com/docs/architecture"
```

### 3. 结束会话并保存

```bash
# 结束会话并保存到 todo.md
session-manager end --save

# 结束会话并预览内容
session-manager end --preview
```

### 4. 管理会话记录

```bash
# 列出所有会话
session-manager list

# 搜索会话
session-manager search --keyword "技术架构"

# 查看特定会话详情
session-manager view --id "2026-02-28-1"
```

## 配置选项

Session Manager 技能支持以下配置选项：

| 配置项 | 描述 | 默认值 |
|-------|------|-------|
| `todo_file_path` | todo.md 文件的路径 | `tasks/todo.md` |
| `session_dir` | 会话记录存储目录 | `.trae/skills/session-manager/sessions` |
| `default_participants` | 默认参与者 | `[]` |
| `default_type` | 默认会话类型 | `meeting` |

## 集成到工作流

1. **手动集成**：在每次会话开始和结束时运行相应的命令
2. **自动集成**：将 Session Manager 集成到现有的会议工具或开发流程中
3. **团队协作**：多个团队成员可以共享和访问同一会话记录

## 示例工作流

1. 开始会话：`session-manager start --title "每日站会" --type meeting`
2. 记录内容：`session-manager add --content "讨论了昨日进度和今日计划"`
3. 添加行动项：`session-manager add --action "修复登录功能 bug" --assignee "李四" --deadline "今天"`
4. 结束会话：`session-manager end --save`
5. 查看记录：在 `tasks/todo.md` 文件的会话记录部分查看详细内容

## 注意事项

- 确保 `tasks/todo.md` 文件存在且有写入权限
- 首次使用时会自动创建必要的目录结构
- 会话记录会按日期组织，便于后续查找和回顾
