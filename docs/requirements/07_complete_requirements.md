# XSkill 完整需求交互文档

> **版本**: v0.5.1  
> **最后更新**: 2026-02-28  
> **文档目标**: 为测试用例编写提供完整的功能需求和交互细节

---

## 1. 项目概述

### 1.1 产品定位
XSkill 是一款专为 Vibe Coding 开发者设计的 macOS 桌面端应用，用于本地化管理、创建、同步和发现 AI Skills (基于 MCP 协议)。

### 1.2 核心价值
- **Privacy First**: 所有数据本地存储，不经过第三方服务器
- **One-Click Sync**: 一键同步到多个 AI 工具配置
- **Unified Hub**: 统一管理所有技能（本地创建/市场下载/导入）
- **Powerful CLI**: 命令行工具支持自动化

### 1.3 技术栈
- **前端**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **后端**: Tauri v2 (Rust)
- **存储**: Tauri Plugin Store (JSON) + 本地文件系统
- **构建**: GitHub Actions CI/CD

---

## 2. 核心概念

### 2.1 Skill (技能)
一个实现了 MCP (Model Context Protocol) 协议的插件，通常包含：
- `SKILL.md`: 技能定义文件（包含元数据和说明）
- `scripts/`: 可执行脚本目录
- `references/`: 文档和备忘录
- `assets/`: 模板和静态文件

### 2.2 三层存储架构

| Tier | 路径 | 说明 | Badge 颜色 |
|------|------|------|-----------|
| **Hub** | `~/.xskill/skills/` | 全局中心仓库，所有工具共享，是 Source of Truth | 绿色 (emerald) |
| **Agent** | `~/.cursor/skills/`, `~/.config/opencode/skills/` 等 | 各 AI 工具的全局 Skills 目录 | 蓝色 (blue) |
| **Project** | `<project>/.cursor/skills/` 等 | 单个项目内的 Skills | 灰色 (slate) |

### 2.3 同步模式
- **Copy (复制)**: 将 Skill 从 Hub 复制到目标目录，独立副本，互不影响
- **Link (链接)**: 从 Hub 创建 Symlink 到目标目录，Hub 修改即时生效

### 2.4 Suite (套件)
将一组 Skills 和 Rules (AGENTS.md) 打包成一个"套件"，可一键应用到项目。

---

## 3. 功能模块详细需求

### 3.1 XSkill Hub 页面

#### 3.1.1 页面入口
- **路径**: `/hub`
- **访问条件**: 侧边栏第一个导航项
- **权限**: 所有用户

#### 3.1.2 功能组件

##### 3.1.2.1 顶部工具栏
**组件**: `HubPage.tsx` (lines 1-124)

**元素**:
1. **标题**: "Central Hub"
2. **副标题**: "Manage all your agent skills in the master repository."
3. **搜索框**:
   - 占位符: "Search skills..."
   - 功能: 实时过滤 Hub 中的技能（按名称和描述）
   - 样式: 圆角输入框，带搜索图标
4. **刷新按钮**:
   - 图标: `RefreshCw`
   - 功能: 重新扫描所有本地技能
   - 状态: 加载时旋转动画
5. **导入按钮**:
   - 图标: `ScanSearch`
   - 文字: "Import"
   - 功能: 打开导入对话框
   - **完整交互流程**:
     ```
     用户点击 "Import" 按钮
       ↓
     打开 OnboardingDialog 对话框 (模态窗口)
       ↓
     Step 1: 选择导入方式
       ├─ [GitBranch Icon] "Import from Git"
       │   - 描述: "Clone a skill directly from a GitHub repository URL."
       │   - 点击后 → 跳转到 Step 2A (Git 导入模式)
       │
       └─ [FolderSearch Icon] "Scan Local Projects"
           - 描述: "Find skills in your existing projects and tools."
           - 点击后 → 跳转到 Step 2B (扫描模式)
       ↓
     用户选择导入方式后，进入对应流程
     ```

   - **对话框属性**:
     - 标题: "Import Skills"
     - 大小: 中等 (600px 宽)
     - 位置: 屏幕中心
     - 关闭方式: 
       - 点击遮罩层
       - 按 ESC 键
       - 点击右上角 X 按钮
     - 状态管理: `open` (boolean)
   ```

   - **数据流**:
     ```typescript
     // 前端状态
     const [step, setStep] = useState<1 | 2A | 2B>(1);
     const [gitUrl, setGitUrl] = useState("");
     const [scanning, setScanning] = useState(false);
     const [discoveredSkills, setDiscoveredSkills] = useState<DiscoveredSkill[]>([]);
     const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
     
     // 导入完成回调
     onImportComplete: () => {
       refreshSkills();  // 刷新技能列表
       onClose();        // 关闭对话框
     }
     ```
6. **新建技能按钮**:
   - 图标: `Plus`
   - 文字: "New Skill"
   - 功能: 打开新建技能对话框
   - **完整交互流程**:
     ```
     用户点击 "New Skill" 按钮
       ↓
     打开 NewSkillDialog 对话框 (模态窗口)
       ↓
     显示表单字段 (7 个必填/可选字段)
       ↓
     用户填写表单:
       ├─ Name (必填): "test-skill"
       ├─ Description (必填): "A test skill"
       ├─ Negative Triggers (可选): "- Don't use for Vue..."
       ├─ Target Tool (必填): "xskill Hub"
       ├─ Allowed Tools (可选): [Cursor, Claude Code]
       ├─ Content (必填): "Describe what this skill does..."
       └─ Collect to Hub (默认勾选): ✓
       ↓
     点击 "Create Skill" 按钮
       ↓
     前端验证:
       ├─ Name 格式验证 (1-64 字符, 小写字母, 数字, 连字符)
       ├─ Name 重复验证 (检查是否已存在)
       ├─ Description 长度验证 (1-1024 字符)
       └─ Content 长度验证 (1-5000 字符)
       ↓
     验证通过 → 显示 Loading 状态
       ↓
     调用 Rust 命令: invoke("create_skill", {...})
       ↓
     后端处理:
       ├─ 创建目录结构 (scripts/, references/, assets/)
       ├─ 生成 SKILL.md (符合模板)
       ├─ 创建 README 占位文件
       └─ (可选) 复制到 Hub
       ↓
     成功 → 刷新技能列表 → 关闭对话框
     失败 → 显示错误消息 (alert)
       ↓
     用户确认错误 → 可重新编辑表单
     ```

   - **对话框属性**:
     - 标题: "Create New Skill"
     - 大小: 大 (800px 宽)
     - 位置: 屏幕中心
     - 关闭方式: 
       - 点击遮罩层 (仅在未加载时)
       - 按 ESC 键 (仅在未加载时)
       - 点击右上角 X 按钮 (仅在未加载时)
     - 状态管理: `open`, `isLoading`

   - **表单验证规则**:
     ```typescript
     // Name 验证
     const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
     const isValidName = name.length >= 1 && name.length <= 64 && nameRegex.test(name);
     
     // Description 验证
     const isValidDescription = description.length >= 1 && description.length <= 1024;
     
     // Content 验证
     const isValidContent = content.length >= 1 && content.length <= 5000;
     
     // 表单提交状态
     const canSubmit = isValidName && isValidDescription && isValidContent && !isLoading;
     ```

   - **Rust 后端处理** (lines 1-186 in `scaffold.rs`):
     ```rust
     pub fn create_skill(
         name: String,
         description: String,
         tool_key: String,
         content: String,
         negative_triggers: Option<String>,
         allowed_tools: Option<Vec<String>>,
         collect_to_hub: bool,
     ) -> Result<String, String> {
         // 1. 验证名称格式
         validate_skill_name(&name)?;
         
         // 2. 创建目录结构
         let skill_dir = create_skill_directory(&name)?;
         
         // 3. 生成 SKILL.md
         let skill_md = generate_skill_md(
             &name, &description, &content, 
             negative_triggers, allowed_tools
         );
         write_file(skill_dir.join("SKILL.md"), skill_md)?;
         
         // 4. 创建 README 占位文件
         create_readme_placeholder(&skill_dir)?;
         
         // 5. 复制到 Hub (如果需要)
         if collect_to_hub {
             collect_to_hub(&skill_dir)?;
         }
         
         Ok(skill_dir.to_string_lossy().to_string())
     }
     ```

   - **数据流**:
     ```typescript
     // 前端状态
     const [name, setName] = useState("");
     const [description, setDescription] = useState("");
     const [negativeTriggers, setNegativeTriggers] = useState("");
     const [toolKey, setToolKey] = useState("xskill");
     const [allowedTools, setAllowedTools] = useState<string[]>([]);
     const [content, setContent] = useState("");
     const [collectToHub, setCollectToHub] = useState(true);
     const [isLoading, setIsLoading] = useState(false);
     const [errors, setErrors] = useState<Record<string, string>>({});
     
     // 表单提交
     const handleSubmit = async () => {
       // 1. 验证表单
       const newErrors = validateForm();
       if (Object.keys(newErrors).length > 0) {
         setErrors(newErrors);
         return;
       }
       
       // 2. 设置加载状态
       setIsLoading(true);
       
       try {
         // 3. 调用 Rust 命令
         await invoke("create_skill", {
           name,
           description,
           toolKey,
           content,
           negativeTriggers: negativeTriggers || undefined,
           allowedTools: allowedTools.length > 0 ? allowedTools : undefined,
           collectToHub
         });
         
         // 4. 成功处理
         alert("✅ Skill created successfully!");
         refreshSkills();
         onClose();
       } catch (err) {
         // 5. 错误处理
         alert(`❌ Failed to create skill: ${err}`);
       } finally {
         setIsLoading(false);
       }
     };
     ```

   - **错误处理**:
     ```typescript
     // 表单验证错误
     if (!isValidName) {
       setErrors(prev => ({ ...prev, name: "Invalid name format" }));
     }
     
     // Rust 错误
     catch (err) {
       if (err.includes("already exists")) {
         alert("❌ Skill already exists. Please choose a different name.");
       } else if (err.includes("permission")) {
         alert("❌ Permission denied. Please check your file system permissions.");
       } else {
         alert(`❌ Failed to create skill: ${err}`);
       }
     }
     ```

##### 3.1.2.2 技能列表
**组件**: `SkillCard` (lines 1-289)

**数据源**: 
- 过滤条件: `skill.path.includes(".xskill/hub") || skill.path.includes(".xskill/skills")`
- 显示所有 Hub 中的技能

**SkillCard 结构**:

```
┌─────────────────────────────────────────────┐
│ Card Header                                 │
│ ┌─────────────────────────────────────┐   │
│ │ Skill Name                          │   │
│ │ [Hub Badge]                         │   │
│ └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ Card Content                                │
│ Description (3 lines max)                   │
│ ┌─────────────────────────────────────┐   │
│ │ /Users/.../.xskill/skills/skill-name│   │
│ │ [Copy] [Open] [Preview]             │   │
│ └─────────────────────────────────────┘   │
│ [Agent Badges...]                           │
├─────────────────────────────────────────────┤
│ Card Footer                                 │
│ [⚙ Configure] [↑ Collect]  [Sync] [🗑 Delete]│
└─────────────────────────────────────────────┘
```

**交互功能**:

| 功能 | 图标 | 触发条件 | 说明 |
|------|------|---------|------|
| **配置** | `Wrench` | 所有技能 | 打开配置对话框 |
| **收集** | `ArrowUpCircle` | 非 Hub 技能 | 将 Agent/Project 层技能归集到 Hub |
| **同步** | `RefreshCw` | 所有技能 | 打开同步对话框 |
| **删除** | `Trash2` | 所有技能 | 删除技能（带确认） |
| **复制路径** | `Copy` | Hover 路径时 | 复制技能路径到剪贴板 |
| **打开文件夹** | `FolderOpen` | Hover 路径时 | 用系统文件管理器打开 |
| **预览 SKILL.md** | `Eye` | Hover 路径时 | 打开预览对话框 |

##### 3.1.2.3 同步对话框
**组件**: `SkillCard` (lines 220-289)

**触发**: 点击 "Sync" 按钮

**完整交互流程**:
```
用户点击技能卡片的 "Sync" 按钮
  ↓
