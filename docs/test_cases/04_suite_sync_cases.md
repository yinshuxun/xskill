# XSkill Suite Sync Test Cases

**Version**: v0.5.2
**Last Updated**: 2026-03-02
**Description**: Test cases for Suite synchronization to Projects and Agents (Global).

---

## 1. Suite Sync to Agent (Global)

### Case ID: `TC-E2E-025`
- **Module**: `integration_tests.rs`
- **Test Name**: `test_e2e_025_suite_apply_to_agent`
- **Related Code**: `apply_suite_to_agent`
- **Pre-conditions**: 
  - `XSKILL_TEST_HOME` environment variable set.
  - Temporary sandbox directory created.
  - Hub skill "agent-skill" created.
  - Suite "agent_suite" created containing "agent-skill".
- **Test Steps**:
  1. Create a skill in the Hub (`.xskill/skills/agent-skill`).
  2. Define a Suite object loading "agent-skill".
  3. Call `apply_suite_to_agent` targeting "cursor" with mode "copy".
  4. Verify the skill exists in `.cursor/skills/agent-skill`.
  5. (Unix Only) Call `apply_suite_to_agent` targeting "vscode" with mode "link".
  6. Verify the skill exists in `.vscode/skills/agent-skill` and is a symlink.
- **Expected Result**: 
  - Skill is correctly copied to the agent's global skills directory.
  - Skill is correctly symlinked when link mode is used (on Unix).
- **Boundary Conditions**: 
  - Agent directory does not exist (should be created).
  - Skill already exists (should be overwritten/updated).
  - Invalid agent key (should fail gracefully or return error).

---

## 2. Suite Sync to Project (Link Mode)

### Case ID: `TC-E2E-015-LINK`
- **Module**: `integration_tests.rs`
- **Test Name**: `test_e2e_015_suite_apply_to_project` (Modified)
- **Related Code**: `apply_suite`
- **Pre-conditions**: 
  - `XSKILL_TEST_HOME` environment variable set.
  - Project directory created.
  - Hub skill exists.
  - Suite exists.
- **Test Steps**:
  1. Call `apply_suite` with `mode="copy"`.
  2. Verify skill is copied to project skills directory.
  3. (Manual verification needed for "link" mode in existing test or new test).
- **Expected Result**: 
  - `apply_suite` respects the `mode` parameter.
  - Link mode creates symlinks instead of copying files.
