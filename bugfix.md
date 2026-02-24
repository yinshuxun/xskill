# XSkill v0.3.1 - Bugfixes and Stability Update

This release contains critical bug fixes discovered through the newly implemented automated testing suite (Rust unit tests & React component tests). These updates ensure the safety, stability, and correctness of skill synchronization and project scanning.

## 🐛 Critical Bug Fixes

### 1. **Data Loss Prevention in `ide_sync.rs` (Collect/Sync)**
- **Bug**: If a user attempted to "Collect to Hub" a skill that was already symlinked to the Hub, or synced a skill to a directory that was already the source directory, the application would recursively delete the source directory, resulting in permanent data loss of the skill.
- **Fix**: Implemented canonical path cycle detection (`fs::canonicalize`) to verify `src` and `dst` are not identical before performing any recursive deletion or copying. If they match, the operation safely skips.

### 2. **Claude Desktop Integration Path Resolution**
- **Bug**: When syncing a skill to Claude Desktop (`claude_code` / `claude_desktop`), the `claude_desktop_config.json` was incorrectly hardcoding the execution path to the Central Hub (`~/.xskill/skills/`) instead of the newly synced directory (`~/.claude/skills/`). Furthermore, project-local skills (not in the hub) would fail to configure entirely.
- **Fix**: Updated `config_manager::get_skill_config` to dynamically accept and prioritize the `skill_path` of the *destination* directory instead of unconditionally relying on `detect_default_config` to search the Hub. Claude Desktop now correctly points to the active synced files.

### 3. **Infinite Hangs on Remote Fetches (`github.rs` & `feed_parser.rs`)**
- **Bug**: HTTP requests fetching GitHub repositories or JSON marketplace feeds using `reqwest` lacked timeouts, meaning poor network connections could cause the Tauri backend thread to hang indefinitely.
- **Fix**: Added explicit 10-second request timeouts to all external `reqwest::Client` builders to ensure the UI gracefully errors out instead of freezing.

### 4. **Project Scanner Stability (`scanner.rs`)**
- **Bug**: The test environment exposed a flaw where `WalkDir` interactions with Temp directories and hidden parent directories (like `.tmp`) could cause false negative project detections.
- **Fix**: Improved the `is_hidden` logic and stabilized the workspace test structures to guarantee robust `.git` and `mcp.json` / `package.json` detection without incurring massive performance hits from walking into `node_modules` or `.git/objects`.

## 🧪 Testing Infrastructure Improvements
- Added **Vitest** and **React Testing Library** for frontend component validation.
- Added comprehensive **Rust Unit Tests** for core logical modules (`scanner.rs`, `github.rs`, `feed_parser.rs`, `config_manager.rs`, `suite_manager.rs`).
- CI/CD pipelines can now leverage `cargo test` and `vitest run` to prevent regressions.