打开同步对话框 (模态窗口)
  ↓
显示所有已安装的工具列表
  ├─ Cursor (已安装)    [Copy] [Link]
  ├─ Claude Code (已安装) [Copy] [Link]
  ├─ OpenCode (已安装)    [Copy] [Link]
  └─ ... (其他工具)
  ↓
用户选择目标工具
  ↓
用户选择同步模式:
  ├─ [Copy] - 复制模式 (灰色按钮)
  │   - 将技能复制到目标工具目录
  │   - 创建独立副本
  │   - Hub 修改不会影响已同步的副本
  │
  └─ [Link] - 链接模式 (蓝色按钮)
      - 从目标工具创建符号链接到 Hub
      - Hub 修改即时生效
      - 仅 macOS/Linux 支持
  ↓
用户点击同步按钮
  ↓
显示 Loading 状态 (按钮旋转动画)
  ↓
调用 Rust 命令: invoke("sync_skill", {
  skillDir: "/path/to/skill",
  targetToolKeys: ["cursor"],
  mode: "copy" | "link"
})
  ↓
后端处理:
  ├─ 验证技能目录存在
  ├─ 解析技能名称 (目录名)
  ├─ 创建目标路径
  ├─ 执行同步:
  │   ├─ Copy: 复制目录 (递归)
  │   └─ Link: 创建符号链接
  ├─ 更新 IDE 配置 (如果适用)
  │   └─ Claude Desktop: 更新 config.json
  └─ 返回成功路径列表
  ↓
成功 → 显示成功提示 → 关闭对话框 → 刷新列表
失败 → 显示错误消息 → 保持对话框打开 → 用户可重试
```

**对话框属性**:
- 标题: "Sync to Agent"
- 大小: 中等 (500px 宽)
- 位置: 屏幕中心
- 关闭方式: 
  - 点击遮罩层
  - 按 ESC 键
  - 点击右上角 X 按钮
- 状态管理: `open`, `syncing`, `syncedPaths`

**工具列表显示逻辑**:
```typescript
// 只显示已安装的工具
const availableTools = tools.filter(t => t.installed);

// 每个工具显示:
<div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
  <div className="flex items-center gap-3">
    <ToolIcon tool={tool.key} />
    <span>{tool.display_name}</span>
  </div>
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => sync(tool.key, "copy")}>
      Copy
    </Button>
    <Button variant="outline" onClick={() => sync(tool.key, "link")}>
      Link
    </Button>
  </div>
</div>
```

**同步模式说明**:
```typescript
// Copy 模式 (默认)
const copyMode = {
  label: "Copy",
  description: "Copy the skill directory to the target tool. Independent copy, changes to the Hub will not affect the synced version.",
  buttonVariant: "outline",  // 灰色主题
  icon: "Copy"
};

// Link 模式
const linkMode = {
  label: "Link",
  description: "Create a symbolic link from the target tool to the Hub. Changes to the Hub will be immediately reflected.",
  buttonVariant: "default",  // 蓝色主题
  icon: "Link",
  platformRestriction: "macOS/Linux only"
};
```

**Rust 后端处理** (lines 1-156 in `ide_sync.rs`):
```rust
pub fn sync_skill(
    skill_dir: String,
    target_tool_keys: Vec<String>,
    mode: Option<String>,
) -> Result<Vec<String>, String> {
    let src = PathBuf::from(&skill_dir);
    
    // 1. 验证源目录存在
    if !src.exists() {
        return Err(format!("Skill directory does not exist: {}", skill_dir));
    }
    
    let skill_name = src.file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid skill directory path")?
        .to_string();
    
    let use_link = mode.as_deref() == Some("link");
    
    let mut written_paths: Vec<String> = Vec::new();
    let mut errors: Vec<String> = Vec::new();
    
    // 2. 遍历目标工具
    for tool_key in &target_tool_keys {
        match tool_skills_dir(tool_key) {
            None => errors.push(format!("Unknown tool key: {}", tool_key)),
            Some(skills_dir) => {
                let dest = skills_dir.join(&skill_name);
                
                // 3. 检查是否已同步
                if let (Ok(s), Ok(d)) = (fs::canonicalize(&src), fs::canonicalize(&dest)) {
                    if s == d {
                        written_paths.push(dest.to_string_lossy().to_string());
                        continue;
                    }
                }
                
                // 4. 执行同步
                let result = if use_link {
                    #[cfg(unix)]
                    { symlink_dir(&src, &dest) }
                    #[cfg(not(unix))]
                    { Err("Symlink mode is only supported on macOS/Linux".to_string()) }
                } else {
                    crate::utils::copy_dir_all(&src, &dest)
                };
                
                // 5. 处理结果
                match result {
                    Ok(_) => {
                        written_paths.push(dest.to_string_lossy().to_string());
                        
                        // 6. 更新 IDE 配置 (如果适用)
                        if tool_key == "claude_code" || tool_key == "claude_desktop" {
                            if let Err(e) = update_claude_desktop_config(&skill_name, &dest) {
                                errors.push(format!("Claude Config Error: {}", e));
                            }
                        }
                    },
                    Err(e) => errors.push(format!("{}: {}", tool_key, e)),
                }
            }
        }
    }
    
    // 7. 返回结果
    if !errors.is_empty() && written_paths.is_empty() {
        return Err(errors.join("; "));
    }
    
    Ok(written_paths)
}
```

**状态反馈**:
```typescript
// Copy 模式按钮
<Button variant="outline" disabled={syncing}>
  {syncing ? <RefreshCw className="animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
  {syncing ? "Syncing..." : "Copy"}
</Button>

// Link 模式按钮
<Button variant="default" disabled={syncing}>
  {syncing ? <RefreshCw className="animate-spin" /> : <Link className="mr-2 h-4 w-4" />}
  {syncing ? "Syncing..." : "Link"}
</Button>
```

**错误处理**:
```typescript
// 同步失败处理
const handleSyncError = (error: string) => {
  const errorMessages = error.split("; ");
  
  if (error.includes("permission")) {
    alert("❌ Permission denied. Please check your file system permissions.");
  } else if (error.includes("symlink")) {
    alert("❌ Symlink mode is only supported on macOS/Linux.");
  } else if (error.includes("Unknown tool")) {
    alert("❌ Unknown tool key. Please check your tool configuration.");
  } else {
    alert(`❌ Sync failed: ${error}`);
  }
};

// 部分成功处理
if (writtenPaths.length > 0 && errors.length > 0) {
  alert(`✅ Partial success: ${writtenPaths.length} skill(s) synced.\n❌ Errors: ${errors.join("; ")}`);
} else if (writtenPaths.length > 0) {
  alert(`✅ Successfully synced ${writtenPaths.length} skill(s) to ${targetTool}`);
}
```

**数据流**:
```typescript
// 前端状态
const [syncing, setSyncing] = useState(false);
const [syncedPaths, setSyncedPaths] = useState<string[]>([]);
const [syncErrors, setSyncErrors] = useState<string[]>([]);

// 同步函数
const handleSync = async (targetTool: string, mode: "copy" | "link") => {
  setSyncing(true);
  
  try {
    const result = await invoke("sync_skill", {
      skillDir: skill.path,
      targetToolKeys: [targetTool],
      mode: mode
    });
    
    setSyncedPaths(result);
    
    if (result.length > 0) {
      alert(`✅ Successfully synced to ${targetTool}!`);
      onClose();
      refreshSkills();
    }
  } catch (err) {
    setSyncErrors([err as string]);
    handleSyncError(err as string);
  } finally {
    setSyncing(false);
  }
};
```

**边界条件**:
```typescript
// 1. 同步到已同步的工具
if (skill.tool_key === targetTool) {
  alert("⚠️ Skill is already installed in this tool.");
  return;
}

// 2. 同步到未安装的工具
if (!tools.find(t => t.key === targetTool)?.installed) {
  alert("❌ Tool is not installed. Please install the tool first.");
  return;
}

// 3. 同步到不支持 Link 模式的平台
if (mode === "link" && !isUnix) {
  alert("❌ Symlink mode is only supported on macOS/Linux.");
  return;
}
```

##### 3.1.2.4 预览对话框
**组件**: `SkillCard` (lines 282-289)

**触发**: 点击 "View SKILL.md" 图标 (Eye 图标)

**完整交互流程**:
```
用户将鼠标悬停在技能路径上
  ↓
显示 Hover 操作按钮组:
  ├─ [Copy] - 复制路径
  ├─ [FolderOpen] - 打开文件夹
  └─ [Eye] - 预览 SKILL.md (新增)
  ↓
用户点击 "View SKILL.md" 图标
  ↓
打开预览对话框 (模态窗口)
  ↓
显示双栏布局:
  ├─ 左侧栏 (30% 宽度)
  │   ├─ 技能名称
  │   ├─ 技能描述
  │   ├─ 技能路径 (完整路径)
  │   └─ 技能创建时间
  │
  └─ 右侧栏 (70% 宽度)
      ├─ SKILL.md 内容 (Markdown 渲染)
      ├─ 支持滚动
      └─ 代码高亮
  ↓
用户可以:
  ├─ 浏览 SKILL.md 内容
  ├─ 滚动查看完整内容
  ├─ 复制路径到剪贴板
  └─ 关闭对话框
  ↓
关闭方式:
  ├─ 点击遮罩层
  ├─ 按 ESC 键
  └─ 点击右上角 X 按钮
```

**对话框属性**:
- 标题: "Preview SKILL.md"
- 大小: 大 (900px 宽, 85vh 高)
- 位置: 屏幕中心
- 关闭方式: 
  - 点击遮罩层
  - 按 ESC 键
  - 点击右上角 X 按钮
- 状态管理: `open`, `skillContent`

**双栏布局**:
```typescript
<div className="flex h-[85vh] w-full max-w-5xl rounded-2xl bg-zinc-50 dark:bg-zinc-900 shadow-2xl">
  {/* 左侧栏: 技能信息 */}
  <div className="w-[30%] border-r border-zinc-200 dark:border-zinc-800 p-6">
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Skill Name
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {skill.name}
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Description
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
          {skill.description}
        </p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Path
        </h3>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Copy className="h-4 w-4 cursor-pointer hover:text-primary" />
          <span className="truncate">{skill.path}</span>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Created At
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatDate(skill.createdAt)}
        </p>
      </div>
    </div>
  </div>
  
  {/* 右侧栏: SKILL.md 内容 */}
  <div className="w-[70%] overflow-y-auto p-6">
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown>{skill.content}</ReactMarkdown>
    </div>
  </div>
