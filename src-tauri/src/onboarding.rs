use crate::fingerprint::calculate_dir_hash;
use crate::skill_manager::{home_dir, read_skills_from_dir, tool_definitions, CENTRAL_SKILLS_DIR};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredSkill {
    pub name: String,
    pub path: String,
    pub original_tool: String,
    pub fingerprint: String,
    pub is_duplicate: bool, // If it matches a skill already in Central Repo
}

#[tauri::command]
pub fn scan_external_skills() -> Result<Vec<DiscoveredSkill>, String> {
    let home = home_dir()?;
    let defs = tool_definitions();
    let mut discovered = Vec::new();
    
    // Get central skills to check duplicates
    let central_path = home.join(CENTRAL_SKILLS_DIR);
    let mut central_fingerprints = HashMap::new();
    
    if central_path.exists() {
         let central_skills = read_skills_from_dir(&central_path, "xskill");
         for skill in central_skills {
             let path = PathBuf::from(&skill.path);
             if let Ok(hash) = calculate_dir_hash(&path) {
                 central_fingerprints.insert(hash, skill.name);
             }
         }
    }

    for def in defs {
        let skills_dir = home.join(def.skills_subdir);
        if !skills_dir.exists() {
            continue;
        }

        let skills = read_skills_from_dir(&skills_dir, def.key);
        for skill in skills {
            let path = PathBuf::from(&skill.path);
            // Skip if path is actually inside central repo (just in case of weird symlinks or config)
            if path.starts_with(&central_path) {
                continue;
            }

            let fingerprint = calculate_dir_hash(&path).unwrap_or_default();
            
            let is_duplicate = central_fingerprints.contains_key(&fingerprint);
            
            discovered.push(DiscoveredSkill {
                name: skill.name,
                path: skill.path,
                original_tool: def.key.to_string(),
                fingerprint,
                is_duplicate,
            });
        }
    }

    Ok(discovered)
}

#[tauri::command]
pub fn import_skills(skills: Vec<DiscoveredSkill>, strategy: String) -> Result<(), String> {
    // strategy: "copy" or "move"
    let home = home_dir()?;
    let central_path = home.join(CENTRAL_SKILLS_DIR);
    
    if !central_path.exists() {
        fs::create_dir_all(&central_path).map_err(|e| e.to_string())?;
    }

    for skill in skills {
        let source_path = PathBuf::from(&skill.path);
        let mut target_name = skill.name.clone();
        let mut target_path = central_path.join(&target_name);

        // Handle naming conflicts by appending _1, _2, etc.
        let mut counter = 1;
        while target_path.exists() {
             target_name = format!("{}_{}", skill.name, counter);
             target_path = central_path.join(&target_name);
             counter += 1;
        }

        // Perform Copy or Move
        if strategy == "move" {
             fs::rename(&source_path, &target_path).map_err(|e| format!("Failed to move {}: {}", skill.name, e))?;
        } else {
             copy_dir_recursive(&source_path, &target_path).map_err(|e| format!("Failed to copy {}: {}", skill.name, e))?;
        }
    }

    Ok(())
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        
        // Skip .git
        if src_path.file_name().and_then(|n| n.to_str()) == Some(".git") {
            continue;
        }

        let dst_path = dst.join(entry.file_name());

        if ty.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

