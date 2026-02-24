# 经验教训 (Lessons Learned)

本文件用于记录在项目开发过程中踩过的坑，并在之后的开发会话中定期回顾，以防重蹈覆辙。

## 1. Rust 编译器 `edition2024` 与 `time-core` 的依赖冲突

**问题描述**:
在初始化 `xskill` 桌面端项目并执行 `npm run tauri dev` 时，底层依赖 `tauri-plugin-log -> time -> time-core` 导致编译失败。报错信息如下：
> `this version of Cargo is older than the 2024 edition, and only supports 2015, 2018, and 2021 editions.`

这是因为：
1. `tauri.conf.json` 或最初由 `create-vite` 生成的 `src-tauri/Cargo.toml` 中，可能锁定了 `rust-version = "1.77.2"`。
2. 即使我们在外层环境使用了 `rustup update` 将本机的 Rust 升级到了最新的 `1.93.1`，由于这个字段的存在，Cargo 依然使用老版本逻辑。
3. `time-core v0.1.8` 在最近发布时启用了只有在最新版 Rust 才正式支持的 `edition = "2024"` 新标准。

**解决方案**:
1. **删除 `rust-version = "1.77.2"`**：在 `Cargo.toml` 中解除对编译器的版本锁定。
2. **强制降级 `time` 与 `time-core`**：在 `src-tauri` 目录执行 `cargo update -p time --precise 0.3.36`。这样就会拉取支持 `edition=2021` 的 `time-core v0.1.2` 版本，避免引入 `0.1.8`。

**教训**:
不要盲目执行全局 `cargo update`，特别是在大版本或 Edition 更新的交界期（比如目前的 2024 Edition 推广期），很容易把一些激进的底层库拉进来导致不兼容。遇到依赖版本过高的问题，优先考虑使用 `--precise` 降级，而不是一直去升级编译环境。

---

## 2. Cargo.lock 版本 4 与老版本环境的不兼容

**问题描述**:
在解决上述问题时，因为我们在 AI 的最新 Rust (1.93) 环境中执行了 `cargo update`，Cargo 自动将 `Cargo.lock` 文件的顶部标识重写为了 `version = 4`。
结果导致用户在其老旧的本地终端环境执行 `npm run tauri dev` 时报错：
> `lock file version 4 was found, but this version of Cargo does not understand this lock file, perhaps Cargo needs to be updated?`

**解决方案**:
最直接稳定的方法是：由于环境里带有 `RUSTUP_TOOLCHAIN=stable` 的限制，直接删除由较高版本生成的 `Cargo.lock`，然后再由当前可用的工具链重新生成它：
```bash
rm src-tauri/Cargo.lock
cd src-tauri && cargo generate-lockfile
```
这样 Cargo 就会根据当前的 Rust 工具链版本生成兼容格式（例如 version 3）的 lockfile。

**教训**:
当遇到 Cargo lock file version 报错时，不要急着去手动改数字 `version = 3`，因为文件内容结构可能也有差异。正确做法是**直接删除并重新生成** `Cargo.lock`，让当前工具链自己处理。这在跨环境开发、AI 协作开发时是一个非常高频的问题。