</div>
```

**SKILL.md 内容渲染**:
```typescript
// 使用 react-markdown 渲染 Markdown
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown 
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg overflow-x-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className={`${className} bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded`} {...props}>
          {children}
        </code>
      );
    },
  }}
>
  {skill.content}
</ReactMarkdown>
```

**复制路径功能**:
```typescript
const handleCopyPath = async () => {
  try {
    await navigator.clipboard.writeText(skill.path);
    alert("✅ Path copied to clipboard!");
  } catch (err) {
    alert("❌ Failed to copy path.");
  }
};

<Copy 
  className="h-4 w-4 cursor-pointer hover:text-primary transition-colors"
  onClick={handleCopyPath}
  title="Copy path to clipboard"
/>
```

**数据流**:
```typescript
// 前端状态
const [open, setOpen] = useState(false);
const [skillContent, setSkillContent] = useState("");

// 打开预览
const handleOpenPreview = async () => {
  try {
    // 读取 SKILL.md 文件内容
    const content = await invoke("read_file", {
      path: path.join(skill.path, "SKILL.md")
    });
    
    setSkillContent(content);
    setOpen(true);
  } catch (err) {
    alert(`❌ Failed to read SKILL.md: ${err}`);
  }
};

// 关闭预览
const handleClosePreview = () => {
  setOpen(false);
  setSkillContent("");
};
```

**Rust 后端处理**:
```rust
// 读取文件内容
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}
```

**边界条件**:
```typescript
// 1. SKILL.md 不存在
if (!fs::existsSync(path.join(skill.path, "SKILL.md"))) {
  alert("❌ SKILL.md not found.");
  return;
}

// 2. 文件读取失败
try {
  const content = await invoke("read_file", { path });
} catch (err) {
  alert(`❌ Failed to read file: ${err}`);
  return;
}

// 3. Markdown 渲染错误
try {
  <ReactMarkdown>{skill.content}</ReactMarkdown>
} catch (err) {
  <pre>{skill.content}</pre>  // 降级为纯文本
}
```

**错误处理**:
```typescript
// 文件读取错误
catch (err) {
  if (err.includes("ENOENT")) {
    alert("❌ SKILL.md not found. The skill may be corrupted.");
  } else if (err.includes("EACCES")) {
    alert("❌ Permission denied. Please check your file system permissions.");
  } else {
    alert(`❌ Failed to read SKILL.md: ${err}`);
  }
}
```

**UI 状态**:
```typescript
// 打开预览按钮 (Hover 时显示)
<Tooltip content="View SKILL.md">
  <Eye 
    className="h-4 w-4 text-zinc-500 hover:text-primary transition-colors cursor-pointer"
    onClick={handleOpenPreview}
  />
</Tooltip>

// 对话框标题栏
<div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
    Preview SKILL.md
  </h2>
  <button 
    onClick={handleClosePreview}
    className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
  >
    <X className="h-5 w-5 text-zinc-500" />
  </button>
</div>
```

##### 3.1.2.5 空状态
**触发条件**: `hubSkills.length === 0 && !loading`

**内容**:
```
┌─────────────────────────────────────┐
│  [LayoutGrid Icon]                  │
│  No skills found                    │
│  Import from marketplace or craft   │
│  a new one.                         │
└─────────────────────────────────────┘
```

---

### 3.2 My Skills 页面

#### 3.2.1 页面入口
- **路径**: `/my-skills`
- **侧边栏位置**: 第二个导航项

#### 3.2.2 功能组件

##### 3.2.2.1 顶部工具栏
**组件**: `MySkillsPage.tsx` (lines 1-133)

**元素**:
1. **标题**: "Installed Skills"
2. **副标题**: "Skills actively running in your AI Agents."
3. **搜索框**: 搜索已安装的技能
4. **刷新按钮**: 重新扫描 IDE

##### 3.2.2.2 技能分组逻辑
**算法** (lines 33-56):
```typescript
skills.forEach(skill => {
  const agent = tools.find(t => 
    skill.path.includes(`.${t.key}/skills`) || 
    skill.path.includes(`.${t.key}/rules`) ||
    skill.tool_key === t.key
  );

  if (agent) {
    // 按技能名称去重
    // 同名技能合并，显示所有使用它的 Agent
  }
});
```

**显示规则**:
- **去重**: 相同名称的技能只显示一个卡片
- **Agent Badges**: 显示该技能在哪些工具中已安装
- **示例**: 
  - Skill "github" 在 Cursor 和 OpenCode 中都有 → 显示一个卡片，带两个 Badge

##### 3.2.2.3 空状态
**触发条件**: `uniqueAgentSkills.length === 0 && !loading`

**内容**:
```
┌─────────────────────────────────────┐
│  [BookOpen Icon]                    │
│  No active skills found             │
│  Go to the Hub to sync skills       │
│  to your agents.                    │
└─────────────────────────────────────┘
```

---

### 3.3 Marketplace 页面

#### 3.3.1 页面入口
- **路径**: `/marketplace`
- **侧边栏位置**: 第五个导航项

#### 3.3.2 功能组件

##### 3.3.2.1 数据源
**优先级**:
1. 本地缓存: `localStorage.getItem("marketplace_cache")`
2. 本地文件: `/data/marketplace.json`
3. 远程文件: `https://raw.githubusercontent.com/buzhangsan/skills-manager-client/master/public/data/marketplace.json`

**数据结构**:
```typescript
interface MarketplaceSkill {
  id: string;
  name: string;
  author: string;
  authorAvatar: string;
  description: string;
  githubUrl: string;
  stars: number;
  forks: number;
  updatedAt: number;
  tags?: string[];
}
```

##### 3.3.2.2 顶部工具栏
**组件**: `MarketplacePage.tsx` (lines 1-321)

**元素**:
1. **标题**: "Marketplace"
2. **副标题**: "Discover open-source intelligence from the community."
3. **搜索框**: 搜索技能（名称、描述、作者）
4. **刷新按钮**: 重新获取市场数据

##### 3.3.2.3 技能卡片网格
**组件**: `SkillCell` (lines 44-118)

**布局**: 
- 响应式网格 (1-3 列)
- 每个卡片包含:
  - 作者头像
  - 技能名称 + 版本 Badge
  - 描述 (3 行截断)
  - Stars/Forks 统计
  - 安装按钮

**安装按钮状态**:
- **未安装**: "Install to Hub" (主色)
- **已安装**: "Installed" (副色，带勾选图标)
- **安装中**: "Installing…" (旋转动画)

##### 3.3.2.4 安装流程
**触发**: 点击 "Install to Hub"

**步骤**:
1. 设置 `installingId` 状态
2. 调用 Rust 命令: `invoke("install_skill_from_url", { repoUrl })`
3. 显示进度消息
4. 安装成功后刷新技能列表
5. 显示成功提示: `alert("✅ "${skill.name}" installed successfully!")`

**错误处理**:
- 显示错误: `alert("❌ Install failed: ${err}")`
- 保持按钮状态可重试

##### 3.3.2.5 空状态
**场景 1**: 加载中
```
┌─────────────────────────────────────┐
│  [RefreshCw Spinner]                │
│  Syncing marketplace...             │
└─────────────────────────────────────┘
```

**场景 2**: 加载失败
```
┌─────────────────────────────────────┐
│  [AlertCircle Icon]                 │
│  Failed to load marketplace data    │
│  {error message}                    │
└─────────────────────────────────────┘
```

**场景 3**: 无搜索结果
```
┌─────────────────────────────────────┐
│  [CloudDownload Icon]               │
│  No skills found matching search.   │
└─────────────────────────────────────┘
```

---

### 3.4 Projects 页面

#### 3.4.1 页面入口
- **路径**: `/projects`
- **侧边栏位置**: 第四个导航项

#### 3.4.2 功能组件

##### 3.4.2.1 顶部工具栏
**组件**: `ProjectsPage.tsx` (lines 1-232)

**元素**:
1. **标题**: "Workspace Projects"
2. **副标题**: "Automatically scanned environments ready for intelligence."
3. **搜索框**: 搜索项目（名称、路径）
4. **刷新按钮**: 重新扫描工作区

