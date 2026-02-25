use crate::config_manager::get_skill_config;
use crate::skill_manager::CENTRAL_SKILLS_DIR;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

fn tool_skills_dir(tool_key: &str) -> Option<PathBuf> {
    let home = crate::utils::get_home_dir()?;
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



/// Create a symlink at `dst` pointing to `src`.
/// On macOS/Linux uses `std::os::unix::fs::symlink`.
#[cfg(unix)]
fn symlink_dir(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    if dst.exists() || dst.is_symlink() {
        fs::remove_file(dst)
            .or_else(|_| fs::remove_dir_all(dst))
            .map_err(|e| format!("Failed to remove existing target {}: {}", dst.display(), e))?;
    }
    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent dir {}: {}", parent.display(), e))?;
    }
    std::os::unix::fs::symlink(src, dst)
        .map_err(|e| format!("Failed to create symlink {} -> {}: {}", dst.display(), src.display(), e))
}

fn update_claude_desktop_config(skill_name: &str, _dest_path: &PathBuf) -> Result<(), String> {
    // Only works on macOS for now
    let home = crate::utils::get_home_dir().ok_or("Could not find home dir")?;
    let config_path = home.join("Library/Application Support/Claude/claude_desktop_config.json");
    
    if !config_path.exists() {
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&config_path, "{}").map_err(|e| e.to_string())?;
    }

    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let mut json: Value = serde_json::from_str(&content).unwrap_or(serde_json::json!({}));

    // Get skill config
    let skill_config = get_skill_config(skill_name.to_string(), Some(_dest_path.to_string_lossy().to_string()))?;
    
    // Only update if we have a command configured
    if let Some(cmd) = skill_config.command {
        let args = skill_config.args.unwrap_or_default();
        let env = skill_config.env.unwrap_or_default();

        if json.get("mcpServers").is_none() {
             json["mcpServers"] = serde_json::json!({});
        }
        
        if let Some(mcp_servers) = json.get_mut("mcpServers").and_then(|v| v.as_object_mut()) {
             mcp_servers.insert(skill_name.to_string(), serde_json::json!({
                 "command": cmd,
                 "args": args,
                 "env": env
             }));
        }

        let new_content = serde_json::to_string_pretty(&json).map_err(|e| e.to_string())?;
        fs::write(&config_path, new_content).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Sync a skill directory to one or more target tool skill directories.
///
/// `mode` controls how the skill is delivered:
/// - `"copy"` (default): copy the directory recursively
/// - `"link"`: create a symlink pointing back to `skill_dir`
#[tauri::command]
pub fn sync_skill(
    skill_dir: String,
    target_tool_keys: Vec<String>,
    mode: Option<String>,
) -> Result<Vec<String>, String> {
    let src = PathBuf::from(&skill_dir);
    if !src.exists() {
        return Err(format!("Skill directory does not exist: {}", skill_dir));
    }

    let skill_name = src.file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| format!("Invalid skill directory path: {}", skill_dir))?
        .to_string();

    let use_link = mode.as_deref() == Some("link");

    let mut written_paths: Vec<String> = Vec::new();
    let mut errors: Vec<String> = Vec::new();

    for tool_key in &target_tool_keys {
        match tool_skills_dir(tool_key) {
            None => errors.push(format!("Unknown tool key: {}", tool_key)),
            Some(skills_dir) => {
                let dest = skills_dir.join(&skill_name);
                if let (Ok(s), Ok(d)) = (fs::canonicalize(&src), fs::canonicalize(&dest)) {
                    if s == d {
                        written_paths.push(dest.to_string_lossy().to_string());
                        continue;
                    }
                }

                let result = if use_link {
                    #[cfg(unix)]
                    { symlink_dir(&src, &dest) }
                    #[cfg(not(unix))]
                    { Err("Symlink mode is only supported on macOS/Linux".to_string()) }
                } else {
                    crate::utils::copy_dir_all(&src, &dest)
                };

                match result {
                    Ok(_) => {
                        written_paths.push(dest.to_string_lossy().to_string());
                        // Try to inject config for known tools
                        if tool_key == "claude_code" || tool_key == "claude_desktop" {
                             if let Err(e) = update_claude_desktop_config(&skill_name, &dest) {
                                 errors.push(format!("Claude Config Error: {}", e));
                             }
                        }
                    },
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

/// Collect a skill from any Agent/Project-level directory into the Hub (`~/.xskill/skills/`).
///
/// The skill directory at `skill_dir` is copied into the Hub. If a skill with the
/// same name already exists in the Hub, it is overwritten.
#[tauri::command]
pub fn skill_collect_to_hub(skill_dir: String) -> Result<String, String> {
    let src = PathBuf::from(&skill_dir);
    if !src.exists() || !src.is_dir() {
        return Err(format!("Skill directory does not exist or is not a directory: {}", skill_dir));
    }

    let skill_name = src.file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| format!("Invalid skill directory path: {}", skill_dir))?
        .to_string();

    let home = crate::utils::get_home_dir().ok_or("Could not find home directory")?;
    let hub_dir = home.join(CENTRAL_SKILLS_DIR).join(&skill_name);
    if let (Ok(s), Ok(h)) = (fs::canonicalize(&src), fs::canonicalize(&hub_dir)) {
        if s == h {
            return Ok(hub_dir.to_string_lossy().to_string());
        }
    }

    crate::utils::copy_dir_all(&src, &hub_dir).map_err(|e| e.to_string())?;

    Ok(hub_dir.to_string_lossy().to_string())
}
