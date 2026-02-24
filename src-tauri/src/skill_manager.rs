use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tool {
    pub key: String,
    pub display_name: String,
    pub skills_dir: String,
    pub installed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalSkill {
    pub name: String,
    pub description: String,
    pub path: String,
    pub tool_key: String,
    pub disable_model_invocation: bool,
    pub allowed_tools: Vec<String>,
    pub content: String,
}

#[derive(Debug, Clone)]
pub struct ToolDef {
    pub key: &'static str,
    pub display_name: &'static str,
    pub skills_subdir: &'static str,
    pub detect_subdir: &'static str,
}

pub fn tool_definitions() -> Vec<ToolDef> {
    vec![
        ToolDef { key: "cursor",         display_name: "Cursor",          skills_subdir: ".cursor/skills",                       detect_subdir: ".cursor" },
        ToolDef { key: "claude_code",    display_name: "Claude Code",     skills_subdir: ".claude/skills",                       detect_subdir: ".claude" },
        ToolDef { key: "opencode",       display_name: "OpenCode",        skills_subdir: ".config/opencode/skills",              detect_subdir: ".config/opencode" },
        ToolDef { key: "windsurf",       display_name: "Windsurf",        skills_subdir: ".codeium/windsurf/skills",             detect_subdir: ".codeium/windsurf" },
        ToolDef { key: "gemini_cli",     display_name: "Gemini CLI",      skills_subdir: ".gemini/skills",                       detect_subdir: ".gemini" },
        ToolDef { key: "github_copilot", display_name: "GitHub Copilot",  skills_subdir: ".copilot/skills",                      detect_subdir: ".copilot" },
        ToolDef { key: "amp",            display_name: "Amp",             skills_subdir: ".config/agents/skills",                detect_subdir: ".config/agents" },
        ToolDef { key: "goose",          display_name: "Goose",           skills_subdir: ".config/goose/skills",                 detect_subdir: ".config/goose" },
        ToolDef { key: "antigravity",    display_name: "Antigravity",     skills_subdir: ".gemini/antigravity/global_skills",    detect_subdir: ".gemini/antigravity" },
        ToolDef { key: "augment",        display_name: "Augment",         skills_subdir: ".augment/rules",                       detect_subdir: ".augment" },
        ToolDef { key: "codex",          display_name: "Codex",           skills_subdir: ".codex/skills",                        detect_subdir: ".codex" },
        ToolDef { key: "kimi_cli",       display_name: "Kimi CLI",        skills_subdir: ".kimi/skills",                         detect_subdir: ".kimi" },
        ToolDef { key: "openclaw",       display_name: "OpenClaw",        skills_subdir: ".openclaw/skills",                     detect_subdir: ".openclaw" },
        ToolDef { key: "cline",          display_name: "Cline",           skills_subdir: ".cline/skills",                        detect_subdir: ".cline" },
        ToolDef { key: "codebuddy",      display_name: "CodeBuddy",       skills_subdir: ".codebuddy/skills",                    detect_subdir: ".codebuddy" },
        ToolDef { key: "continue_dev",   display_name: "Continue",        skills_subdir: ".continue/skills",                     detect_subdir: ".continue" },
        ToolDef { key: "crush",          display_name: "Crush",           skills_subdir: ".crush/skills",                        detect_subdir: ".crush" },
        ToolDef { key: "junie",          display_name: "Junie",           skills_subdir: ".junie/skills",                        detect_subdir: ".junie" },
        ToolDef { key: "kode",           display_name: "Kode",            skills_subdir: ".kode/skills",                         detect_subdir: ".kode" },
        ToolDef { key: "roo_code",       display_name: "Roo Code",        skills_subdir: ".roo-code/skills",                     detect_subdir: ".roo-code" },
        ToolDef { key: "kilo_code",      display_name: "Kilo Code",       skills_subdir: ".kilocode/skills",                     detect_subdir: ".kilocode" },
    ]
}

pub fn home_dir() -> Result<PathBuf, String> {
    dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())
}

pub fn skills_dir_for_tool(def: &ToolDef) -> Result<PathBuf, String> {
    let home = home_dir()?;
    Ok(home.join(def.skills_subdir))
}

