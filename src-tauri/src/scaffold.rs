use crate::skill_manager::CENTRAL_SKILLS_DIR;
use std::fs;
use std::path::PathBuf;

fn tool_skills_dir(tool_key: &str) -> Option<PathBuf> {
    let home = dirs::home_dir()?;
    if tool_key == "xskill" || tool_key == "local" {
        return Some(home.join(CENTRAL_SKILLS_DIR));
    }
    let subdir = match tool_key {
        "cursor"         => ".cursor/skills",
        "claude_code"    => ".claude/skills",
        "opencode"       => ".config/opencode/skills",
        "windsurf"       => ".codeium/windsurf/skills",
        "gemini_cli"     => ".gemini/skills",
        "github_copilot" => ".copilot/skills",
        "amp"            => ".config/agents/skills",
        "goose"          => ".config/goose/skills",
        "antigravity"    => ".gemini/antigravity/global_skills",
        "augment"        => ".augment/rules",
        "codex"          => ".codex/skills",
        "kimi_cli"       => ".kimi/skills",
        "openclaw"       => ".openclaw/skills",
        "cline"          => ".cline/skills",
        "codebuddy"      => ".codebuddy/skills",
        "continue_dev"   => ".continue/skills",
        "crush"          => ".crush/skills",
        "junie"          => ".junie/skills",
        "kode"           => ".kode/skills",
        "roo_code"       => ".roo-code/skills",
        "kilo_code"      => ".kilocode/skills",
        _ => return None,
    };
    Some(home.join(subdir))
}

#[tauri::command]
pub fn create_skill(
    name: String,
    description: String,
    tool_key: String,
    content: String,
) -> Result<String, String> {
    let skills_dir = tool_skills_dir(&tool_key)
        .ok_or_else(|| format!("Unknown tool key: {}", tool_key))?;

    let skill_dir = skills_dir.join(&name);
    fs::create_dir_all(&skill_dir)
        .map_err(|e| format!("Failed to create skill directory: {}", e))?;

    let skill_md = format!(
        "---\nname: {}\ndescription: {}\n---\n\n{}",
        name, description, content
    );
    let skill_md_path = skill_dir.join("SKILL.md");
    fs::write(&skill_md_path, skill_md)
        .map_err(|e| format!("Failed to write SKILL.md: {}", e))?;

    Ok(skill_dir.to_string_lossy().to_string())
}
