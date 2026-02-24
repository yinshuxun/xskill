# Competitor Analysis: skills-hub

This document analyzes the architecture and features of `skills-hub` to inform the roadmap of `xskill`.

## 1. Core Architecture

### 1.1 Workspace Scanning (`lib/scanner.ts`)
- **Strategy**: Instead of relying on a central registry folder (like `~/.xskill/skills`), `skills-hub` recursively scans user-defined "root" directories (e.g., `~/workspace`).
- **Mechanism**:
  - Starts at configured roots.
  - Recursively walks directories up to `MAX_DEPTH = 5`.
  - Identifies a "Project" by the presence of a `.git` directory.
  - Skips `node_modules`, `dist`, etc.
- **Benefit**: Users don't need to manually "import" projects. Any project in their workspace is automatically discovered and eligible to have skills applied to it.

### 1.2 Remote Skill Fetching (`lib/github-agents.ts`)
- **Direct GitHub Integration**: Does not rely on a central API server. It talks directly to `api.github.com`.
- **Smart Resolution**:
  - Handles `raw.githubusercontent.com` and standard `github.com` URLs.
  - Automatically detects the `default_branch`.
  - Searches for `AGENTS.md` (the configuration file) using the GitHub Tree API if the path is a repository root.
  - Supports decoding Base64 content from GitHub API.
- **Benefit**: Decentralized. Users can install skills from *any* public GitHub repo without waiting for a marketplace update.

### 1.3 "Kits" & "Policies" (Core Concepts)
- **Kit**: A named collection of resources to be applied to a project.
- **KitPolicy**: Represents the `AGENTS.md` file (Project Rules/Context).
- **KitLoadout**: Represents a list of Skills (MCP servers) to be installed/linked.
- **Workflow**:
  1. User defines a "Kit" (e.g., "React Frontend Kit").
  2. Kit includes a "Policy" (Rules for React) and a "Loadout" (React-specific MCP tools).
  3. User selects a "Target Project" (from Scanner).
  4. User clicks "Apply".
  5. App writes `AGENTS.md` to the project root and configures the skills (copying or linking them to `.agent/skills` or similar).

## 2. Gap Analysis for XSkill

| Feature | `skills-hub` | `xskill` (Current) | Gap |
| :--- | :--- | :--- | :--- |
| **Discovery** | Auto-scans workspace (`~/workspace`) | Manual path entry / Central dir only | **Critical**: Users expect auto-discovery. |
| **Remote** | Direct GitHub Fetching | Placeholder / TODO | **Critical**: No way to get online skills yet. |
| **Organization** | Kits (Policy + Skills) | Individual Skills only | **High**: "Kits" are a powerful workflow booster. |
| **Context** | Manages `AGENTS.md` (Rules) | N/A | **Medium**: Adding context/rules is a key part of "Vibe Coding". |
| **Sync** | Syncs to Project (`.agent/`, `.vscode/`) | Syncs to Tool Config (`~/Library/...`) | **High**: Syncing to *Project* is often better for team sharing than syncing to *Global Tool Config*. |

## 3. Recommendations for XSkill Roadmap

1.  **Adopt Workspace Scanning**: Allow users to add "Scan Roots" and auto-discover projects.
2.  **Implement GitHub Fetcher**: Add Rust-based GitHub API client to fetch skills/rules from URLs.
3.  **Introduce "Suites" (or Kits)**: Allow grouping skills + rules into a "Suite" for one-click application.
4.  **UI Redesign**:
    - Move to a darker, more vibrant "Hacker/Cyberpunk" aesthetic (inspired by the X logo).
    - Add "Projects" view.
    - Add "Marketplace" (GitHub Browser).
