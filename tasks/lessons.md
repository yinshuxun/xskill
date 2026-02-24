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
在解决上述问题时，因为我们在 AI 的最新 Rust (1.93) 环境中执行了 `cargo update` 或 `cargo generate-lockfile`，Cargo 自动将 `Cargo.lock` 文件的顶部标识重写为了 `version = 4`。
结果导致用户在其相对较老的本地终端环境（或被 `RUSTUP_TOOLCHAIN=stable` 限制为旧版本时）执行 `npm run tauri dev` 时报错：
> `lock file version 4 was found, but this version of Cargo does not understand this lock file, perhaps Cargo needs to be updated?`

**解决方案**:
直接修改 `src-tauri/Cargo.lock` 文件头部，将 `version = 4` 降级改回 `version = 3`。因为 `version 3` 的语法完全兼容当前项目所需的大部分常见依赖结构。

**教训**:
AI Agent 环境中的工具链版本（如 Cargo 1.93）与用户实际宿主机的环境常常存在差异。千万不要自作聪明地用 "删除并重新生成 lockfile" 来试图解决——由于 AI 环境的 Cargo 版本太高，重新生成的仍然是 v4 格式，导致用户本地依然报错。**碰到这类问题，直接把 `Cargo.lock` 头部的 4 改成 3 是最稳妥也是最有效的向下兼容方法。**

---

## 3. Edition 2024 带来的底层依赖问题（以 getrandom v0.4 为例）

**问题描述**:
在启动或者更新依赖后，遇到报错：
> `failed to download getrandom v0.4.1`
> `failed to parse the edition key`
> `this version of Cargo is older than the 2024 edition, and only supports 2015, 2018, and 2021 editions.`

**解决方案**:
近期许多库（如 `uuid`、`getrandom`）在升级时改为了只支持 Rust 2024 版本。当你的本地 Cargo 工具链被 `RUSTUP_TOOLCHAIN=stable` 限制或者较旧时，这些库会解析失败。
解决办法是找出引入这些新版库的上游依赖，并强制将其降级到旧版。例如将 `uuid` 降级从而避免拉取 `getrandom v0.4.1`：
```bash
cargo update -p uuid --precise 1.11.0
```
完成降级后，记得还要检查 `Cargo.lock` 是否被高版本的 Cargo 写成了 `version = 4`，必要时手动改回 `version = 3`。

**教训**:
当底层基础库（如 `getrandom`, `time` 等）更新导致 `edition 2024` 解析错误时，**降级引起它的父依赖**是唯一解。你可以通过 `cargo tree -i <被报错的依赖包名>` （例如 `cargo tree -i getrandom@0.4.1`）来找出是哪个包引入了它。

---

## 4. Rust 版本过低导致的依赖构建失败

**问题描述**:
Cargo 报错 `package ... cannot be built because it requires rustc 1.77.2 or newer, while the currently active rustc version is 1.74.0`。
常见报错库：
- `tauri-plugin-store` v2.4.2 (需 1.77.2)
- `toml_datetime` v0.7.5 (需 1.76)

**解决方案**:
1. 在 `Cargo.toml` 中使用 `=` 符号锁定依赖的确切版本，防止 `cargo update` 拉取不兼容的新版本。
   ```toml
   tauri-plugin-store = "=2.0.0"
   ```
2. 对于传递依赖，使用 `cargo update -p <package> --precise <version>` 进行降级。
   ```bash
   cargo update -p toml_datetime --precise 0.6.5
   ```

---

## 5. Rust 工具链版本覆盖与 System Cargo 冲突

**问题描述**:
即使 `rustup --version` 和 `rustc --version` 显示已安装最新版 (如 1.93.1)，`cargo check` 仍然报错称当前 rustc 版本过低 (如 1.74.0)。这通常是因为：
1. 项目目录下存在 `rust-toolchain.toml` 或 `rust-toolchain` 文件，强制指定了旧版本或 toolchain channel。
2. 系统 PATH 中存在旧版本的 `cargo` 二进制文件（非 rustup shim），且优先级高于 `~/.cargo/bin`。

**解决方案**:
1. **检查并删除 `rust-toolchain.toml`**：如果不需要强制锁定旧版本，直接删除该文件，让项目使用系统默认的最新 Stable 工具链。
2. **明确调用路径**：如果 PATH 混乱，直接使用绝对路径调用 cargo，例如 `~/.cargo/bin/cargo check`，确保使用的是 rustup 管理的版本。
3. **清理 PATH**：检查 shell 配置文件，确保 `~/.cargo/bin` 在 PATH 的最前面。

**教训**:
当 `cargo --version` 和 `rustc --version` 不一致，或者报错信息中的 rustc 版本与你预期的不符时，首先怀疑 `rust-toolchain` 配置文件或 PATH 优先级问题。不要只看 `rustup show`，要看实际执行命令的是哪个二进制。

---

## 6. Tauri v2 环境要求与版本对齐

**问题描述**:
1. **NPM 与 Rust 版本不匹配**: `npm run tauri dev` 报错 "Tauri version mismatch"，因为 `package.json` 中的 `@tauri-apps/plugin-*` 版本（如 `^2.6.0`）远高于 `src-tauri/Cargo.toml` 中的 Rust 插件版本（如 `2.0.0`）。Tauri 要求两者主次版本号一致。
2. **Rust 版本过低**: 报错 `package ... cannot be built because it requires rustc 1.77.2 or newer` (如 `wry`, `tauri-runtime`)。Tauri v2 (2.0.0 正式版) 的最低 Rust 版本要求 (MSRV) 是 1.77.2 或更高。如果本地是 1.74.0，无法编译。

**解决方案**:
1. **对齐版本**: 修改 `package.json`，将 `@tauri-apps/plugin-*` 依赖锁定到与 Rust 端一致的版本（如 `~2.0.0`）。同时在 `Cargo.toml` 中使用 `=` 锁定 Rust 依赖（如 `tauri = "=2.0.0"`）。
2. **升级 Rust**: Tauri v2 无法在 Rust 1.74.0 上编译。必须执行 `rustup update` 升级到最新 Stable 版本。降级 Tauri 到 v1 是不现实的（API 差异巨大）。

**教训**:
- 使用 Tauri v2 开发时，务必确保本地 Rust 环境至少为 1.78+。
- 在 `package.json` 中使用 `~` 而不是 `^` 来锁定插件版本，避免自动升级导致与 Rust 端不匹配。
- 遇到 "works in sandbox but not locally" 的情况，首先检查 `rustc --version`。
