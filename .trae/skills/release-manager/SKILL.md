---
name: "release-manager"
description: "Automates the release process for xskill app (version bump, git tag, commit). Invoke when user asks to release a new version."
---

# Release Manager

This skill helps you release a new version of the xskill app.

## What it does

1. Reads the current version from `package.json`.
2. Increments the patch version (e.g. 0.4.1 -> 0.4.2).
3. Updates `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src-tauri/src/main.rs`.
4. Commits the changes and creates a git tag.

## How to use

Run the following command:

```bash
node .trae/skills/release-manager/scripts/release.js
```

Or ask the agent to "release a new version" and it will run the script for you.

## Manual Steps (if script fails)

1. Update version in `package.json`.
2. Update version in `src-tauri/tauri.conf.json`.
3. Update version in `src-tauri/Cargo.toml`.
4. Update version in `src-tauri/src/main.rs` (CLI command attribute).
5. Run:
   ```bash
   git add .
   git commit -m "chore: bump version to <new-version>"
   git tag v<new-version>
   git push && git push --tags
   ```