fn parse_skill_md(raw: &str, fallback_name: &str) -> (String, String, bool, Vec<String>, String) {
    let mut name = fallback_name.to_string();
    let mut description = String::new();
    let mut disable_model_invocation = false;
    let mut allowed_tools: Vec<String> = Vec::new();
    let content;
    let trimmed = raw.trim();
    if let Some(after_open) = trimmed.strip_prefix("---") {
        if let Some(close_pos) = after_open.find("\n---") {
            let frontmatter = &after_open[..close_pos];
            let after_close = &after_open[close_pos + 4..];
            content = after_close.trim_start_matches(['\n', '\r']).to_string();
            for line in frontmatter.lines() {
                let line = line.trim();
                if let Some(val) = line.strip_prefix("name:") {
                    name = val.trim().to_string();
                } else if let Some(val) = line.strip_prefix("description:") {
                    description = val.trim().to_string();
                } else if let Some(val) = line.strip_prefix("disable-model-invocation:") {
                    disable_model_invocation = val.trim() == "true";
                } else if let Some(val) = line.strip_prefix("allowed-tools:") {
                    let list_str = val.trim().trim_matches('[').trim_matches(']');
                    allowed_tools = list_str
                        .split(',')
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty())
                        .collect();
                }
            }
        } else {
            content = raw.to_string();
        }
    } else {
        content = raw.to_string();
    }
    (name, description, disable_model_invocation, allowed_tools, content)
}

pub fn read_skills_from_dir(skills_dir: &PathBuf, tool_key: &str) -> Vec<LocalSkill> {
    let mut skills = Vec::new();

    let entries = match fs::read_dir(skills_dir) {
        Ok(e) => e,
        Err(_) => return skills,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            // Check for SKILL.md
            let skill_md_path = path.join("SKILL.md");
            if skill_md_path.exists() {
                if let Ok(raw) = fs::read_to_string(&skill_md_path) {
                    let dir_name = path.file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown")
                        .to_string();
                    let (name, description, disable_model_invocation, allowed_tools, content) =
                        parse_skill_md(&raw, &dir_name);
                    skills.push(LocalSkill {
                        name,
                        description,
                        path: path.to_string_lossy().to_string(),
                        tool_key: tool_key.to_string(),
                        disable_model_invocation,
                        allowed_tools,
                        content,
                    });
                }
            } else {
                let dir_name = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();
                
                if !dir_name.starts_with('.') {
                     skills.push(LocalSkill {
                        name: dir_name.clone(),
                        description: format!("Imported from {}", tool_key),
                        path: path.to_string_lossy().to_string(),
                        tool_key: tool_key.to_string(),
                        disable_model_invocation: false,
                        allowed_tools: vec![],
                        content: String::new(),
                    });
                }
            }
        } else if path.is_file() {
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            if ext == "md" || path.to_string_lossy().ends_with(".prompt") {
                if let Ok(raw) = fs::read_to_string(&path) {
                    let file_stem = path.file_stem()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown")
                        .to_string();
                    let (name, description, disable_model_invocation, allowed_tools, content) =
                        parse_skill_md(&raw, &file_stem);

                    let skill_path = path.parent()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|| skills_dir.to_string_lossy().to_string());
                    skills.push(LocalSkill {
                        name,
                        description,
                        path: skill_path,
                        tool_key: tool_key.to_string(),
                        disable_model_invocation,
                        allowed_tools,
                        content,
                    });
                }
            }
        }
    }

    skills
}

#[tauri::command]
pub fn get_installed_tools() -> Result<Vec<Tool>, String> {
    let home = home_dir()?;
    let defs = tool_definitions();
    let mut tools = Vec::new();

    for def in &defs {
        let detect_path = home.join(def.detect_subdir);
        let skills_path = home.join(def.skills_subdir);
        tools.push(Tool {
            key: def.key.to_string(),
            display_name: def.display_name.to_string(),
            skills_dir: skills_path.to_string_lossy().to_string(),
            installed: detect_path.exists(),
        });
    }

    Ok(tools)
}

#[tauri::command]
pub fn get_skills_for_tool(tool_key: String) -> Result<Vec<LocalSkill>, String> {
    let defs = tool_definitions();
    let def = defs
        .iter()
        .find(|d| d.key == tool_key)
        .ok_or_else(|| format!("Unknown tool key: {}", tool_key))?;

    let skills_dir = skills_dir_for_tool(def)?;
    Ok(read_skills_from_dir(&skills_dir, &tool_key))
}

pub const CENTRAL_SKILLS_DIR: &str = ".xskill/skills";

#[tauri::command]
pub fn get_all_local_skills() -> Result<Vec<LocalSkill>, String> {
    let mut all_skills = Vec::new();
    let home = home_dir()?;

    // 1. Read central skills
    let central_path = home.join(CENTRAL_SKILLS_DIR);
    if central_path.exists() {
        all_skills.extend(read_skills_from_dir(&central_path, "xskill"));
    }

    // 2. Read skills from all other tools
    let defs = tool_definitions();
    for def in defs {
        if let Ok(path) = skills_dir_for_tool(&def) {
            if path.exists() {
                // Read skills from tool directory
                let tool_skills = read_skills_from_dir(&path, def.key);
                all_skills.extend(tool_skills);
            }
        }
    }

    // Deduplicate by path
    all_skills.sort_by(|a, b| a.path.cmp(&b.path));
    all_skills.dedup_by(|a, b| a.path == b.path);

    Ok(all_skills)
}
