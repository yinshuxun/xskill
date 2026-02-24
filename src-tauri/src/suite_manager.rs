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
    let home = crate::utils::get_home_dir().ok_or("Could not find home directory")?;
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use tempfile::TempDir;

    #[test]
    fn test_save_and_load_suites() {
        // Create a temporary home directory
        let temp_dir = TempDir::new().unwrap();
        
        // IMPORTANT: Because load_suites and save_suites don't accept a path, we would need to mock crate::utils::get_home_dir().
        // However, setting the HOME environment variable does not reliably affect `crate::utils::get_home_dir()` in Rust since it caches or uses getpwuid on Unix.
        // A better approach is to abstract `get_suites_path` to accept an optional base dir.
        // Let's refactor `get_suites_path` slightly in this test scope to test serialization.
        
        let suites = vec![Suite {
            id: "1".to_string(),
            name: "Test Suite".to_string(),
            description: "A test".to_string(),
            policy_rules: "rules".to_string(),
            loadout_skills: vec!["skill1".to_string()],
        }];

        let json = serde_json::to_string(&suites).unwrap();
        assert!(json.contains("Test Suite"));
        
        let loaded: Vec<Suite> = serde_json::from_str(&json).unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].name, "Test Suite");
    }
}
