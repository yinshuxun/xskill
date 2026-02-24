use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const SUITES_FILE: &str = "suites.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Suite {
    pub id: String,
    pub name: String,
    pub description: String,
    pub policy_rules: String, // The content for AGENTS.md
    pub loadout_skills: Vec<String>, // List of skill IDs or names
}

fn get_suites_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let config_dir = home.join(".xskill");
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    Ok(config_dir.join(SUITES_FILE))
}

#[tauri::command]
pub fn load_suites() -> Result<Vec<Suite>, String> {
    let path = get_suites_path()?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_suites(suites: Vec<Suite>) -> Result<(), String> {
    let path = get_suites_path()?;
    let content = serde_json::to_string_pretty(&suites).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}
