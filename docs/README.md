# XSkill 文档中心

> **最后更新**: 2026-02-28  
> **版本**: v0.5.1

欢迎来到 XSkill 项目文档中心！本文档介绍了整个项目的文档结构和使用指南。

## 📁 文档目录结构

```
docs/
├── README.md                    # 本文档 - 文档中心导航
├── requirements/                # 需求文档目录
│   ├── 01_vision_and_guide.md          # 愿景与指南
│   ├── 02_requirements.md              # 产品需求文档
│   ├── 03_architecture_and_cicd.md     # 架构与 CI/CD
│   ├── 04_competitor_analysis.md       # 竞品分析
│   ├── 05_skill_management_redesign.md # 技能管理重设计
│   ├── 06_competitor_analysis_v0.3.0.md # v0.3.0 竞品分析
│   ├── 07_complete_requirements.md     # 完整需求交互文档
│   ├── 08_supported_agents.md          # 支持的 Agent 列表
│   └── requirements_v0.3.md            # v0.3 需求文档
├── test_cases/                  # 测试用例目录
│   ├── README.md                       # 测试用例说明
│   ├── 01_frontend_cases.md            # 前端测试用例
│   ├── 02_backend_unit_cases.md        # 后端单元测试用例
│   ├── 03_backend_integration_cases.md # 后端集成测试用例
│   ├── 04_user_scenario_cases.md       # 用户场景测试用例
│   └── 05_template.md                  # 测试用例模板
└── development/                 # 开发相关文档目录
    └── 01_cli_guide.md                 # CLI 使用指南
```

## 📚 文档分类说明

### 1. 需求文档 (`requirements/`)

存放所有与产品需求相关的文档，包括：

- **愿景与指南**: 项目愿景、核心价值、使用指南
- **产品需求**: 功能需求、非功能需求、用户故事
- **架构设计**: 系统架构、技术选型、数据流
- **竞品分析**: 市场分析、竞品对比、差异化
- **完整需求**: 详细的交互流程、API 文档、UI/UX 规范

**适用人群**: 产品经理、需求分析师、技术负责人

**使用场景**:
- 需求评审
- 产品规划
- 技术方案设计
- 用户验收测试

---

### 2. 测试用例 (`test_cases/`)

存放所有与测试相关的文档和用例，包括：

- **前端测试**: React 组件测试、交互测试、E2E 测试
- **后端单元测试**: Rust 函数测试、算法测试
- **后端集成测试**: 端到端业务流程测试
- **用户场景测试**: 完整用户旅程测试
- **测试模板**: 测试用例编写模板和规范

**适用人群**: 测试工程师、QA、开发工程师

**使用场景**:
- 编写测试用例
- 自动化测试
- 质量保证
- 测试覆盖率分析

---

### 3. 开发文档 (`development/`)

存放开发相关的技术文档，包括：

- **CLI 指南**: 命令行工具使用说明
- **API 文档**: 后端 API 接口文档
- **开发指南**: 开发环境搭建、代码规范
- **部署指南**: 构建和部署流程

**适用人群**: 开发工程师、运维工程师

**使用场景**:
- 开发环境搭建
- API 调试
- 代码审查
- 持续集成

---

## 🎯 文档使用指南

### 对于产品经理
1. 阅读 `requirements/01_vision_and_guide.md` 了解项目愿景
2. 阅读 `requirements/02_requirements.md` 了解产品需求
3. 阅读 `requirements/07_complete_requirements.md` 了解详细功能

### 对于开发工程师
1. 阅读 `requirements/03_architecture_and_cicd.md` 了解系统架构
2. 阅读 `requirements/07_complete_requirements.md` 了解功能需求
3. 阅读 `development/01_cli_guide.md` 了解 CLI 使用
4. 参考 `test_cases/05_template.md` 编写测试用例

### 对于测试工程师
1. 阅读 `test_cases/README.md` 了解测试体系
2. 参考 `test_cases/05_template.md` 编写测试用例
3. 阅读 `requirements/07_complete_requirements.md` 了解功能细节

### 对于技术负责人
1. 阅读 `requirements/01_vision_and_guide.md` 了解项目愿景
2. 阅读 `requirements/03_architecture_and_cicd.md` 了解技术架构
3. 阅读 `requirements/07_complete_requirements.md` 了解完整需求

---

## 📝 文档规范

### 命名规范
- **需求文档**: `01_xxx.md`, `02_xxx.md` (按重要性排序)
- **测试用例**: `01_xxx.md`, `02_xxx.md` (按测试层级排序)
- **开发文档**: `01_xxx.md`, `02_xxx.md` (按重要性排序)

### 版本管理
- 文档版本与项目版本保持一致
- 重大变更时更新版本号
- 旧版本文档保留归档

### 更新流程
1. 修改文档前先创建 Issue
2. 在文档中注明修改人和日期
3. 重要变更需要评审
4. 更新后同步到主分支

---

## 🔗 快速链接

- [项目 README](../README.md) - 项目 overview
- [Vision & Guide](./requirements/01_vision_and_guide.md) - 愿景与指南
- [Complete Requirements](./requirements/07_complete_requirements.md) - 完整需求文档
- [Test Cases Template](./test_cases/05_template.md) - 测试用例模板
- [CLI Guide](./development/01_cli_guide.md) - CLI 使用指南

---

## 📞 联系方式

如有疑问或建议，请：
1. 创建 GitHub Issue
2. 联系技术负责人
3. 参加项目评审会议

---

**最后更新**: 2026-02-28  
**维护者**: XSkill Team
