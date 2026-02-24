use sha2::{Digest, Sha256};
use std::fs;
use std::io;
use std::path::Path;
use walkdir::WalkDir;

const IGNORED_DIRS: &[&str] = &[".git", "node_modules", "dist", "target", "build", ".idea", ".vscode"];

pub fn calculate_dir_hash(root_path: &Path) -> Result<String, String> {
    let mut hasher = Sha256::new();
    let mut files = Vec::new();

    // First, collect and filter files
    for entry in WalkDir::new(root_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        
        // Skip directories and check ignore list
        if path.is_dir() {
            continue;
        }

        let mut should_ignore = false;
        // Check if any component of the path is in IGNORED_DIRS
        for component in path.components() {
            if let Some(comp_str) = component.as_os_str().to_str() {
                if IGNORED_DIRS.contains(&comp_str) {
                    should_ignore = true;
                    break;
                }
            }
        }
        
        if !should_ignore {
            files.push(path.to_path_buf());
        }
    }

    // Sort files by path to ensure deterministic order
    files.sort();

    for path in files {
        // Hash the relative path to ensure structure is part of the fingerprint
        if let Ok(relative_path) = path.strip_prefix(root_path) {
             hasher.update(relative_path.to_string_lossy().as_bytes());
        } else {
             hasher.update(path.file_name().unwrap_or_default().as_encoded_bytes());
        }

        // Hash the content
        let mut file = fs::File::open(&path).map_err(|e| e.to_string())?;
        io::copy(&mut file, &mut hasher).map_err(|e| e.to_string())?;
    }

    let result = hasher.finalize();
    Ok(format!("{:x}", result))
}
