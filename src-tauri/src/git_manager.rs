use std::path::Path;
use std::process::Command;
use crate::skill_manager::CENTRAL_SKILLS_DIR;
use tauri::{Emitter, Window};

pub async fn core_install_skill_from_url<F>(repo_url: &str, mut progress: F) -> Result<String, String>
where
    F: FnMut(String),
{
    let home = crate::utils::get_home_dir().ok_or("Could not find home directory")?;
    let hub_path = home.join(CENTRAL_SKILLS_DIR);
    
    if !hub_path.exists() {
        std::fs::create_dir_all(&hub_path).map_err(|e| e.to_string())?;
    }
    
    progress("Analyzing repository URL...".to_string());

    let name = repo_url.trim_end_matches('/').split('/').last()
        .ok_or("Invalid URL")?
        .trim_end_matches(".git");
        
    if name.is_empty() {
        return Err("Could not determine repo name from URL".to_string());
    }

    let target_dir = hub_path.join(name);
    let target_dir_str = target_dir.to_string_lossy().to_string();
    
    if target_dir.exists() {
        return Err(format!("Skill '{}' already exists in Hub", name));
    }
    
    core_clone_skill(repo_url, &target_dir_str, progress).await?;
    
    Ok(target_dir_str)
}

pub async fn core_clone_skill<F>(repo_url: &str, target_dir: &str, mut progress: F) -> Result<(), String>
where
    F: FnMut(String),
{
    let target_path = Path::new(target_dir);

    progress(format!("Preparing directory: {}...", target_dir));

    if let Some(parent) = target_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }

    progress(format!("Cloning {}...", repo_url));
    
    let output = Command::new("git")
        .args(["clone", repo_url, target_dir])
        .output()
        .map_err(|e| format!("Failed to execute git clone: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git clone failed: {}", stderr.trim()));
    }

    progress("Clone successful!".to_string());

    Ok(())
}

#[tauri::command]
pub async fn install_skill_from_url(window: Window, repo_url: String) -> Result<String, String> {
    core_install_skill_from_url(&repo_url, |msg| {
        let _ = window.emit("import-progress", msg);
    }).await
}

#[tauri::command]
pub async fn clone_skill(window: Window, repo_url: String, target_dir: String) -> Result<(), String> {
    core_clone_skill(&repo_url, &target_dir, |msg| {
        let _ = window.emit("import-progress", msg);
    }).await
}

#[tauri::command]
pub async fn update_skill(skill_dir: String) -> Result<(), String> {
    let skill_path = Path::new(&skill_dir);

    if !skill_path.exists() {
        return Err(format!("Directory does not exist: {}", skill_dir));
    }

    let output = Command::new("git")
        .args(["pull", "--ff-only"])
        .current_dir(skill_path)
        .output()
        .map_err(|e| format!("Failed to execute git pull: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git pull failed: {}", stderr.trim()));
    }

    Ok(())
}