##### 3.4.2.2 项目扫描
**Rust 命令**: `scan_workspace`

**扫描路径**:
- `~/workspace`
- `~/projects`
- `~/codes`
- `~/dev`
- 用户自定义路径

**扫描规则** (lines 1-158):
- 最大深度: 5 层
- 忽略目录: `node_modules`, `.git`, `dist`, `build`, `out`, `.next`, `target`
- 项目识别: 检测 `.git` 目录
- MCP 标识: 检测 `mcp.json` 或 `package.json` 中包含 "mcp"
- AGENTS 标识: 检测 `AGENTS.md` 文件

**Project 数据结构**:
```typescript
interface Project {
  path: string;           // 绝对路径
  name: string;           // 目录名
  has_git: boolean;       // 有 .git 目录
  has_mcp: boolean;       // 有 MCP 配置
  has_agents_md: boolean; // 有 AGENTS.md
}
```

##### 3.4.2.3 项目卡片
**组件**: `ProjectCell` (lines 26-102)

**布局**: 
- 响应式网格 (1-2 列)
- 每个卡片包含:
  - 项目图标
  - 项目名称
  - 标签 (Git/MCP/AGENTS)
  - 路径 (截断显示)
  - 操作按钮 (Manage/Add/Suite)

**标签样式**:
- **Git**: 蓝色 Outline Badge
- **MCP**: 蓝色 Fill Badge
- **AGENTS**: 紫色 Fill Badge

##### 3.4.2.4 操作按钮
**组件**: `ProjectCell` (lines 88-102)

**Hover 显示**:
```
┌─────────────────────────┐
│ [⚙ Manage]              │
│                         │
│ [+] Add    [Suite]      │
└─────────────────────────┘
```

**按钮功能**:

1. **Manage (管理)**
   - 打开 `ManageProjectSkillsDialog`
   - 查看和管理项目中的技能

2. **Add (添加技能)**
   - 打开 `ApplySkillsDialog`
   - 从 Hub 选择技能添加到项目

3. **Suite (应用套件)**
   - 打开 `ApplySuiteDialog`
   - 选择套件应用到项目

##### 3.4.2.5 空状态
**场景 1**: 扫描中
```
┌─────────────────────────────────────┐
│  [FolderSearch Pulse]               │
│  Deep scanning local workspace...   │
└─────────────────────────────────────┘
```

**场景 2**: 无项目
```
┌─────────────────────────────────────┐
│  [FolderSearch Icon]                │
│  No matching projects found         │
│  (Looking in ~/workspace, ...)      │
└─────────────────────────────────────┘
```

---

### 3.5 Suites 页面

#### 3.5.1 页面入口
- **路径**: `/suites`
- **侧边栏位置**: 第六个导航项

#### 3.5.2 功能组件

##### 3.5.2.1 顶部工具栏
**组件**: `SuitesPage.tsx` (lines 1-244)

**元素**:
1. **标题**: "Suites & Kits"
2. **副标题**: "Group skills and project rules together to apply them in one click."
3. **新建套件按钮**: 打开编辑器

##### 3.5.2.2 套件列表
**数据源**: `useSuitesStore`

**存储位置**: `~/.xskill/suites.json`

**套件卡片**:
```
┌─────────────────────────────────────┐
│ Card Header                         │
│ Name              [X Skills Badge]  │
│ Description                         │
├─────────────────────────────────────┤
│ Card Content                        │
│ ┌─────────────────────────────────┐ │
│ │ # Project Context               │ │
│ │ ... (policy_rules preview)      │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Card Footer                         │
│ [Edit Suite]      [Delete]          │
└─────────────────────────────────────┘
```

**交互功能**:

| 功能 | 图标 | 说明 |
|------|------|------|
| **编辑** | `Edit` | 打开套件编辑器 |
| **删除** | `Trash2` | 删除套件（带确认） |

##### 3.5.2.3 套件编辑器
**组件**: `SuiteEditor` (lines 151-244)

**表单字段**:

1. **套件名称** (必填)
   - 输入框
   - 占位符: "e.g. React Frontend Kit"

2. **描述** (必填)
   - 输入框
   - 占位符: "What is this suite for?"

3. **策略规则** (AGENTS.md)
   - Textarea (200px 高度)
   - 支持 Markdown
   - 占位符: "# Project Context\n..."

4. **包含技能** (可选)
   - 搜索过滤
   - 多选网格 (1-3 列)
   - 选中状态: 主色背景 + "Added" Badge

**保存逻辑** (lines 19-31):
```typescript
if (suite.id exists) {
  // 更新现有套件
  newSuites = suites.map(s => s.id === suite.id ? suite : s)
} else {
  // 创建新套件
  newSuites = [...suites, { ...suite, id: crypto.randomUUID() }]
}
await saveSuites(newSuites)
```

##### 3.5.2.4 空状态
**触发条件**: `suites.length === 0`

**内容**:
```
┌─────────────────────────────────────┐
│  [Layers Icon]                      │
│  No suites found                    │
│  Create one to organize your skills.│
└─────────────────────────────────────┘
```

---

### 3.6 新建技能对话框

#### 3.6.1 触发方式
- **Hub 页面**: 点击 "New Skill" 按钮
- **My Skills 页面**: 无直接入口（需通过 Hub）

#### 3.6.2 组件
**组件**: `NewSkillDialog.tsx` (lines 1-277)

**表单字段**:

1. **名称** (必填)
   - 验证规则:
     - 1-64 字符
     - 仅小写字母、数字、连字符
     - 不允许连续连字符
   - 图标反馈: ✓ (绿色) / ✗ (红色)

2. **描述** (必填)
   - 输入框
   - 占位符: "What this skill does, when to use it (max 1024 chars)"
   - 说明: "This is the only metadata agents see for routing."

3. **负向触发** (可选)
   - Textarea
   - 占位符: "- Don't use for Vue or Svelte projects\n..."
   - 说明: "Help agents avoid false triggers"

4. **目标工具** (必填)
   - 下拉选择
   - 选项: xskill Hub / Cursor / Claude Code / OpenCode / ...
   - 默认: 第一个已安装工具

5. **允许工具** (可选)
   - 多选按钮组
   - 10 个可用 Agent
   - 功能: 限制哪些 Agent 可以使用此技能

6. **核心说明** (必填)
   - Textarea (150px 高度)
   - 占位符: "Describe what this skill does in detail..."
   - 说明: "Keep it under 500 lines. Move detailed docs to references/ and assets/"

7. **添加到 Hub** (默认勾选)
   - Checkbox
   - 文本: "Automatically add to xskill hub"

**创建流程** (lines 93-127):
```typescript
1. 验证表单
2. 设置 isLoading = true
3. invoke("create_skill", {
     name, description, toolKey,
     content, negativeTriggers, allowedTools,
     collectToHub
   })
4. 刷新技能列表
5. 重置表单
6. 设置 isLoading = false
```

**Rust 后端处理** (lines 1-186 in `scaffold.rs`):
1. 验证名称格式
2. 创建目录结构:
   - `scripts/`
   - `references/`
   - `assets/`
3. 生成 `SKILL.md` (模板见 `generate_skill_md`)
4. 创建 README 占位文件
5. 如果 `collectToHub=true`, 复制到 `~/.xskill/skills/hub/`

---

### 3.7 导入对话框

#### 3.7.1 触发方式
- **Hub 页面**: 点击 "Import" 按钮

#### 3.7.2 组件
**组件**: `OnboardingDialog.tsx` (lines 1-366)

**完整交互流程**:
```
用户点击 "Import" 按钮
  ↓
打开 OnboardingDialog 对话框 (模态窗口, 600px 宽)
  ↓
Step 1: 选择导入方式
  ├─ [GitBranch Icon] "Import from Git"
  │   - 描述: "Clone a skill directly from a GitHub repository URL."
  │   - 按钮样式: outline (灰色)
  │   - 点击后 → setStep(2A) → 跳转到 Step 2A (Git 导入模式)
  │
  └─ [FolderSearch Icon] "Scan Local Projects"
      - 描述: "Find skills in your existing projects and tools."
      - 按钮样式: outline (灰色)
      - 点击后 → setStep(2B) → 跳转到 Step 2B (扫描模式)
  ↓
用户选择导入方式后，进入对应流程
```

**Step 1 详细交互**:
```typescript
// 对话框状态
const [step, setStep] = useState<1 | 2A | 2B>(1);
const [gitUrl, setGitUrl] = useState("");
const [scanning, setScanning] = useState(false);
const [discoveredSkills, setDiscoveredSkills] = useState<DiscoveredSkill[]>([]);
const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
const [importStrategy, setImportStrategy] = useState<"copy" | "move">("copy");

// Step 1 UI
<div className="space-y-6">
  <div 
    className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-primary cursor-pointer transition-all"
    onClick={() => setStep(2A)}
  >
    <GitBranch className="h-8 w-8 text-primary" />
    <div>
      <h3 className="font-semibold">Import from Git</h3>
      <p className="text-sm text-zinc-500">Clone a skill directly from a GitHub repository URL.</p>
    </div>
  </div>
  
  <div 
    className="flex items-center gap-4 p-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-primary cursor-pointer transition-all"
    onClick={() => setStep(2B)}
  >
    <FolderSearch className="h-8 w-8 text-primary" />
    <div>
      <h3 className="font-semibold">Scan Local Projects</h3>
      <p className="text-sm text-zinc-500">Find skills in your existing projects and tools.</p>
    </div>
  </div>
</div>
```

**Step 2A: Git 导入模式详细交互**:
```
用户点击 "Import from Git"
  ↓
显示 Git 导入表单:
  ├─ GitHub URL 输入框
  │   - 占位符: "https://github.com/owner/repo"
  │   - 支持标准 GitHub URL
  │   - 支持子目录 URL: https://github.com/owner/repo/tree/branch/subdir
  │   - 实时验证 URL 格式
  │
  └─ "Import" 按钮 (禁用状态，直到 URL 有效)
  ↓
用户输入 GitHub URL
  ↓
点击 "Import" 按钮
  ↓
验证 URL 格式
  ├─ 无效 URL → 显示红色错误消息
  │   - "Invalid GitHub URL format"
  │
  └─ 有效 URL → 开始导入流程
      ↓
      调用: invoke("install_skill_from_url", { repoUrl })
      ↓
      显示 Loading 状态:
        ├─ 按钮旋转动画
        ├─ 进度消息: "Cloning repository..."
        └─ 进度消息: "Extracting skill..."
      ↓
      监听 "import-progress" 事件:
        ├─ progress: "Cloning..."
        ├─ progress: "Extracting..."
        └─ progress: "Done!"
      ↓
      成功 → 显示绿色成功消息 → 关闭对话框 → 刷新列表
      失败 → 显示红色错误消息 → 保持对话框打开 → 用户可重试
```

