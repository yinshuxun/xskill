use std::path::Path;
use std::process::Command;
use crate::skill_manager::CENTRAL_SKILLS_DIR;

#[tauri::command]
pub fn install_skill_from_url(repo_url: String) -> Result<String, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let hub_path = home.join(CENTRAL_SKILLS_DIR);
    
    // Create hub directory if it doesn't exist
    if !hub_path.exists() {
        std::fs::create_dir_all(&hub_path).map_err(|e| e.to_string())?;
    }
    
    // Extract name from URL
    // e.g. https://github.com/OthmanAdi/planning-with-files -> planning-with-files
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
    
    // Reuse clone_skill logic by calling it directly
    // Since clone_skill is a command, we can just call the underlying logic if we extract it,
    // or just reimplement the Command call here for simplicity since clone_skill takes ownership of strings.
    // Actually clone_skill is public, so we can call it.
    clone_skill(repo_url, target_dir_str.clone())?;
    
    Ok(target_dir_str)
}

#[tauri::command]
pub fn clone_skill(repo_url: String, target_dir: String) -> Result<(), String> {
    let target_path = Path::new(&target_dir);


    if let Some(parent) = target_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }

    let output = Command::new("git")
        .args(["clone", &repo_url, &target_dir])
        .output()
        .map_err(|e| format!("Failed to execute git clone: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git clone failed: {}", stderr.trim()));
    }

    Ok(())
}

#[tauri::command]
pub fn update_skill(skill_dir: String) -> Result<(), String> {
    let skill_path = Path::new(&skill_dir);

    if !skill_path.exists() {
        return Err(format!(
            "Directory does not exist: {}",
            skill_dir
        ));
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
