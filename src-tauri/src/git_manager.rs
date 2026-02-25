use std::path::Path;
use std::process::Command;
use crate::skill_manager::CENTRAL_SKILLS_DIR;
use tauri::{Emitter, Window};

pub fn parse_github_tree_url(url: &str) -> Option<(String, String, String)> {
    if let Some(pos) = url.find("/tree/") {
        let repo_url = url[..pos].to_string();
        let rest = &url[pos + 6..];
        if let Some(slash_pos) = rest.find('/') {
            let branch = rest[..slash_pos].to_string();
            let sub_path = rest[slash_pos + 1..].to_string();
            return Some((repo_url, branch, sub_path));
        }
    }
    None
}

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

    // Check if it's a GitHub subdirectory URL
    if let Some((base_repo, branch, subpath)) = parse_github_tree_url(repo_url) {
        progress(format!("Detected subdirectory. Cloning {} (branch: {}, path: {})...", base_repo, branch, subpath));
        
        let temp_dir = std::env::temp_dir().join(format!("xskill_clone_{}", uuid::Uuid::new_v4()));
        
        // 1. Clone sparse
        let output = Command::new("git")
            .args(["clone", "-n", "--depth=1", "--filter=tree:0", &base_repo, temp_dir.to_str().unwrap()])
            .output()
            .map_err(|e| format!("Failed to execute git clone: {}", e))?;

        if !output.status.success() {
            // Fallback for older git without --filter=tree:0
            let output_fallback = Command::new("git")
                .args(["clone", "-n", "--depth=1", &base_repo, temp_dir.to_str().unwrap()])
                .output()
                .map_err(|e| format!("Failed to execute git clone fallback: {}", e))?;
                
            if !output_fallback.status.success() {
                return Err(format!("git clone failed: {}", String::from_utf8_lossy(&output_fallback.stderr)));
            }
        }

        // 2. Sparse checkout
        let output2 = Command::new("git")
            .args(["sparse-checkout", "set", "--no-cone", &subpath])
            .current_dir(&temp_dir)
            .output()
            .map_err(|e| format!("Failed to execute git sparse-checkout: {}", e))?;
            
        if !output2.status.success() {
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err(format!("git sparse-checkout failed: {}", String::from_utf8_lossy(&output2.stderr)));
        }

        // 3. Checkout branch
        let output3 = Command::new("git")
            .args(["checkout", &branch])
            .current_dir(&temp_dir)
            .output()
            .map_err(|e| format!("Failed to execute git checkout: {}", e))?;
            
        if !output3.status.success() {
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err(format!("git checkout failed: {}", String::from_utf8_lossy(&output3.stderr)));
        }

        // 4. Move contents to target_dir using utils::copy_dir_all
        let src_dir = temp_dir.join(&subpath);
        if !src_dir.exists() {
            let _ = std::fs::remove_dir_all(&temp_dir);
            return Err(format!("Subdirectory {} not found in repository", subpath));
        }

        crate::utils::copy_dir_all(&src_dir, &target_path.to_path_buf())?;
        let _ = std::fs::remove_dir_all(&temp_dir);
        
        progress("Subdirectory clone successful!".to_string());
        return Ok(());
    }

    // Normal clone
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
