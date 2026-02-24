use std::path::Path;
use std::process::Command;

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
