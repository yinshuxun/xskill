# XSkill v0.3 Requirements & Design

## 1. Sidebar & Navigation Restructuring

### 1.1 New "XSkill Hub" Section
*   **Position**: Top of the sidebar (first item).
*   **Purpose**: The central management console for all skills stored in the global hub (`~/.xskill/hub`).
*   **Features**:
    *   **Skill List**: Display all skills currently present in the central hub.
    *   **Import Skill**: Move the global "Import Skill" functionality here.
        *   Support "Import from Git" and "Import from Existing Local Folder".
        *   *Fix*: Adjust spacing of buttons in the Import Skill dialog (bottom action buttons).
    *   **Create Skill**: Move the global "Create Skill" functionality here.

### 1.2 Revamped "My Skills" Section
*   **Purpose**: Display skills that are actively **used/linked** by local agents (e.g., Cursor, Claude Desktop, etc.), rather than just listing everything in the hub.
*   **Display Logic**:
    *   **Deduplication**: If the same skill (same ID/Name) is used by multiple agents, display it as a **single card**.
    *   **Agent Badges**: The card must clearly show icons/badges for *all* agents that have this skill installed.
*   **Delete/Unlink Action**:
    *   When deleting a skill from this view, offer options:
        *   "Delete from All Agents" (Remove all links).
        *   "Delete from [Specific Agent]" (Remove link for just that agent).

## 2. Marketplace Implementation

### 2.1 Concept
*   **Goal**: Showcase open-source skills available for download, similar to `skills-manager-client`.
*   **Data Source**: Use a remote JSON file (similar to `public/data/marketplace.json` in the reference project) to populate the list.
*   **Interaction**:
    *   **Browse**: List skills with descriptions, authors, and stars.
    *   **Search**: Filter skills by name/description.
    *   **Install**: "Download" button that clones the skill repository into the local XSkill Hub (`~/.xskill/hub`).
    *   **Status**: Show "Installed" if the skill already exists in the Hub.

### 2.2 Reference Analysis (from `skills-manager-client`)
*   **Data Structure**: Uses a static JSON containing metadata (`id`, `name`, `githubUrl`, `description`, etc.).
*   **State**: Uses Zustand (`useSkillStore`) to fetch and manage the marketplace list.
*   **Process**:
    1.  Fetch JSON.
    2.  User clicks "Install".
    3.  App invokes Tauri command to `git clone` the `githubUrl` to the local storage.
    4.  Updates local state to reflect installation.

## 3. UI/UX Improvements

### 3.1 Branding
*   **Logo**: Update the top-left "XSkill" text with an artistic font and refined color palette (matching the new "Geek" theme).

### 3.2 Footer Info
*   **Version**: Display the current application version (e.g., `v0.2.10`) at the bottom-left of the sidebar.

---

## Implementation Plan

1.  **Refactor Sidebar**: Update `Sidebar.tsx` and routing.
2.  **Build XSkill Hub Page**: Migrate logic from current `MySkills` (which acts like a hub view) to new `HubPage`.
3.  **Refactor My Skills Page**: Implement the "Agent-centric" view with deduplication logic.
4.  **Implement Marketplace**:
    *   Create/Host a `marketplace.json` (or use a placeholder).
    *   Add `fetchMarketplace` logic.
    *   Wire up "Download" to existing `git_clone` command.
5.  **UI Polish**: Update Logo and add Version footer.
