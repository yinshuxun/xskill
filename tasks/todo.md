# XSkill Project Roadmap (Master TODO)

This document tracks the development progress of XSkill.

---

## Phase 1: MVP (Completed) ✅
- [x] **Architecture**: Tauri v2 + React + Rust modular structure.
- [x] **Basic Sync**: Sync local skills to Cursor/OpenCode/Claude global configs.
- [x] **Basic UI**: Shadcn/ui dashboard.
- [x] **CI/CD**: GitHub Actions for build and release.

---

## Phase 2: Creation & Internal Loop (Completed) ✅
- [x] **Scaffolding**: Generate new MCP skills (TS/Python) with `git init`.
- [x] **Internal Feeds**: Parse custom JSON feeds for internal skill sharing.
- [x] **Onboarding**: Scan standard directories (`~/.cursor`, etc.) to import existing skills.

---

## Phase 3: Core Capabilities Refactoring (Current Focus) 🚧

### 3.1 Workspace & Project Discovery (The "Scanner" Engine)
*Goal: Automatically find where users work, instead of making them manually add paths.*
- [x] **Rust Scanner Module**:
    - [x] Implement `scanner.rs` using `walkdir`.
    - [x] Configuration for `scan_roots` (e.g., `~/workspace`, `~/projects`).
    - [x] Recursive scan for `.git` folders to identify "Projects".
- [x] **Project Detection**:
    - [x] Detect if a project *is* a skill (has `mcp.json` or `package.json` with mcp keywords).
    - [x] Detect if a project *uses* skills (has `.cursor/`, `.vscode/`, or `AGENTS.md`).

### 3.2 Marketplace & Remote Fetcher
*Goal: Install skills directly from the internet.*
- [x] **GitHub API Client (Rust)**:
    - [x] Implement `github.rs` using `reqwest`.
    - [x] Support parsing `github.com` and `raw.githubusercontent.com` URLs.
    - [x] Ability to fetch `AGENTS.md` or `mcp.json` from a repo.
- [x] **Marketplace UI**:
    - [x] Create a "Marketplace" tab.
    - [x] Input box for GitHub URL -> "Install" button.

### 3.3 UI/UX Redesign (The "X" Aesthetic)
*Goal: Make it look cool, distinct, and professional.*
- [ ] **Visual Identity**:
    - [ ] **Icon**: Design new App Icon (Dark/Neon X style).
    - [ ] **Theme**: Switch to Dark Mode default with high-contrast accents.
- [x] **New Views**:
    - [x] **Projects View**: List scanned projects.
    - [x] **Suites/Kits View**: Manage groups of skills.

### 3.4 "Suites" (Workflow Enhancement)
*Goal: Apply multiple skills and rules to a project in one click.*
- [x] **Data Model**: Define `Suite` (Name, Description, List of Skills, Rules/Context).
- [x] **Application Logic**:
    - [x] "Apply Suite to Project" action.
    - [x] Copies/Links skills to project's local config (e.g. `.cursor/skills/`).
    - [x] Writes `AGENTS.md` (Rules) to project root.

---

### 3.5 Skill Management Redesign (Three-Tier Architecture)
*Goal: Align with skills-hub competitor — implement Hub/Agent/Project three-tier model and new card UI.*
- [x] **Design Doc**: Create `docs/05_skill_management_redesign.md`.
- [x] **Agent Icons**: Create `src/components/ui/icons.tsx` with 16 agent SVG icons.
- [x] **New SkillCard**: Create `src/components/SkillCard.tsx` with Tier badge, Agent icon row, Sync dropdown (Copy/Link), Collect button.
- [x] **Wire SkillCard into App**: Replace inline `SkillCard`/`SyncButton` in `App.tsx` with new component.
- [x] **Docs update**: Update `docs/02_requirements.md` with three-tier architecture section.
- [x] **Backend: Sync Link Mode**: Add symlink support to `suite_applier.rs` (`sync_skill` command, `link` mode).
- [x] **Backend: Collect**: Add `skill_collect_to_hub` Tauri command — moves/copies a Skill to `~/.xskill/skills/`.
- [x] **UI: Collect wired up**: Connect Collect button in `SkillCard.tsx` to the new backend command.


### 3.6 Stability & Usability Enhancements (Completed) ✅
*Goal: Fix critical bugs and improve user experience.*
- [x] **Dependency Resolution**:
    - [x] Fix Rust `edition 2024` conflicts (time-core, getrandom).
    - [x] Downgrade `Cargo.lock` to v3 for compatibility.
    - [x] Pin dependencies in `Cargo.toml` to support older rustc versions.
- [x] **UI Polish**:
    - [x] Move delete icon to the right of sync icon.
    - [x] Add hover tooltips for all action buttons.
    - [x] Optimize sync dropdown width.
- [x] **Skill Management**:
    - [x] Implement `delete_skill` backend command and UI integration.
    - [x] Implement `install_skill_from_url` for direct GitHub import to Hub.
    - [x] Update `lessons.md` with dependency resolution knowledge.

## Phase 4: Intelligence & Automation (Future)
- [ ] **AI Search**: "Find me a skill to handle PDF files" -> recommends from Marketplace.
- [ ] **Auto-Update**: Git pull for installed skills.
- [ ] **System Tray**: Quick access from menu bar.

---

## Phase 5: v0.3.0 Iteration (Universal Agent Manager) 🚀
*Goal: Transform xskill into a Universal Agent Skill Manager with global sync and health checks.*
- [ ] **Universal Agent Sync**:
    - [ ] Detect installed Agents (Cursor, Windsurf, Trae, VSCode) and their config paths.
    - [ ] Allow syncing Suites/Skills to Agent's Global Scope (e.g., `~/.cursor/rules`).
- [ ] **Symlink "Live" Mode**:
    - [ ] Add "Link (Live Update)" option in Apply/Sync dialog.
    - [ ] Implement backend symlink logic for cross-platform support.
- [ ] **Enhanced Hub Management**:
    - [ ] Distinct UI for "Hub Source" vs "Installed Instance".
    - [ ] "Eject" command to convert Symlink to Copy.
- [ ] **E2E Verification & Health**:
    - [ ] **Health Check View**: Dashboard for agent installation status and path validity.
    - [ ] **Verify Command**: Automated check if a skill is correctly installed and accessible by the agent.

---

## Pending User Requests (To Be Scheduled)
- [ ] Fix: Local skills not reading (Dependent on **3.1 Scanner**).
- [ ] Fix: Skill store not reading (Dependent on **3.2 Marketplace**).
- [ ] Fix: UI/Icon update (Dependent on **3.3 UI/UX**).
