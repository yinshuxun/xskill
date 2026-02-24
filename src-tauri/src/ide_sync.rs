use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct McpConfig {
    #[serde(rename = "mcpServers", default)]
    pub mcp_servers: Map<String, Value>,
    #[serde(flatten)]
    pub other: Map<String, Value>,
}

#[tauri::command]
pub fn sync_to_ide(ide_name: &str, mcp_config: Value) -> Result<(), String> {
    let config_path = match ide_name {
        "cursor" => get_cursor_config_path(),
        "opencode" => get_opencode_config_path(),
        _ => return Err(format!("Unsupported IDE: {}", ide_name)),
    }?;

    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    let mut existing_config: McpConfig = if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        serde_json::from_str(&content).unwrap_or_else(|_| McpConfig {
            mcp_servers: Map::new(),
            other: Map::new(),
        })
    } else {
        McpConfig {
            mcp_servers: Map::new(),
            other: Map::new(),
        }
    };

    if let Some(new_obj) = mcp_config.as_object() {
        for (k, v) in new_obj {
            if k == "mcpServers" {
                if let Some(new_servers) = v.as_object() {
                    for (server_name, server_config) in new_servers {
                        existing_config
                            .mcp_servers
                            .insert(server_name.clone(), server_config.clone());
                    }
                }
            } else {
                existing_config.other.insert(k.clone(), v.clone());
            }
        }
    }

    let json_str = serde_json::to_string_pretty(&existing_config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, json_str).map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(())
}

fn get_cursor_config_path() -> Result<PathBuf, String> {
    let mut path = dirs::home_dir().ok_or("Could not find home directory")?;
    path.push("Library");
    path.push("Application Support");
    path.push("Cursor");
    path.push("User");
    path.push("globalStorage");
    path.push("saoudrizwan.claude-dev");
    path.push("settings");
    path.push("cline_mcp_settings.json");
    Ok(path)
}

fn get_opencode_config_path() -> Result<PathBuf, String> {
    let mut path = dirs::home_dir().ok_or("Could not find home directory")?;
    path.push(".config");
    path.push("opencode");
    path.push("mcp.json");
    Ok(path)
}
