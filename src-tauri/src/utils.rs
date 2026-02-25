use std::path::PathBuf;
use std::fs;
use walkdir::WalkDir;

pub fn get_home_dir() -> Option<PathBuf> {
    if let Ok(path) = std::env::var("XSKILL_TEST_HOME") {
        return Some(PathBuf::from(path));
    }
    dirs::home_dir()
}

pub fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    if dst.exists() || dst.is_symlink() {
        fs::remove_file(dst)
            .or_else(|_| fs::remove_dir_all(dst))
            .map_err(|e| format!("Failed to remove existing target {}: {}", dst.display(), e))?;
    }
    fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create dir {}: {}", dst.display(), e))?;

    for entry in WalkDir::new(src).min_depth(1) {
        let entry = entry.map_err(|e| format!("Walk error: {}", e))?;
        
        // Skip .git directories
        if entry.path().components().any(|c| c.as_os_str() == ".git") {
            continue;
        }

        let relative = entry.path().strip_prefix(src)
            .map_err(|e| format!("Strip prefix error: {}", e))?;
        let dest_path = dst.join(relative);

        if entry.path().is_dir() {
            fs::create_dir_all(&dest_path)
                .map_err(|e| format!("Failed to create dir {}: {}", dest_path.display(), e))?;
        } else {
            fs::copy(entry.path(), &dest_path)
                .map_err(|e| format!("Failed to copy {}: {}", entry.path().display(), e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| format!("Failed to open folder: {}", e))
}
