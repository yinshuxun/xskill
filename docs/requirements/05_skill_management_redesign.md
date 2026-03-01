# Skill Management Redesign (Based on skills-hub)

## 1. Three-Tier Architecture

To provide a robust and flexible skill management system, we are adopting a three-tier architecture:

1.  **Hub (Central Repository)**:
    *   **Location**: `~/.xskill/hub` (or user-configured).
    *   **Purpose**: The single source of truth for all downloaded, created, or imported skills.
    *   **Action**: Skills are *created* or *imported* here.

2.  **Agent (Global Tool Config)**:
    *   **Location**: `~/.cursor/skills`, `~/.claude/skills`, etc.
    *   **Purpose**: Skills that should be available globally whenever a specific AI agent is used.
    *   **Action**: Skills are *synced* (copied or symlinked) from the Hub to these directories.

3.  **Project (Workspace Specific)**:
    *   **Location**: `~/workspace/my-app/.cursor/skills`, `~/workspace/my-app/.agent/skills`, etc.
    *   **Purpose**: Skills that are specific to a single project (e.g., a custom deployment script skill).
    *   **Action**: Skills are *applied* (via Suites/Kits) or *synced* from the Hub to the project directory.

## 2. Core Operations (CRUD & Distribution)

*   **Create**: Scaffolds a new skill directly into the **Hub**.
*   **Read/Scan**: The app scans the Hub, known Agent global paths, and discovered Project paths to build a comprehensive view of all skills.
*   **Import**: Fetches a skill from a GitHub URL or local path and places it into the **Hub**.
*   **Sync (Distribute)**:
    *   **Copy Mode**: Creates an independent physical copy of a Hub skill into an Agent or Project directory.
    *   **Link Mode (Recommended)**: Creates a symlink from the Hub to the Agent/Project directory. This ensures that updating the skill in the Hub automatically updates it everywhere it's used.
*   **Collect (Reverse Sync)**: If a user creates a useful skill directly inside a Project directory, this operation copies/moves it back to the **Hub** so it can be shared with other projects.
*   **Delete**: Removes the skill from the Hub (and optionally offers to remove broken symlinks from Agents/Projects).

## 3. UI/UX Redesign

### 3.1 Skill Cards
*   **Visuals**: Modern, dark-themed cards with subtle hover effects (e.g., slight lift, border glow).
*   **Agent Badges**: Display icons of the agents where the skill is currently synced.
    *   *Hover State*: Hovering over an agent icon shows a tooltip with the exact path (e.g., `~/.cursor/skills/my-skill`).
*   **Tier Indicator**: A small badge indicating if the skill is in the Hub, an Agent global dir, or a Project dir.

### 3.2 Action Buttons
*   **Sync Button**:
    *   *Icon*: `RefreshCw` or `Link`.
    *   *Color*: Primary accent color.
    *   *Interaction*: Opens a dropdown or modal to select target Agents/Projects and choose between "Copy" or "Link" mode.
*   **Collect Button** (Only visible for Project/Agent skills):
    *   *Icon*: `Download` or `ArrowUpCircle`.
    *   *Interaction*: Moves the skill to the Hub.
*   **Edit/Config Button**:
    *   *Icon*: `Settings` or `Wrench`.
    *   *Interaction*: Opens the configuration modal (env vars, args).

### 3.3 Supported Agent Icons
We need to source and integrate SVG icons for the following supported agents to display on the skill cards:
*   Antigravity
*   Claude Code
*   Cursor
*   Trae
*   Windsurf
*   OpenCode
*   Codex
*   Amp
*   Kilo Code
*   Roo Code
*   Goose
*   Gemini CLI
*   GitHub Copilot
*   Clawdbot
*   Droid
*   Qoder

## 4. Implementation Status

- [x] **Design Doc**: Create `docs/05_skill_management_redesign.md`.
- [x] **Agent Icons**: Create `src/components/ui/icons.tsx` with 16 agent SVG icons.
- [x] **New SkillCard**: Create `src/components/SkillCard.tsx` with Tier badge, Agent icon row, Sync dropdown (Copy/Link), Collect button.
- [x] **Wire SkillCard into App**: Replace inline `SkillCard`/`SyncButton` in `App.tsx` with new component.
- [x] **Docs update**: Update `docs/02_requirements.md` with three-tier architecture section.
- [x] **Backend: Sync Link Mode**: Add symlink support to `ide_sync.rs` (`sync_skill` command, `link` mode).
- [x] **Backend: Collect**: Add `skill_collect_to_hub` Tauri command — moves/copies a Skill to `~/.xskill/skills/`.
- [x] **UI: Collect wired up**: Connect Collect button in `SkillCard.tsx` to the new backend command.
