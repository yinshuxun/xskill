---
name: "ci-doctor"
description: "Analyzes the CI/CD pipeline status for the current commit. Invoke when user asks about build failures or pipeline status."
---

# CI Doctor

This skill helps you analyze the status of GitHub Actions workflows for the current commit.

## Capabilities

1.  Checks the status of the latest workflow run for the current branch/commit.
2.  Identifies failed jobs and steps.
3.  Fetches logs for failed steps to pinpoint errors.
4.  Provides actionable suggestions for fixing common CI issues.

## Requirements

-   `GITHUB_TOKEN` environment variable must be set (or provided via `.env`).
-   `curl` and `jq` must be installed.

## How to Use

Run the following command:

```bash
node .trae/skills/ci-doctor/scripts/diagnose.js
```

Or ask the agent to "check pipeline status" or "why did the build fail".
