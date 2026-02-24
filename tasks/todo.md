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
- [ ] **New Views**:
    - [ ] **Projects View**: List scanned projects.
    - [ ] **Suites/Kits View**: Manage groups of skills.

### 3.4 "Suites" (Workflow Enhancement)
*Goal: Apply multiple skills and rules to a project in one click.*
- [ ] **Data Model**: Define `Suite` (Name, Description, List of Skills, Rules/Context).
- [ ] **Application Logic**:
    - [ ] "Apply Suite to Project" action.
    - [ ] Copies/Links skills to project's local config (e.g. `.cursor/mcp.json`).
    - [ ] Writes `AGENTS.md` (Rules) to project root.

---

## Phase 4: Intelligence & Automation (Future)
- [ ] **AI Search**: "Find me a skill to handle PDF files" -> recommends from Marketplace.
- [ ] **Auto-Update**: Git pull for installed skills.
- [ ] **System Tray**: Quick access from menu bar.

---

## Pending User Requests (To Be Scheduled)
- [ ] Fix: Local skills not reading (Dependent on **3.1 Scanner**).
- [ ] Fix: Skill store not reading (Dependent on **3.2 Marketplace**).
- [ ] Fix: UI/Icon update (Dependent on **3.3 UI/UX**).