**Git 导入表单**:
```typescript
// Step 2A UI
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium mb-2">GitHub URL</label>
    <div className="relative">
      <input
        type="text"
        value={gitUrl}
        onChange={(e) => setGitUrl(e.target.value)}
        placeholder="https://github.com/owner/repo"
        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <GitBranch className="absolute right-3 top-3 h-5 w-5 text-zinc-400" />
    </div>
    <p className="text-xs text-zinc-500 mt-2">
      Supports: https://github.com/owner/repo or https://github.com/owner/repo/tree/branch/subdir
    </p>
  </div>
  
  <Button 
    onClick={handleGitImport}
    disabled={!isValidGitUrl(gitUrl) || importing}
    className="w-full"
  >
    {importing ? (
      <>
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Importing...
      </>
    ) : (
      <>
        <CloudDownload className="mr-2 h-4 w-4" />
        Import to Hub
      </>
    )}
  </Button>
  
  {/* 进度消息 */}
  {importProgress && (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${importProgress.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
      {importProgress.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
      <span className="text-sm">{importProgress.message}</span>
    </div>
  )}
</div>
```

**Git 导入数据流**:
```typescript
// 前端状态
const [gitUrl, setGitUrl] = useState("");
const [importing, setImporting] = useState(false);
const [importProgress, setImportProgress] = useState<{type: 'info' | 'error', message: string} | null>(null);

// URL 验证
const isValidGitUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("github.com");
  } catch {
    return false;
  }
};

// Git 导入处理
const handleGitImport = async () => {
  if (!isValidGitUrl(gitUrl)) {
    setImportProgress({ type: 'error', message: 'Invalid GitHub URL format' });
    return;
  }
  
  setImporting(true);
  setImportProgress(null);
  
  try {
    // 监听进度事件
    const unlisten = await listen("import-progress", (event) => {
      setImportProgress({ type: 'info', message: event.payload });
    });
    
    // 调用 Rust 命令
    await invoke("install_skill_from_url", { repoUrl: gitUrl });
    
    // 成功
    setImportProgress({ type: 'info', message: 'Success! Skill imported to Hub.' });
    setTimeout(() => {
      onClose();
      onImportComplete();
    }, 1500);
    
    unlisten();
  } catch (err) {
    setImportProgress({ type: 'error', message: `Failed: ${err}` });
  } finally {
    setImporting(false);
  }
};
```

**Step 2B: 扫描模式详细交互**:
```
用户点击 "Scan Local Projects"
  ↓
显示扫描界面:
  ├─ "Scan" 按钮 (主色)
  └─ 扫描结果区域 (初始为空)
  ↓
用户点击 "Scan" 按钮
  ↓
调用: invoke("scan_external_skills")
  ↓
显示 Loading 状态:
  ├─ 按钮旋转动画
  ├─ 进度消息: "Scanning tools..."
  └─ 进度消息: "Computing fingerprints..."
  ↓
扫描完成 → 显示结果:
  ├─ 统计信息:
  │   ├─ [Badge: "X New" (绿色)]
  │   └─ [Badge: "Y Duplicates" (黄色)]
  │
  ├─ 技能列表:
  │   ├─ Skill Name [Original Tool Badge]
  │   ├─ Path (截断显示)
  │   └─ Checkbox (默认选中非重复项)
  │
  └─ 策略选择 Tabs:
      ├─ Copy (默认)
      └─ Move
  ↓
用户可以:
  ├─ 勾选/取消勾选技能
  ├─ 切换策略 (Copy/Move)
  └─ 点击 "Import Selected" 按钮
  ↓
点击 "Import Selected"
  ↓
调用: invoke("import_skills", { skills, strategy })
  ↓
显示 Loading 状态
  ↓
导入完成 → 显示成功消息 → 关闭对话框 → 刷新列表
```

**扫描模式 UI**:
```typescript
// Step 2B UI
<div className="space-y-4">
  <Button 
    onClick={handleScan}
    disabled={scanning}
    className="w-full"
  >
    {scanning ? (
      <>
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Scanning...
      </>
    ) : (
      <>
        <FolderSearch className="mr-2 h-4 w-4" />
        Scan Local Projects
      </>
    )}
  </Button>
  
  {/* 统计信息 */}
  {discoveredSkills.length > 0 && (
    <div className="flex gap-2">
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        {discoveredSkills.filter(s => !s.is_duplicate).length} New
      </Badge>
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        {discoveredSkills.filter(s => s.is_duplicate).length} Duplicates
      </Badge>
    </div>
  )}
  
  {/* 技能列表 */}
  {discoveredSkills.length > 0 && (
    <div className="max-h-[300px] overflow-y-auto space-y-2">
      {discoveredSkills.map((skill) => (
        <div 
          key={skill.path}
          className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <Checkbox
            checked={selectedSkills.includes(skill.path)}
            onCheckedChange={(checked) => {
              setSelectedSkills(prev => 
                checked 
                  ? [...prev, skill.path]
                  : prev.filter(p => p !== skill.path)
              );
            }}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{skill.name}</span>
              <Badge variant="outline" className="text-xs">
                {skill.original_tool}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 truncate">
              {skill.path}
            </p>
          </div>
          
          {skill.is_duplicate && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" title="Duplicate" />
          )}
        </div>
      ))}
    </div>
  )}
  
  {/* 策略选择 */}
  {discoveredSkills.length > 0 && (
    <div className="flex gap-2">
      <Button 
        variant={importStrategy === "copy" ? "default" : "outline"}
        onClick={() => setImportStrategy("copy")}
        className="flex-1"
      >
        Copy to Hub
      </Button>
      <Button 
        variant={importStrategy === "move" ? "default" : "outline"}
        onClick={() => setImportStrategy("move")}
        className="flex-1"
      >
        Move to Hub
      </Button>
    </div>
  )}
  
  {/* 导入按钮 */}
  {discoveredSkills.length > 0 && (
    <Button 
      onClick={handleImportSelected}
      disabled={selectedSkills.length === 0 || importing}
      className="w-full"
    >
      Import Selected ({selectedSkills.length})
    </Button>
  )}
</div>
```

**扫描模式数据流**:
```typescript
// 前端状态
const [scanning, setScanning] = useState(false);
const [discoveredSkills, setDiscoveredSkills] = useState<DiscoveredSkill[]>([]);
const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
const [importStrategy, setImportStrategy] = useState<"copy" | "move">("copy");

// 扫描处理
const handleScan = async () => {
  setScanning(true);
  
  try {
    const skills = await invoke("scan_external_skills");
    
    // 过滤非重复项 (默认选中)
    const newSkills = skills.filter(s => !s.is_duplicate);
    setSelectedSkills(newSkills.map(s => s.path));
    
    setDiscoveredSkills(skills);
  } catch (err) {
    alert(`❌ Scan failed: ${err}`);
  } finally {
    setScanning(false);
  }
};

// 导入处理
const handleImportSelected = async () => {
  if (selectedSkills.length === 0) {
    alert("Please select at least one skill to import.");
    return;
  }
  
  setImporting(true);
  
  try {
    const skillsToImport = discoveredSkills.filter(s => 
      selectedSkills.includes(s.path)
    );
    
    await invoke("import_skills", {
      skills: skillsToImport,
      strategy: importStrategy
    });
    
    alert("✅ Skills imported successfully!");
    onClose();
    onImportComplete();
  } catch (err) {
    alert(`❌ Import failed: ${err}`);
  } finally {
    setImporting(false);
  }
};
```

**扫描结果数据结构**:
```typescript
interface DiscoveredSkill {
  name: string;           // 技能名称
  path: string;           // 绝对路径
  original_tool: string;  // 原始工具 (cursor, claude_code, etc.)
  fingerprint: string;    // SHA256 hash (用于检测重复)
  is_duplicate: boolean;  // 是否为重复项 (与 Hub 比较)
}
```

**Rust 后端处理** (lines 1-120 in `importer.rs`):
```rust
// 扫描外部技能
pub fn scan_external_skills() -> Result<Vec<DiscoveredSkill>, String> {
    let mut skills = Vec::new();
    let hub_skills = get_hub_skills()?;  // 获取 Hub 技能
    
    // 扫描所有工具的技能目录
    for tool in get_installed_tools()? {
        if let Ok(tool_skills) = get_tool_skills(&tool.key) {
            for skill in tool_skills {
                // 计算指纹
                let fingerprint = compute_fingerprint(&skill.path)?;
                
                // 检测重复
                let is_duplicate = hub_skills.iter()
                    .any(|h| h.fingerprint == fingerprint);
                
                skills.push(DiscoveredSkill {
                    name: skill.name,
                    path: skill.path,
                    original_tool: tool.key,
                    fingerprint,
                    is_duplicate,
                });
            }
        }
    }
    
    Ok(skills)
}

// 导入技能
pub fn import_skills(
    skills: Vec<DiscoveredSkill>,
    strategy: String,
) -> Result<(), String> {
    let strategy = match strategy.as_str() {
        "move" => ImportStrategy::Move,
        _ => ImportStrategy::Copy,
    };
    
    for skill in skills {
        let src = PathBuf::from(&skill.path);
        let dest = get_hub_dir()?.join(skill.name);
        
        match strategy {
            ImportStrategy::Copy => {
                copy_dir_all(&src, &dest)?;
            }
            ImportStrategy::Move => {
                rename(&src, &dest)?;
            }
        }
    }
    
    Ok(())
}
```

**Step 3: 完成**
```
导入成功后:
  ├─ 显示成功消息 (1.5 秒)
  │   - "✅ Skills imported successfully!"
  │
  ├─ 关闭对话框
  │
  └─ 触发回调:
      ├─ onClose() → 关闭对话框
      └─ onImportComplete() → 刷新技能列表
```

