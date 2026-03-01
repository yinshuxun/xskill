use std::path::PathBuf;
use std::fs;
use walkdir::WalkDir;

/// Create a symlink at `dst` pointing to `src`.
/// On macOS/Linux uses `std::os::unix::fs::symlink`.
#[cfg(unix)]
pub fn symlink_dir(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    if dst.exists() || dst.is_symlink() {
        fs::remove_file(dst)
            .or_else(|_| fs::remove_dir_all(dst))
            .map_err(|e| format!("Failed to remove existing target {}: {}", dst.display(), e))?;
    }
    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent dir {}: {}", parent.display(), e))?;
    }
    std::os::unix::fs::symlink(src, dst)
        .map_err(|e| format!("Failed to create symlink {} -> {}: {}", dst.display(), src.display(), e))
}

#[cfg(not(unix))]
pub fn symlink_dir(_src: &PathBuf, _dst: &PathBuf) -> Result<(), String> {
    Err("Symlink mode is only supported on macOS/Linux".to_string())
}

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

    const IGNORED_DIRS: &[&str] = &["node_modules", "dist", "target", "build", ".idea", ".vscode", ".cursor", ".claude", ".codeium", ".gemini", ".copilot", ".config", ".kode", ".roo", ".kilocode", ".clawdbot", ".factory", ".qoder", ".mastracode", ".continue", ".opencode", ".adal", ".codex", ".openclaw", ".claude-plugin", ".agent", ".kiro", ".codebuddy", ".pi"];

    for entry in WalkDir::new(src).min_depth(1).follow_links(false) {
        let entry = entry.map_err(|e| format!("Walk error: {}", e))?;
        
        let path = entry.path();
        
        let relative = path.strip_prefix(src)
            .map_err(|e| format!("Strip prefix error: {}", e))?;
            
        // Check if relative path or any parent is inside an ignored directory
        let should_ignore = relative.to_string_lossy().split('/')
            .any(|component| IGNORED_DIRS.contains(&component));
        
        if should_ignore {
            continue;
        }
        
        let dest_path = dst.join(relative);

        if path.is_dir() {
            fs::create_dir_all(&dest_path)
                .map_err(|e| format!("Failed to create dir {}: {}", dest_path.display(), e))?;
        } else if path.is_file() {
            // Check if source file exists before copying
            if !path.exists() {
                continue;
            }

            fs::copy(path, &dest_path)
                .map_err(|e| format!("Failed to copy {}: {}", path.display(), e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| format!("Failed to open folder: {}", e))
}

pub fn get_system_proxy() -> Option<String> {
    if cfg!(target_os = "macos") {
        let output = std::process::Command::new("scutil")
            .arg("--proxy")
            .output()
            .ok()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        
        // Simple parsing for HTTP proxy
        // Looking for "HTTPEnable : 1"
        let http_enabled = stdout.contains("HTTPEnable : 1");
        let https_enabled = stdout.contains("HTTPSEnable : 1");
        
        if http_enabled || https_enabled {
            let mut http_host = String::new();
            let mut http_port = String::new();
            let mut https_host = String::new();
            let mut https_port = String::new();
            
            for line in stdout.lines() {
                let line = line.trim();
                // Match "HTTPProxy : 127.0.0.1"
                if line.starts_with("HTTPProxy :") {
                    if let Some(val) = line.split(':').nth(1) {
                        http_host = val.trim().to_string();
                    }
                }
                // Match "HTTPPort : 7890"
                if line.starts_with("HTTPPort :") {
                    if let Some(val) = line.split(':').nth(1) {
                        http_port = val.trim().to_string();
                    }
                }
                // Match "HTTPSProxy : 127.0.0.1"
                if line.starts_with("HTTPSProxy :") {
                    if let Some(val) = line.split(':').nth(1) {
                        https_host = val.trim().to_string();
                    }
                }
                // Match "HTTPSPort : 7890"
                if line.starts_with("HTTPSPort :") {
                    if let Some(val) = line.split(':').nth(1) {
                        https_port = val.trim().to_string();
                    }
                }
            }
            
            // Prefer HTTPS proxy if enabled, fallback to HTTP
            if https_enabled && !https_host.is_empty() && !https_port.is_empty() {
                return Some(format!("http://{}:{}", https_host, https_port));
            }
            if http_enabled && !http_host.is_empty() && !http_port.is_empty() {
                return Some(format!("http://{}:{}", http_host, http_port));
            }
        }
    }
    None
}
