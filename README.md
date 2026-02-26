# XSkill - The Skill Manager for AI Coding Agents

> **Power up your Vibe Coding experience with local Skill management.**

XSkill is a lightweight, privacy-focused desktop application for macOS that helps you manage, discover, and synchronize **MCP (Model Context Protocol)** skills for your favorite AI coding agents (Cursor, Windsurf, Claude Code, OpenCode, etc.).

## 🚀 Why XSkill?

In the era of **Vibe Coding**, your AI's capability is defined by the tools (Skills) it can use.
XSkill bridges the gap between scattered online skills and your local development environment.

- **🔒 Privacy First**: All your custom skills and configurations are stored locally. No third-party servers involved.
- **⚡️ One-Click Sync**: Instantly synchronize your skill library to **Cursor**, **Windsurf**, **Claude Code**, and **OpenCode** configuration files.
- **📦 Unified Hub**: Manage all your skills (both downloaded and self-created) in one clean interface.
- **🛠 Powerful CLI**: Automate your workflow with the built-in command-line tool.

## 📥 Installation

Download the latest version from our [Releases](https://github.com/buzhangsan/xskill/releases) page.

Currently supported on **macOS** (Universal Binary for Intel & Apple Silicon).

## 💻 CLI Usage

XSkill comes with a powerful CLI to help you automate skill management.

### Setup
Add the binary to your PATH or create a symlink:
```bash
sudo ln -s /Applications/XSkill.app/Contents/MacOS/xskill /usr/local/bin/xskill
```

### Sync Skills
Synchronize all enabled skills to all supported agents:
```bash
xskill sync --all
```

### Create New Skill
Generate a new skill with best-practice scaffolding:
```bash
xskill create --name <my-new-skill>
```

## 🔮 Vision

Our goal is to build the "Homebrew" or "App Store" for AI Skills.
- [x] **Local Management**: Enable/Disable skills with a toggle.
- [x] **Agent Sync**: Auto-detect and configure local IDEs.
- [ ] **Skill Marketplace**: Built-in browser for public MCP skills.
- [ ] **AI Recommendations**: Smart skill suggestions based on your task.

## 📄 License

MIT License.