**完整数据流**:
```typescript
// 导入完成回调
const handleImportComplete = () => {
  // 1. 关闭对话框
  onClose();
  
  // 2. 刷新技能列表
  refreshSkills();
  
  // 3. 可选: 显示刷新提示
  alert("✅ Skills imported. Refreshing skill list...");
};

// 对话框关闭处理
const handleClose = () => {
  // 确认关闭 (如果正在导入)
  if (importing) {
    if (confirm("Import is in progress. Are you sure you want to cancel?")) {
      onClose();
    }
  } else {
    onClose();
  }
};
```

**边界条件**:
```typescript
// 1. 扫描无结果
if (discoveredSkills.length === 0) {
  alert("No external skills found. All skills are already in Hub.");
  return;
}

// 2. 无选中技能
if (selectedSkills.length === 0) {
  alert("Please select at least one skill to import.");
  return;
}

// 3. 导入失败 (部分成功)
if (importedCount > 0 && failedCount > 0) {
  alert(`✅ Imported ${importedCount} skill(s).\n❌ Failed to import ${failedCount} skill(s).`);
}

// 4. 网络超时 (Git 导入)
if (importProgress.includes("timeout")) {
  alert("❌ Git clone timeout. Please check your network connection.");
}

// 5. 权限不足
if (importProgress.includes("permission")) {
  alert("❌ Permission denied. Please check your file system permissions.");
}
```

**错误处理**:
```typescript
// Git 导入错误
catch (err) {
  if (err.includes("not a git repository")) {
    alert("❌ Invalid Git repository. Please check the URL.");
  } else if (err.includes("timeout")) {
    alert("❌ Git clone timeout. Please check your network connection.");
  } else if (err.includes("permission")) {
    alert("❌ Permission denied. Please check your file system permissions.");
  } else {
    alert(`❌ Git clone failed: ${err}`);
  }
}

// 扫描导入错误
catch (err) {
  if (err.includes("ENOENT")) {
    alert("❌ Skill directory not found. It may have been moved or deleted.");
  } else if (err.includes("EACCES")) {
    alert("❌ Permission denied. Please check your file system permissions.");
  } else {
    alert(`❌ Import failed: ${err}`);
  }
}
```

---

### 3.8 技能配置对话框

#### 3.8.1 触发方式
- **SkillCard**: 点击配置图标 `⚙`

#### 3.8.2 组件
**组件**: `SkillConfigDialog.tsx` (lines 1-246)

**完整交互流程**:
```
用户点击技能卡片的配置图标 `⚙`
  ↓
打开配置对话框 (模态窗口, 500px 宽)
  ↓
调用: invoke("get_skill_config", { skillName, skillPath })
  ↓
加载配置:
  ├─ 优先加载用户自定义配置
  │   - 从 `~/.xskill/skills_config.json` 读取
  │
  └─ 如果无用户配置，使用自动检测配置
      - Node 项目: 检测 `package.json` → `index.js`
      - Python 项目: 检测 `pyproject.toml` → `main.py`
  ↓
populate 表单字段:
  ├─ Command: "node" (或用户自定义值)
  ├─ Arguments: ["index.js"] (或用户自定义值)
  └─ Environment Variables: {} (或用户自定义值)
  ↓
用户可以:
  ├─ 修改 Command (必填)
  ├─ 添加/删除 Arguments (动态列表)
  └─ 添加/删除 Environment Variables (动态列表)
  ↓
点击 "Save Configuration" 按钮
  ↓
构建 config 对象:
  {
    command: command.trim() || null,
    args: args.length > 0 ? args : null,
    env: envMap
  }
  ↓
调用: invoke("save_skill_config", { skillName, skillPath, config })
  ↓
Rust 后端处理:
  ├─ 验证配置
  ├─ 保存到 `~/.xskill/skills_config.json`
  └─ 返回成功
  ↓
成功 → 关闭对话框 → 配置立即生效
失败 → 显示错误消息 → 保持对话框打开
```

**对话框属性**:
- 标题: "Configure Skill"
- 大小: 中等 (500px 宽)
- 位置: 屏幕中心
- 关闭方式: 
  - 点击遮罩层
  - 按 ESC 键
  - 点击右上角 X 按钮
- 状态管理: `open`, `isLoading`, `config`

**表单字段详细交互**:

1. **Command (必填)**:
   ```
   用户输入 Command
     ↓
   实时验证:
     ├─ 非空验证
     ├─ 格式验证 (不允许特殊字符)
     └─ 自动补全建议 (可选)
     ↓
   显示验证状态:
     ├─ ✓ (绿色) - 有效
     └─ ✗ (红色) - 无效
   ```

2. **Arguments (可选)**:
   ```
   用户点击 "Add Arg" 按钮
     ↓
   添加新参数输入框
     ↓
   用户输入参数值
     ↓
   用户可以点击 Delete 按钮删除参数
     ↓
   显示参数列表 (动态增删)
   ```

3. **Environment Variables (可选)**:
   ```
   用户点击 "Add Env" 按钮
     ↓
   添加新环境变量行:
     ├─ KEY 输入框
     └─ VALUE 密码框 (type="password")
     ↓
   用户可以点击 Delete 按钮删除环境变量
     ↓
   显示环境变量列表 (动态增删)
   ```

**配置对话框 UI**:
```typescript
<div className="space-y-4">
  {/* Command */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Command <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="e.g. node, python3, npx"
        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <Terminal className="absolute right-3 top-3 h-5 w-5 text-zinc-400" />
    </div>
    <p className="text-xs text-zinc-500 mt-2">
      The binary to run. For local scripts, use absolute paths.
    </p>
    {errors.command && (
      <p className="text-xs text-red-500 mt-1">{errors.command}</p>
    )}
  </div>
  
  {/* Arguments */}
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium">Arguments</label>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setArgs([...args, ""])}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add Arg
      </Button>
    </div>
    <div className="space-y-2">
      {args.map((arg, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={arg}
            onChange={(e) => {
              const newArgs = [...args];
              newArgs[index] = e.target.value;
              setArgs(newArgs);
            }}
            placeholder="Argument"
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newArgs = args.filter((_, i) => i !== index);
              setArgs(newArgs);
            }}
            className="h-10 w-10 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  </div>
  
  {/* Environment Variables */}
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium">Environment Variables</label>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setEnv([...env, { key: "", value: "" }])}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add Env
      </Button>
    </div>
    <div className="space-y-2">
      {env.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={item.key}
            onChange={(e) => {
              const newEnv = [...env];
              newEnv[index].key = e.target.value;
              setEnv(newEnv);
            }}
            placeholder="KEY"
            className="w-1/3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
          <input
            type="password"
            value={item.value}
            onChange={(e) => {
              const newEnv = [...env];
              newEnv[index].value = e.target.value;
              setEnv(newEnv);
            }}
            placeholder="VALUE"
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newEnv = env.filter((_, i) => i !== index);
              setEnv(newEnv);
            }}
            className="h-10 w-10 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
    <p className="text-xs text-zinc-500 mt-2">
      Environment variables for the skill. Values are masked for security.
    </p>
  </div>
  
  {/* Save Button */}
  <Button 
    onClick={handleSave}
    disabled={isLoading || !command.trim()}
    className="w-full"
  >
    {isLoading ? (
      <>
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Saving...
      </>
    ) : (
      <>
        <Save className="mr-2 h-4 w-4" />
        Save Configuration
      </>
    )}
  </Button>
</div>
```

**数据流**:
```typescript
// 前端状态
const [command, setCommand] = useState("");
const [args, setArgs] = useState<string[]>([]);
const [env, setEnv] = useState<{key: string, value: string}[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// 打开对话框时加载配置
const handleOpen = async () => {
  try {
    const config = await invoke("get_skill_config", {
      skillName: skill.name,
      skillPath: skill.path
    });
    
    setCommand(config.command || "");
    setArgs(config.args || []);
    setEnv(config.env ? Object.entries(config.env).map(([k, v]) => ({ key: k, value: v })) : []);
  } catch (err) {
    alert(`❌ Failed to load config: ${err}`);
  }
};

// 保存配置
const handleSave = async () => {
  // 1. 验证表单
  const newErrors: Record<string, string> = {};
  
  if (!command.trim()) {
    newErrors.command = "Command is required";
  }
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  // 2. 构建 config 对象
  const config = {
    command: command.trim() || null,
    args: args.length > 0 ? args : null,
    env: env.length > 0 
      ? Object.fromEntries(env.map(e => [e.key, e.value]))
      : null
  };
  
  // 3. 设置加载状态
  setIsLoading(true);
  
  try {
    // 4. 调用 Rust 命令
    await invoke("save_skill_config", {
      skillName: skill.name,
      skillPath: skill.path,
      config
    });
    
    // 5. 成功处理
    alert("✅ Configuration saved successfully!");
    onClose();
  } catch (err) {
    // 6. 错误处理
    alert(`❌ Failed to save configuration: ${err}`);
  } finally {
    setIsLoading(false);
  }
};
```

