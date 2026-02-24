use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

fn tool_skills_dir(tool_key: &str) -> Option<PathBuf> {
    let home = dirs::home_dir()?;
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

fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create dir {}: {}", dst.display(), e))?;

    for entry in WalkDir::new(src).min_depth(1) {
        let entry = entry.map_err(|e| format!("Walk error: {}", e))?;
        let relative = entry.path().strip_prefix(src)
            .map_err(|e| format!("Strip prefix error: {}", e))?;
        let dest_path = dst.join(relative);

        if entry.path().is_dir() {
            fs::create_dir_all(&dest_path)
                .map_err(|e| format!("Failed to create dir {}: {}", dest_path.display(), e))?;
        } else {
            fs::copy(entry.path(), &dest_path)
                .map_err(|e| format!("Failed to copy {}: {}", entry.path().display(), e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn sync_skill(
    skill_dir: String,
    target_tool_keys: Vec<String>,
) -> Result<Vec<String>, String> {
    let src = PathBuf::from(&skill_dir);
    if !src.exists() {
        return Err(format!("Skill directory does not exist: {}", skill_dir));
    }

    let skill_name = src.file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| format!("Invalid skill directory path: {}", skill_dir))?
        .to_string();

    let mut written_paths: Vec<String> = Vec::new();
    let mut errors: Vec<String> = Vec::new();

    for tool_key in &target_tool_keys {
        match tool_skills_dir(tool_key) {
            None => errors.push(format!("Unknown tool key: {}", tool_key)),
            Some(skills_dir) => {
                let dest = skills_dir.join(&skill_name);
                match copy_dir_all(&src, &dest) {
                    Ok(_) => written_paths.push(dest.to_string_lossy().to_string()),
                    Err(e) => errors.push(format!("{}: {}", tool_key, e)),
                }
            }
        }
    }

    if !errors.is_empty() && written_paths.is_empty() {
        return Err(errors.join("; "));
    }

    Ok(written_paths)
}
