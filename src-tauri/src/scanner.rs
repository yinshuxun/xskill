use std::path::{Path, PathBuf};
use walkdir::{DirEntry, WalkDir};
use serde::{Serialize, Deserialize};
use std::fs;

const MAX_DEPTH: usize = 5;
const IGNORED_DIRS: &[&str] = &["node_modules", ".git", "dist", "build", "out", ".next", "target"];

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub path: String,
    pub name: String,
    pub has_git: bool,
    pub has_mcp: bool,
    pub has_agents_md: bool,
}

fn is_hidden(entry: &DirEntry) -> bool {
    entry.file_name()
         .to_str()
         .map(|s| s.starts_with('.') && s != ".git") // Don't ignore .git itself for detection, but we ignore walking *into* it
         .unwrap_or(false)
}

fn is_ignored(entry: &DirEntry) -> bool {
    entry.file_name()
         .to_str()
         .map(|s| IGNORED_DIRS.contains(&s))
         .unwrap_or(false)
}

pub fn scan_roots(roots: Vec<PathBuf>) -> Vec<Project> {
    let mut projects = Vec::new();

    for root in roots {
        if !root.exists() {
            continue;
        }

        let walker = WalkDir::new(&root)
            .max_depth(MAX_DEPTH)
            .into_iter();

        for entry in walker.filter_entry(|e| !is_hidden(e) && !is_ignored(e)) {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };

            if entry.file_type().is_dir() {
                let path = entry.path();
                
                // Check for .git
                let git_path = path.join(".git");
                if git_path.exists() {
                    let has_git = true;
                    let has_mcp = check_for_mcp(path);
                    let has_agents_md = path.join("AGENTS.md").exists();

                    projects.push(Project {
                        path: path.to_string_lossy().to_string(),
                        name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                        has_git,
                        has_mcp,
                        has_agents_md,
                    });
                }
            }
        }
    }
    
    // Sort projects by name
    projects.sort_by(|a, b| a.name.cmp(&b.name));
    projects
}

fn check_for_mcp(path: &Path) -> bool {
    if path.join("mcp.json").exists() {
        return true;
    }
    
    let package_json = path.join("package.json");
    if package_json.exists() {
        if let Ok(content) = fs::read_to_string(package_json) {
            if content.contains("mcp") || content.contains("model context protocol") {
                return true;
            }
        }
    }
    
    false
}

#[tauri::command]
pub fn scan_workspace(extra_roots: Option<Vec<String>>) -> Result<Vec<Project>, String> {
    let mut roots = Vec::new();
    
    // Add default roots
    if let Some(home) = dirs::home_dir() {
        roots.push(home.join("workspace"));
        roots.push(home.join("projects"));
        roots.push(home.join("codes"));
        roots.push(home.join("dev"));
    }
    
    // Add extra roots if provided
    if let Some(extras) = extra_roots {
        for r in extras {
            roots.push(PathBuf::from(r));
        }
    }

    Ok(scan_roots(roots))
}