**Rust 后端处理** (lines 1-153 in `config_manager.rs`):
```rust
// 获取技能配置
pub fn get_skill_config(
    skill_name: String,
    skill_path: Option<String>,
) -> Result<SkillConfig, String> {
    // 1. 从存储读取用户配置
    let storage = get_storage()?;
    let config_key = format!("skill_config_{}", skill_name);
    
    if let Some(user_config) = storage.get(config_key) {
        return Ok(user_config);
    }
    
    // 2. 如果无用户配置，使用自动检测
    if let Some(path) = skill_path {
        return Ok(auto_detect_config(&path)?);
    }
    
    // 3. 返回默认配置
    Ok(SkillConfig {
        command: None,
        args: None,
        env: None,
    })
}

// 保存技能配置
pub fn save_skill_config(
    skill_name: String,
    skill_path: String,
    config: SkillConfig,
) -> Result<(), String> {
    // 1. 验证配置
    if config.command.is_none() && config.args.is_none() && config.env.is_none() {
        return Err("At least one config field must be provided");
    }
    
    // 2. 保存到存储
    let storage = get_storage()?;
    let config_key = format!("skill_config_{}", skill_name);
    
    storage.set(config_key, &config)?;
    
    Ok(())
}

// 自动检测配置
fn auto_detect_config(skill_path: &Path) -> Result<SkillConfig, String> {
    // 1. 检测 Node 项目
    let package_json = skill_path.join("package.json");
    if package_json.exists() {
        let content = fs::read_to_string(&package_json)?;
        let json: serde_json::Value = serde_json::from_str(&content)?;
        
        // 检测 main 字段
        if let Some(main) = json.get("main").and_then(|v| v.as_str()) {
            let entry_point = skill_path.join(main);
            if entry_point.exists() {
                return Ok(SkillConfig {
                    command: Some("node".to_string()),
                    args: Some(vec![main.to_string()]),
                    env: None,
                });
            }
        }
        
        // 检测 index.js
        let index_js = skill_path.join("index.js");
        if index_js.exists() {
            return Ok(SkillConfig {
                command: Some("node".to_string()),
                args: Some(vec!["index.js".to_string()]),
                env: None,
            });
        }
    }
    
    // 2. 检测 Python 项目
    let pyproject_toml = skill_path.join("pyproject.toml");
    if pyproject_toml.exists() {
        let content = fs::read_to_string(&pyproject_toml)?;
        
        // 检测 main.py
        let main_py = skill_path.join("main.py");
        if main_py.exists() {
            return Ok(SkillConfig {
                command: Some("python3".to_string()),
                args: Some(vec!["main.py".to_string()]),
                env: None,
            });
        }
    }
    
    // 3. 返回默认配置
    Ok(SkillConfig {
        command: None,
        args: None,
        env: None,
    })
}
```

**存储位置**:
```
~/.xskill/skills_config.json
  ↓
{
  "skill_config_github": {
    "command": "node",
    "args": ["index.js"],
    "env": {
      "GITHUB_TOKEN": "xxx"
    }
  },
  "skill_config_filesystem": {
    "command": "python3",
    "args": ["main.py"],
    "env": null
  }
}
```

**边界条件**:
```typescript
// 1. Command 为空
if (!command.trim()) {
  setErrors({ command: "Command is required" });
  return;
}

// 2. 无任何配置
if (!command.trim() && args.length === 0 && env.length === 0) {
  alert("Please provide at least one configuration value.");
  return;
}

// 3. 环境变量名重复
const envKeys = env.map(e => e.key);
if (new Set(envKeys).size !== envKeys.length) {
  alert("Environment variable names must be unique.");
  return;
}

// 4. 环境变量名包含特殊字符
const invalidKey = env.find(e => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(e.key));
if (invalidKey) {
  alert(`Invalid environment variable name: ${invalidKey.key}`);
  return;
}
```

**错误处理**:
```typescript
// 保存配置错误
catch (err) {
  if (err.includes("permission")) {
    alert("❌ Permission denied. Please check your file system permissions.");
  } else if (err.includes("invalid")) {
    alert(`❌ Invalid configuration: ${err}`);
  } else {
    alert(`❌ Failed to save configuration: ${err}`);
  }
}

// 加载配置错误
catch (err) {
  if (err.includes("not found")) {
    // 使用默认配置
    setCommand("");
    setArgs([]);
    setEnv([]);
  } else {
    alert(`❌ Failed to load configuration: ${err}`);
  }
}
```

---

### 3.9 应用套件对话框

#### 3.9.1 触发方式
- **Projects 页面**: 点击项目卡片的 "Suite" 按钮

#### 3.9.2 组件
**组件**: `ApplySuiteDialog.tsx` (lines 1-139)

**表单字段**:

1. **目标工具**
   - 下拉选择
   - 所有已安装的工具
   - 默认: "cursor"

2. **套件列表**
   - 每个套件显示:
     - 名称
     - 描述
     - 技能数量 Badge
     - "Apply Suite" 按钮

**应用流程** (lines 20-48):
```typescript
1. 选择套件
2. invoke("apply_suite", {
     projectPath, suite, agent
   })
3. 成功: 显示绿色提示，1.5秒后关闭
4. 失败: 显示错误消息
```

**Rust 后端** (lines 1-78 in `suite_applier.rs`):
1. 写入 `AGENTS.md` (如果 `policy_rules` 非空)
2. 同步技能到目标工具的项目目录
3. 路径: `<project_path>/.cursor/skills/`

---

### 3.10 应用技能对话框

#### 3.10.1 触发方式
- **Projects 页面**: 点击项目卡片的 "Add" 按钮

#### 3.10.2 组件
**组件**: `ApplySkillsDialog.tsx` (lines 1-184)

**功能**:
1. **搜索技能**
   - 从 Hub 技能中过滤
   - 按名称和描述搜索

2. **选择技能**
   - 复选框列表
   - 显示名称 + 描述

3. **应用**
   - 构建临时套件
   - 调用 `apply_suite` 命令

**与 ApplySuiteDialog 的区别**:
- ApplySuiteDialog: 选择预定义套件
- ApplySkillsDialog: 手动选择技能

---

### 3.11 管理项目技能对话框

#### 3.11.1 触发方式
- **Projects 页面**: 点击项目卡片的 "Manage" 按钮

#### 3.11.2 组件
**组件**: `ManageProjectSkillsDialog.tsx` (lines 1-168)

**功能**:
1. **扫描项目技能**
   - 调用: `invoke("get_project_skills", { projectPath })`
   - 扫描项目目录下的所有技能

2. **分组显示**
   - 按 `tool_key` 分组
   - 显示工具名称标题

3. **操作按钮**:
   - **Import to Hub**: 调用 `skill_collect_to_hub`
   - **Delete**: 调用 `delete_skill`

**数据流**:
```
Project Skills
  ↓
invoke("get_project_skills")
  ↓
Group by tool_key
  ↓
Display with actions
```

---

## 4. Rust 后端 API

### 4.1 技能管理

#### 4.1.1 `get_installed_tools`
**返回**: `Tool[]`
```typescript
interface Tool {
  key: string;
  display_name: string;
  skills_dir: string;
  installed: boolean;
}
```

**支持的工具** (19 个):
- cursor
- claude_code
- opencode
- windsurf
- trae
- gemini_cli
- antigravity
- github_copilot
- amp
- goose
- codex
- kode
- roo_code
- kilo_code
- clawdbot
- droid
- qoder

#### 4.1.2 `get_all_local_skills`
**返回**: `LocalSkill[]`
```typescript
interface LocalSkill {
  name: string;
  description: string;
  path: string;
  tool_key: string;
  disable_model_invocation: boolean;
  allowed_tools: string[];
  content: string;
}
```

**扫描范围**:
1. Hub: `~/.xskill/skills/`
2. 所有工具的技能目录

**去重逻辑**: 按路径去重

#### 4.1.3 `get_project_skills`
**参数**: `{ projectPath: string }`
**返回**: `LocalSkill[]`

**扫描路径**:
- `<project>/.cursor/skills/`
- `<project>/.claude/skills/`
- ... (所有工具)

#### 4.1.4 `delete_skill`
**参数**: `{ path: string }`
**功能**: 删除技能目录

#### 4.1.5 `create_skill`
**参数**:
```typescript
{
  name: string;
  description: string;
  toolKey: string;
  content: string;
  negativeTriggers?: string;
  allowedTools?: string[];
  collectToHub?: boolean;
}
```

**创建结构**:
```
skill-name/
├── SKILL.md          (自动生成)
├── scripts/
│   └── README.md
├── references/
│   └── README.md
└── assets/
    └── README.md
```

**SKILL.md 模板** (lines 19-86 in `scaffold.rs`):
```markdown
---
name: {name}
description: {description}
allowed-tools: [{allowed_tools}]
---

## Overview
{content}

## When to Use
- Use this skill when the user wants to {content}

## When NOT to Use
{negative_triggers}

## Procedures

### Step 1: Understand the Request
Analyze the user's request and determine the specific requirements.

### Step 2: Execute the Task
Execute the task following the established procedures.

### Step 3: Verify the Result
Verify the output meets the requirements and provide feedback.

## Error Handling

If errors occur, provide clear feedback to the user and suggest fixes.

## References

See the following files for detailed information:
- `references/` - Additional documentation
- `assets/` - Templates and examples
```

---

### 4.2 IDE 同步

#### 4.2.1 `sync_skill`
**参数**:
```typescript
{
  skillDir: string;
  targetToolKeys: string[];
  mode?: "copy" | "link";
}
```

**返回**: `string[]` (成功写入的路径)

**功能**:
1. 解析技能名称 (目录名)
2. 遍历目标工具
3. 创建目标路径
4. 执行 copy 或 symlink
5. 更新 Claude Desktop 配置 (如果适用)

**支持的工具** (21 个):
- cursor, claude_code, opencode, windsurf, gemini_cli, github_copilot, amp, goose, antigravity, augment, codex, kimi_cli, openclaw, cline, codebuddy, continue_dev, crush, junie, kode, roo_code, kilo_code

#### 4.2.2 `skill_collect_to_hub`
**参数**: `{ skillDir: string }`
**返回**: `string` (Hub 中的路径)

**功能**:
1. 复制技能到 `~/.xskill/skills/{skill_name}`
2. 如果已存在，覆盖

---

### 4.3 Git 操作

#### 4.3.1 `install_skill_from_url`
**参数**: `{ repoUrl: string }`
**返回**: `string` (安装路径)

**流程**:
1. 解析 URL (支持 GitHub 子目录)
2. 克隆到 `~/.xskill/skills/{repo_name}`
3. 支持 sparse-checkout (子目录)

**子目录 URL 支持**:
```
https://github.com/owner/repo/tree/branch/sub/path
  ↓
克隆 repo → sparse-checkout sub/path → 移动到目标
```

#### 4.3.2 `clone_skill`
**参数**: `{ repoUrl: string, targetDir: string }`
**返回**: `void`

**功能**: 克隆仓库到指定目录

#### 4.3.3 `update_skill`
**参数**: `{ skillDir: string }`
**返回**: `void`

**功能**: `git pull --ff-only`

---

### 4.4 套件管理

#### 4.4.1 `load_suites`
**返回**: `Suite[]`
```typescript
interface Suite {
  id: string;
  name: string;
  description: string;
  policy_rules: string;      // AGENTS.md 内容
  loadout_skills: string[];  // 技能 ID 列表
}
```

