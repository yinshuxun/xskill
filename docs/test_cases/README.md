# XSkill 自动化测试用例大全

为了保证应用在持续迭代中的稳定性、安全性（尤其是防止误删用户本地 Agent 配置数据），以及全链路交互的正确性，我们构建了多维度的测试用例体系。

所有的自动化测试用例被精心划分为以下三个子文档（按照模块及复杂度递增）：

| 测试层级 | 文档说明 | 涉及技术栈 | 用例前缀 |
| :--- | :--- | :--- | :--- |
| **前端组件测试** | 测试 React 视图渲染、Hooks、复杂弹窗的交互与数据绑定 | Vite + React Testing Library | `TC-FE-xxx` |
| **后端单元测试** | 针对纯 Rust 逻辑函数（解析器、算法、探测器）进行无副作用隔离验证 | Cargo Test (#[test]) | `TC-BE-UNIT-xxx` |
| **后端集成测试** | 核心业务闭环测试。使用了 **沙箱架构 (`XSKILL_TEST_HOME`)**，确保所有同步和删除行为都在安全的 Temp 目录中执行，坚决不触碰用户真实数据 | Cargo Test (TempDir) | `TC-BE-INT-xxx` |

## 快速导航
1. [前端测试用例 (React UI) - 01_frontend_cases.md](./01_frontend_cases.md)
2. [后端单元测试用例 (Rust Unit) - 02_backend_unit_cases.md](./02_backend_unit_cases.md)
3. [后端集成测试用例 (Rust Integration) - 03_backend_integration_cases.md](./03_backend_integration_cases.md)

## 如何运行测试

### 执行前端 (React) 测试：
在项目根目录运行：
```bash
npm run test
```
该命令会自动利用 Vitest 和 JSDOM 环境执行所有 `.test.tsx` 和 `.test.ts` 文件。

### 执行后端 (Rust) 测试：
进入 Tauri 核心目录后执行：
```bash
cd src-tauri
cargo test -- --test-threads=1
```
该命令会自动扫描所有带 `#[cfg(test)]` 标记的模块并执行单元测试和基于沙箱环境变量的真实集成闭环测试。

## Case ID 规范建议
在修改代码或者增加新特性时，如果该改动修复了某项测试，建议在对应的函数注释上打上相应的 `// CaseID: TC-XXX-XXX`，方便追溯历史测试需求变更。
