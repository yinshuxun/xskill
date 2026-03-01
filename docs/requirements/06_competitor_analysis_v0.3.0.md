# Competitor Analysis & Gap Report: xskill vs skills-hub

## 1. Executive Summary
**xskill** is a desktop application focused on managing local AI skills, creating "Suites" (collections of skills + rules), and applying them to projects. It has a strong focus on "Project-level" application.
**skills-hub** is a more mature CLI/Desktop hybrid that emphasizes a "Hub" concept, multi-agent support (Cursor, Windsurf, etc.), and a "Kit" (similar to Suite) system that supports both "Copy" and "Symlink" modes. It has a robust "Provider" abstraction for connecting to various LLM backends.

## 2. Feature Comparison Matrix

| Feature Category | Feature | xskill (Current) | skills-hub (Competitor) | Gap / Observation |
| :--- | :--- | :--- | :--- | :--- |
| **Core Architecture** | **Hub Concept** | Partial (`.xskill/skills`) | Strong (`~/.skills-hub` + structured layout) | xskill needs a more formal "Hub" structure. |
| | **Agent Support** | Implicit (via scanning) | Explicit (16+ agents supported, config paths defined) | xskill needs explicit multi-agent configuration. |
| | **Provider Abstraction** | None (Relies on local tools) | Robust (Claude, OpenAI, Gemini, etc.) | **Major Gap**: skills-hub allows configuring *which* LLM runs the skill/agent. xskill assumes the agent environment handles it. |
| **Skill Management** | **CRUD** | Create, Read, Delete | Create, Read, Update, Delete | xskill recently added Delete. Update is partial. |
| | **Import** | URL (Git Clone) | URL + Local Path | Parity achievable. |
| | **Discovery** | Local Scan | Local Scan + Registry (Implied) | xskill scanning is project-centric; skills-hub is agent-centric. |
| **Distribution** | **Sync Mode** | Copy (Implied) | Copy + **Symlink** | **Critical Gap**: Symlinking is crucial for maintaining updates across projects without re-copying. |
| | **Marketplace** | Basic RSS/Feed | Integrated | xskill's marketplace is feed-based (good), but needs better install flow. |
| **Grouping** | **Collections** | "Suites" (Skills + Rules) | "Kits" (Skills + Rules + Loadout) | Concepts are similar. skills-hub "Loadout" includes sort order and sync mode per skill. |
| **Integration** | **Apply to Project** | Yes (Copy to `.agent/skills`?) | Yes (Sync to Agent Global or Project Local) | xskill applies to `project.path`. skills-hub supports *Global* agent sync (e.g. `~/.cursor/skills`). |
| | **Configuration** | Basic (Env vars?) | Detailed (API Keys, Endpoints) | skills-hub manages the *Provider* config. xskill ignores this (maybe intentionally?). |

## 3. Critical Gaps & Recommendations

### 3.1. Symlink Support (Sync Mode)
*   **Gap**: `xskill` copies skills. If I update a skill in my library, I have to re-apply it to every project.
*   **Recommendation**: Implement "Link" mode in `ApplySuiteDialog`. Use symlinks (or junctions on Windows) to reference the central skill.

### 3.2. Explicit Agent Support & Global Sync
*   **Gap**: `xskill` scans *projects* to find where to put skills. Users often want skills available *globally* in their editor (e.g., Cursor global rules).
*   **Recommendation**: Add a "Sync to Agent" feature. Detect installed agents (Cursor, Windsurf, Trae) and allow syncing a Suite to their *global* configuration directory (e.g., `~/.cursor/rules`).

### 3.3. Provider/LLM Configuration (Strategic Decision)
*   **Gap**: `skills-hub` manages LLM keys.
*   **Decision**: `xskill` seems designed to be "Tool Manager", not "Agent Runner". We should **SKIP** Provider management for now to keep the scope focused on *Skills* and *Rules*, letting the specific Agent (Cursor/Trae) handle the LLM connection.

### 3.4. Enhanced "Suite" Definition
*   **Gap**: `xskill` Suites are just a list of skills. `skills-hub` Kits allow defining *how* each skill is synced (Copy vs Link).
*   **Recommendation**: Update `Suite` data model to store `sync_mode` per skill.

### 3.5. E2E Verification
*   **Gap**: No automated way to check if a skill *actually* works in the target agent.
*   **Recommendation**: Add a "Verify" command that attempts to run the skill in a sandbox or checks the file integrity after sync.

## 4. New Iteration Plan (v0.3.0)

**Goal**: Transform `xskill` from a "Project Scaffolder" to a "Universal Agent Skill Manager".

### Feature 1: Universal Agent Sync (Global Scope)
*   Detect installed Agents (Cursor, Windsurf, Trae, VSCode).
*   Allow applying a Suite to the *Agent's Global Scope* (not just a specific project folder).

### Feature 2: Symlink "Live" Mode
*   Add option in Suite/Apply: "Link (Live Update)" vs "Copy (Snapshot)".
*   Implement backend logic for symlinking.

### Feature 3: Enhanced Hub Management
*   "My Skills" should clearly distinguish "Hub" (Source) vs "Installed" (Instance).
*   Allow "Ejecting" a skill (converting Link to Copy).

### Feature 4: E2E "Health Check"
*   New tab/view: "Health".
*   Checks if Agents are installed.
*   Checks if Symlinks are valid.
*   Checks if Skills have required config files.