#### 4.4.2 `save_suites`
**参数**: `{ suites: Suite[] }`
**返回**: `void`

**存储位置**: `~/.xskill/suites.json`

#### 4.4.3 `apply_suite`
**参数**:
```typescript
{
  projectPath: string;
  suite: Suite;
  agent?: string;
}
```

**功能**:
1. 写入 `AGENTS.md` (如果 `policy_rules` 非空)
2. 同步技能到项目目录
3. 路径: `<project>/.{agent}/skills/`

---

### 4.5 扫描与发现

#### 4.5.1 `scan_workspace`
**参数**: `{ extraRoots?: string[] }`
**返回**: `Project[]`
```typescript
interface Project {
  path: string;
  name: string;
  has_git: boolean;
  has_mcp: boolean;
  has_agents_md: boolean;
}
```

**扫描规则** (lines 1-158 in `scanner.rs`):
- 最大深度: 5
- 忽略: node_modules, .git, dist, build, out, .next, target
- 项目识别: `.git` 目录
- MCP 标识: `mcp.json` 或 `package.json` 包含 "mcp"
- AGENTS 标识: `AGENTS.md`

#### 4.5.2 `scan_external_skills`
**返回**: `DiscoveredSkill[]`
```typescript
interface DiscoveredSkill {
  name: string;
  path: string;
  original_tool: string;
  fingerprint: string;
  is_duplicate: boolean;
}
```

**流程**:
1. 扫描所有工具的技能目录
2. 计算指纹 (SHA256)
3. 与 Hub 比较
4. 标记重复项

#### 4.5.3 `import_skills`
**参数**: `{ skills: DiscoveredSkill[], strategy: "copy" | "move" }`
**返回**: `void`

**功能**:
1. 复制/移动技能到 Hub
2. 处理命名冲突 (添加 `_1`, `_2` 后缀)

---

### 4.6 配置管理

#### 4.6.1 `get_skill_config`
**参数**: `{ skillName: string, skillPath?: string }`
**返回**: `SkillConfig`
```typescript
interface SkillConfig {
  command: string | null;
  args: string[] | null;
  env: Record<string, string> | null;
}
```

**自动检测** (lines 42-89 in `config_manager.rs`):
- Node: `package.json` → `index.js` / `build/index.js` / `dist/index.js` / `src/index.ts`
- Python: `pyproject.toml` / `requirements.txt` → `main.py` / `server.py`

#### 4.6.2 `save_skill_config`
**参数**: `{ skillName: string, config: SkillConfig }`
**返回**: `void`

**存储位置**: `~/.xskill/skills_config.json`

---

### 4.7 GitHub 集成

#### 4.7.1 `fetch_github_file`
**参数**: `{ url: string }`
**返回**: `string` (文件内容)

**功能**:
1. 转换 URL (github.com → raw.githubusercontent.com)
2. 获取文件内容
3. 超时: 10 秒

---

### 4.8 存储管理

#### 4.8.1 `load_skills`
**返回**: `Skill[]`
```typescript
interface Skill {
  id: string;
  name: string;
  desc: string;
  skill_type: string;
  status: string;
  path?: string;
  repo_url?: string;
}
```

#### 4.8.2 `save_skills`
**参数**: `{ skills: Skill[] }`
**返回**: `void`

#### 4.8.3 `load_feeds`
**返回**: `FeedEntry[]`
```typescript
interface FeedEntry {
  id: string;
  label: string;
  url: string;
}
```

#### 4.8.4 `save_feeds`
**参数**: `{ feeds: FeedEntry[] }`
**返回**: `void`

---

### 4.9 工具函数

#### 4.9.1 `open_folder`
**参数**: `{ path: string }`
**返回**: `void`

**功能**: 用系统文件管理器打开目录

---

## 5. 数据存储结构

### 5.1 本地文件系统

#### 5.1.1 Hub 目录
```
~/.xskill/skills/
├── hub/                    (技能中心仓库)
│   ├── skill-name-1/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   ├── references/
│   │   └── assets/
│   └── skill-name-2/
└── skills/                 (兼容旧版本)
    └── ...
```

#### 5.1.2 Agent 目录
```
~/.cursor/skills/           (Cursor)
~/.claude/skills/           (Claude)
~/.config/opencode/skills/  (OpenCode)
~/.codeium/windsurf/skills/ (Windsurf)
... (其他工具)
```

#### 5.1.3 项目目录
```
<project>/
├── .cursor/skills/         (项目级技能)
├── .claude/skills/
├── .config/opencode/skills/
└── AGENTS.md               (项目策略)
```

#### 5.1.4 配置文件
```
~/.xskill/
├── skills_config.json      (技能配置)
├── suites.json             (套件定义)
└── xskill.json             (Tauri Store)
    ├── skills              (Marketplace 缓存)
    └── feeds               (订阅源)
```

---

### 5.2 市场数据

#### 5.2.1 本地缓存
```
localStorage: marketplace_cache
  ↓
JSON: MarketplaceSkill[]
```

#### 5.2.2 远程数据源
```
https://raw.githubusercontent.com/buzhangsan/skills-manager-client/master/public/data/marketplace.json
```

#### 5.2.3 数据结构
```typescript
{
  id: string;
  name: string;
  author: string;
  authorAvatar: string;
  description: string;
  githubUrl: string;
  stars: number;
  forks: number;
  updatedAt: number;
  tags?: string[];
}
```

---

## 6. 交互流程图

### 6.1 新建技能流程
```
用户点击 "New Skill"
  ↓
打开 NewSkillDialog
  ↓
填写表单 (name, description, content, ...)
  ↓
验证表单
  ↓
调用 Rust create_skill
  ↓
创建目录结构
  ↓
生成 SKILL.md
  ↓
(可选) 复制到 Hub
  ↓
刷新技能列表
  ↓
关闭对话框
```

### 6.2 导入技能流程
```
用户点击 "Import"
  ↓
选择导入方式
  ├─ Git → 输入 URL → 克隆到 Hub
  └─ Scan → 扫描本地 → 选择技能 → 导入到 Hub
  ↓
刷新技能列表
```

### 6.3 同步技能流程
```
用户点击 "Sync"
  ↓
选择目标工具
  ↓
选择同步模式 (Copy/Link)
  ↓
调用 sync_skill
  ↓
复制/链接到目标目录
  ↓
更新 IDE 配置
  ↓
刷新技能列表
```

### 6.4 应用套件流程
```
Projects 页面点击 "Suite"
  ↓
选择目标工具
  ↓
选择套件
  ↓
调用 apply_suite
  ↓
写入 AGENTS.md
  ↓
同步技能到项目
  ↓
刷新项目列表
```

---

## 7. 错误处理

### 7.1 表单验证
- **名称**: 格式、长度、重复
- **描述**: 必填
- **URL**: 格式、可访问性

### 7.2 网络错误
- 市场数据加载失败 → 显示错误消息
- Git 克隆失败 → 显示错误消息
- GitHub API 超时 → 10 秒超时

### 7.3 文件系统错误
- 目录不存在 → 创建
- 权限不足 → alert 提示
- 路径冲突 → 添加后缀 (_1, _2)

### 7.4 状态管理
- Loading 状态 → 旋转动画
- Error 状态 → 红色提示
- Success 状态 → 绿色勾选

---

## 8. UI/UX 规范

### 8.1 颜色系统
- **Primary**: 主色 (蓝色)
- **Secondary**: 副色 (灰色)
- **Success**: 绿色
- **Destructive**: 红色
- **Warning**: 黄色

### 8.2 组件样式
- **圆角**: `rounded-xl`, `rounded-2xl`, `rounded-3xl`
- **阴影**: `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`
- **边框**: `border-border/50`
- **背景**: `bg-card/40 backdrop-blur-xl`

### 8.3 交互反馈
- **Hover**: `hover:-translate-y-1 hover:scale-[1.01]`
- **Active**: `active:scale-[0.98]`
- **Loading**: `animate-spin`
- **Success**: `text-green-500` + `CheckCircle2`

### 8.4 动画
- **进入**: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
- **退出**: `AnimatePresence mode="popLayout"`
- **过渡**: `type: "spring", stiffness: 300, damping: 24`

---

## 9. 测试用例分类

### 9.1 前端单元测试
- **文件**: `src/**/*.test.tsx`
- **框架**: Vitest + React Testing Library
- **覆盖**: 
  - 组件渲染
  - 交互逻辑
  - 状态管理

### 9.2 后端单元测试
- **文件**: `src-tauri/src/**/*.rs`
- **框架**: Rust Test
- **覆盖**:
  - 业务逻辑
  - 数据处理
  - 错误处理

### 9.3 集成测试
- **文件**: `src-tauri/src/integration_tests.rs`
- **覆盖**:
  - 前后端通信
  - 文件系统操作
  - Git 操作

### 9.4 用户场景测试
- **文件**: `docs/test_cases/04_user_scenario_cases.md`
- **覆盖**:
  - 完整工作流
  - 边界情况
  - 错误恢复

---

## 10. 版本历史

### v0.5.1 (当前)
- 最新版本

### v0.3.0
- 套件功能
- 项目管理
- 市场改进

### v0.2.x
- 基础功能
- IDE 同步
- 技能管理

---

## 11. 附录

### 11.1 支持的 IDE (19 个)
1. Cursor
2. Claude Code
3. OpenCode
4. Windsurf
5. Trae
6. Gemini CLI
7. Antigravity
8. GitHub Copilot
9. Amp
10. Goose
11. Codex
12. Kode
13. Roo Code
14. Kilo Code
15. Clawdbot
16. Droid
17. Qoder
18. Kimi CLI
19. OpenClaw

### 11.2 支持的文件类型
- **技能**: `SKILL.md`, `mcp.json`
- **配置**: `package.json`, `pyproject.toml`
- **策略**: `AGENTS.md`
- **脚本**: `.py`, `.js`, `.ts`, `.sh`

### 11.3 环境变量
- `XSKILL_TEST_HOME`: 测试用主目录

---

## 12. 参考文档

- [Vision and Guide](./01_vision_and_guide.md)
- [Requirements](./02_requirements.md)
- [Architecture](./03_architecture_and_cicd.md)
- [CLI Guide](./CLI.md)
- [Supported Agents](./supported-agents.md)

---

**文档结束**
