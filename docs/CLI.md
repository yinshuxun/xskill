# XSkill CLI Guide

XSkill includes a powerful command-line interface (CLI) that allows you to automate skill management and integration with your favorite AI agents.

## Setup

After installing XSkill.app, you can enable the `xskill` command in your terminal.

### Option 1: Add to PATH (Recommended)

Add the following line to your shell configuration file (`~/.zshrc` or `~/.bashrc`):

```bash
alias xskill="/Applications/XSkill.app/Contents/MacOS/xskill"
```

Then reload your shell:
```bash
source ~/.zshrc
```

### Option 2: Create Symlink

```bash
sudo ln -s /Applications/XSkill.app/Contents/MacOS/xskill /usr/local/bin/xskill
```

## Usage

### 1. Sync Skills

Synchronize all your local skills to all supported agents (Cursor, Claude Code, OpenCode, Windsurf, etc.) in one go.

```bash
xskill sync --all
```

**Example Output:**
```
 ✓ Cursor synced 12 skills
 ✓ Claude Code synced 12 skills
 ✓ OpenCode synced 12 skills
 ✓ Windsurf synced 12 skills
 Done in 0.4s · 4 agents updated
```

### 2. Create New Skill

Generate a new skill with a professional directory structure and best-practice templates.

```bash
xskill create --name <skill-name>
```

**Example:**
```bash
xskill create --name react-perf-audit
```

**Example Output:**
```
 → Created ~/.xskill/skills/react-perf-audit/
 → Scaffolded SKILL.md, scripts/, references/, assets/
 ✓ Added to Hub automatically
```

The created skill will include:
- `SKILL.md`: The main skill definition file.
- `scripts/`: Directory for executable scripts (Python, Bash, etc.).
- `references/`: Directory for documentation and cheat sheets.
- `assets/`: Directory for templates and static files.
