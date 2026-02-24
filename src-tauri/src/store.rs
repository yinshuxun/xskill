use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "xskill.json";
const KEY_SKILLS: &str = "skills";
const KEY_FEEDS: &str = "feeds";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub desc: String,
    pub skill_type: String,
    pub status: String,
    pub path: Option<String>,
    pub repo_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedEntry {
    pub id: String,
    pub label: String,
    pub url: String,
}

#[tauri::command]
pub fn load_skills(app: AppHandle) -> Result<Vec<Skill>, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let skills: Vec<Skill> = store
        .get(KEY_SKILLS)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(skills)
}

#[tauri::command]
pub fn save_skills(app: AppHandle, skills: Vec<Skill>) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(KEY_SKILLS, serde_json::to_value(&skills).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_feeds(app: AppHandle) -> Result<Vec<FeedEntry>, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let feeds: Vec<FeedEntry> = store
        .get(KEY_FEEDS)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(feeds)
}

#[tauri::command]
pub fn save_feeds(app: AppHandle, feeds: Vec<FeedEntry>) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(KEY_FEEDS, serde_json::to_value(&feeds).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())
}
