use crate::skill_manager::CENTRAL_SKILLS_DIR;
use std::fs;
use std::path::PathBuf;

fn tool_skills_dir(tool_key: &str) -> Option<PathBuf> {
    let home = crate::utils::get_home_dir()?;
    if tool_key == "xskill" || tool_key == "local" {
        return Some(home.join(CENTRAL_SKILLS_DIR));
    }
    let subdir = match tool_key {
        "cursor" => ".cursor/skills",
        "claude_code" => ".claude/skills",
        "opencode" => ".config/opencode/skills",
        "windsurf" => ".codeium/windsurf/skills",
        "gemini_cli" => ".gemini/skills",
        "github_copilot" => ".copilot/skills",
        "amp" => ".config/agents/skills",
        "goose" => ".config/goose/skills",
        "antigravity" => ".gemini/antigravity/global_skills",
        "augment" => ".augment/rules",
        "codex" => ".codex/skills",
        "kimi_cli" => ".kimi/skills",
        "openclaw" => ".openclaw/skills",
        "cline" => ".cline/skills",
        "codebuddy" => ".codebuddy/skills",
        "continue_dev" => ".continue/skills",
        "crush" => ".crush/skills",
        "junie" => ".junie/skills",
        "kode" => ".kode/skills",
        "roo_code" => ".roo-code/skills",
        "kilo_code" => ".kilocode/skills",
        _ => return None,
    };
    Some(home.join(subdir))
}

/// Generate a professional SKILL.md following best practices
fn generate_skill_md(
    name: &str,
    description: &str,
    content: &str,
    negative_triggers: &str,
    allowed_tools: &[String],
) -> String {
    let allowed_tools_str = if allowed_tools.is_empty() {
        String::new()
    } else {
        format!("allowed-tools: [{}]\n", allowed_tools.join(", "))
    };

    format!("---\nname: {}\ndescription: {}\n{}\n---\n\n## Overview\n{}\n\n## When to Use\n- Use this skill when the user wants to {}\n\n## When NOT to Use\n{}\n\n## Procedures\n\n### Step 1: Understand the Request\n{}\n\n### Step 2: Execute the Task\n{}\n\n### Step 3: Verify the Result\n{}\n\n## Error Handling\n\nIf errors occur, provide clear feedback to the user and suggest fixes.\n\n## References\n\nSee the following files for detailed information:\n- `references/` - Additional documentation\n- `assets/` - Templates and examples\n",
        name,
        description,
        allowed_tools_str,
        content,
        content.lines().next().unwrap_or("perform the task"),
        if negative_triggers.is_empty() {
            "- Do not use for unrelated tasks"
        } else {
            negative_triggers
        },
        "Analyze the user's request and determine the specific requirements.",
        "Execute the task following the established procedures.",
        "Verify the output meets the requirements and provide feedback."
    )
}

/// Copy skill directory to hub
fn collect_skill_to_hub(skill_dir: &PathBuf) -> Result<PathBuf, String> {
    let home =
        crate::utils::get_home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    let hub_dir = home.join(CENTRAL_SKILLS_DIR).join("hub");

    fs::create_dir_all(&hub_dir).map_err(|e| format!("Failed to create hub directory: {}", e))?;

    let skill_name = skill_dir
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid skill directory name".to_string())?;

    let target_dir = hub_dir.join(skill_name);

    // Remove existing if present
    if target_dir.exists() {
        fs::remove_dir_all(&target_dir)
            .map_err(|e| format!("Failed to remove existing skill: {}", e))?;
    }

    // Copy to hub
    copy_dir_all(skill_dir, &target_dir)
        .map_err(|e| format!("Failed to copy skill to hub: {}", e))?;

    Ok(target_dir)
}

/// Recursively copy directory
fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| e.to_string())?;

    for entry in fs::read_dir(src).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let ty = entry.file_type().map_err(|e| e.to_string())?;
        let dest_path = dst.join(entry.file_name());

        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dest_path)?;
        } else {
            fs::copy(entry.path(), dest_path).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn create_skill(
    name: String,
    description: String,
    tool_key: String,
    content: String,
    negative_triggers: Option<String>,
    allowed_tools: Option<Vec<String>>,
    collect_to_hub: Option<bool>,
) -> Result<String, String> {
    // Validate name: lowercase, numbers, hyphens only, 1-64 chars
    let name_lower = name.to_lowercase();
    if name_lower.len() > 64 {
        return Err("Name must be 64 characters or less".to_string());
    }
    if !name_lower
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err("Name must contain only lowercase letters, numbers, and hyphens".to_string());
    }
    if name_lower.contains("--") {
        return Err("Name cannot contain consecutive hyphens".to_string());
    }

    let skills_dir =
        tool_skills_dir(&tool_key).ok_or_else(|| format!("Unknown tool key: {}", tool_key))?;

    let skill_dir = skills_dir.join(&name_lower);
    fs::create_dir_all(&skill_dir)
        .map_err(|e| format!("Failed to create skill directory: {}", e))?;

    // Create subdirectories following best practices
    let scripts_dir = skill_dir.join("scripts");
    let references_dir = skill_dir.join("references");
    let assets_dir = skill_dir.join("assets");

    fs::create_dir_all(&scripts_dir)
        .map_err(|e| format!("Failed to create scripts directory: {}", e))?;
    fs::create_dir_all(&references_dir)
        .map_err(|e| format!("Failed to create references directory: {}", e))?;
    fs::create_dir_all(&assets_dir)
        .map_err(|e| format!("Failed to create assets directory: {}", e))?;

    // Generate professional SKILL.md
    let neg_triggers = negative_triggers.unwrap_or_default();
    let tools = allowed_tools.unwrap_or_default();
    let skill_md = generate_skill_md(&name_lower, &description, &content, &neg_triggers, &tools);

    let skill_md_path = skill_dir.join("SKILL.md");
    fs::write(&skill_md_path, skill_md).map_err(|e| format!("Failed to write SKILL.md: {}", e))?;

    // Create placeholder files to guide users
    let readme_content = "# References\n\nAdd supplementary documentation here.\n- API docs\n- Cheatsheets\n- Domain logic\n";
    fs::write(references_dir.join("README.md"), readme_content)
        .map_err(|e| format!("Failed to create references README: {}", e))?;

    let assets_readme = "# Assets\n\nAdd templates and output examples here.\n- JSON schemas\n- Output templates\n- Configuration examples\n";
    fs::write(assets_dir.join("README.md"), assets_readme)
        .map_err(|e| format!("Failed to create assets README: {}", e))?;

    let scripts_readme = "# Scripts\n\nAdd executable scripts here (Python, Bash, Node).\nScripts should be tiny, single-purpose CLIs.\n";
    fs::write(scripts_dir.join("README.md"), scripts_readme)
        .map_err(|e| format!("Failed to create scripts README: {}", e))?;

    // Collect to hub if requested
    if collect_to_hub.unwrap_or(true) {
        collect_skill_to_hub(&skill_dir)?;
    }

    Ok(skill_dir.to_string_lossy().to_string())
}
