use crate::skill_manager::CENTRAL_SKILLS_DIR;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

const CONFIG_FILE: &str = "skills_config.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SkillConfig {
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<HashMap<String, String>>,
}

fn get_config_path() -> Result<PathBuf, String> {
    let home = crate::utils::get_home_dir().ok_or("Could not find home directory")?;
    let config_dir = home.join(".xskill");
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    Ok(config_dir.join(CONFIG_FILE))
}

fn load_all_configs() -> Result<HashMap<String, SkillConfig>, String> {
    let path = get_config_path()?;
    if !path.exists() {
        return Ok(HashMap::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn save_all_configs(configs: &HashMap<String, SkillConfig>) -> Result<(), String> {
    let path = get_config_path()?;
    let content = serde_json::to_string_pretty(configs).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn detect_default_config(skill_path: &PathBuf) -> Option<SkillConfig> {
    if !skill_path.exists() {
        return None;
    }

    // Check for package.json
    if skill_path.join("package.json").exists() {
        // Try to find main entry point
        let index_js = skill_path.join("index.js");
        let build_index_js = skill_path.join("build/index.js");
        let dist_index_js = skill_path.join("dist/index.js");
        let src_index_ts = skill_path.join("src/index.ts");
        
        let script_path = if build_index_js.exists() {
            Some(build_index_js)
        } else if dist_index_js.exists() {
             Some(dist_index_js)
        } else if index_js.exists() {
             Some(index_js)
        } else if src_index_ts.exists() {
             // If TS exists but no JS, they might need to run via npx ts-node, but let's assume index.js for now
             Some(index_js) 
        } else {
             None
        };

        if let Some(script) = script_path {
            return Some(SkillConfig {
                command: Some("node".to_string()),
                args: Some(vec![script.to_string_lossy().to_string()]),
                env: None,
            });
        }
    }

    // Check for Python
    if skill_path.join("pyproject.toml").exists() || skill_path.join("requirements.txt").exists() {
        let main_py = skill_path.join("main.py");
        let server_py = skill_path.join("server.py");

        let script_path = if main_py.exists() {
            Some(main_py)
        } else if server_py.exists() {
            Some(server_py)
        } else {
            None
        };

        if let Some(script) = script_path {
            return Some(SkillConfig {
                command: Some("python3".to_string()),
                args: Some(vec![script.to_string_lossy().to_string()]),
                env: None,
            });
        }
    }

    None
}

#[tauri::command]
pub fn get_skill_config(skill_name: String, skill_path: Option<String>) -> Result<SkillConfig, String> {
    let configs = load_all_configs()?;
    if let Some(config) = configs.get(&skill_name) {
        return Ok(config.clone());
    }
    
    // Auto-detect if no config exists
    let path = skill_path.map(PathBuf::from).unwrap_or_else(|| {
        let home = crate::utils::get_home_dir().unwrap_or_default();
        home.join(CENTRAL_SKILLS_DIR).join(&skill_name)
    });

    Ok(detect_default_config(&path).unwrap_or_default())
}

#[tauri::command]
pub fn save_skill_config(skill_name: String, config: SkillConfig) -> Result<(), String> {
    let mut configs = load_all_configs()?;
    configs.insert(skill_name, config);
    save_all_configs(&configs)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_detect_default_config_node() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_path_buf();
        
        fs::write(path.join("package.json"), "{}").unwrap();
        fs::write(path.join("index.js"), "console.log('test');").unwrap();

        let config = detect_default_config(&path).unwrap();
        assert_eq!(config.command.unwrap(), "node");
        assert!(config.args.unwrap()[0].ends_with("index.js"));
    }

    #[test]
    fn test_detect_default_config_python() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_path_buf();
        
        fs::write(path.join("pyproject.toml"), "").unwrap();
        fs::write(path.join("main.py"), "print('test')").unwrap();

        let config = detect_default_config(&path).unwrap();
        assert_eq!(config.command.unwrap(), "python3");
        assert!(config.args.unwrap()[0].ends_with("main.py"));
    }
}
