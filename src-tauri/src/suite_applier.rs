use crate::suite_manager::Suite;
use crate::skill_manager::{CENTRAL_SKILLS_DIR, tool_definitions};
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn apply_suite(project_path: String, suite: Suite, agent: Option<String>, mode: Option<String>) -> Result<(), String> {
    let proj_dir = PathBuf::from(&project_path);
    if !proj_dir.exists() || !proj_dir.is_dir() {
        return Err(format!("Invalid project directory: {}", project_path));
    }

    // Write AGENTS.md
    if !suite.policy_rules.trim().is_empty() {
        let agents_md_path = proj_dir.join("AGENTS.md");
        fs::write(&agents_md_path, &suite.policy_rules)
            .map_err(|e| format!("Failed to write AGENTS.md: {}", e))?;
    }

    // Sync skills to agent-specific skills directory
    if !suite.loadout_skills.is_empty() {
        let agent_key = agent.unwrap_or_else(|| "cursor".to_string());
        
        let defs = tool_definitions();
        let target_subdir = defs.iter()
            .find(|d| d.key == agent_key)
            .map(|d| d.skills_subdir)
            .unwrap_or(".cursor/skills"); // Default fallback

        let target_skills_dir = proj_dir.join(target_subdir);
        
        // Only create the parent directory of target_skills_dir if we are actually copying skills
        // But here we might want to create the skills dir itself.
        // Wait, if target_subdir is ".claude/skills", we want project/.claude/skills to exist.
        if !target_skills_dir.exists() {
            fs::create_dir_all(&target_skills_dir)
                .map_err(|e| format!("Failed to create skills directory {}: {}", target_skills_dir.display(), e))?;
        }

        let home = crate::utils::get_home_dir().ok_or("Could not find home directory")?;
        let central_skills_dir = home.join(CENTRAL_SKILLS_DIR);

        for skill_id in suite.loadout_skills {
            // skill_id might be "My Skill", but the directory is "my-skill". 
            // We need to resolve the correct directory name from the skill ID/Name.
            // Since suite.loadout_skills currently stores names, we should try to find the directory.
            
            // Try direct match first
            let mut src_skill_dir = central_skills_dir.join(&skill_id);
            
            if !src_skill_dir.exists() {
                // Try finding by SKILL.md name content if directory doesn't match
                // Or maybe the skill_id passed from frontend IS the directory name?
                // In SuitesPage.tsx: const skillId = skill.name; -> skill.name from get_all_local_skills
                // In skill_manager.rs: LocalSkill.name comes from SKILL.md "name" field.
                // But the directory name might be different.
                
                // We need to scan Hub to find the directory that contains the skill with this name.
                if let Ok(entries) = fs::read_dir(&central_skills_dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() {
                            // Check SKILL.md
                            if let Ok(content) = fs::read_to_string(path.join("SKILL.md")) {
                                if content.contains(&format!("name: {}", skill_id)) || 
                                   content.contains(&format!("name: \"{}\"", skill_id)) {
                                    src_skill_dir = path;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            if src_skill_dir.exists() && src_skill_dir.is_dir() {
                let dir_name = src_skill_dir.file_name().unwrap_or_default();
                let dest_skill_dir = target_skills_dir.join(dir_name);
                
                println!("Applying skill: {:?} -> {:?}", src_skill_dir, dest_skill_dir);

                if mode.as_deref() == Some("link") {
                    if let Err(e) = crate::utils::symlink_dir(&src_skill_dir, &dest_skill_dir) {
                        eprintln!("Failed to link skill {}: {}", skill_id, e);
                    }
                } else {
                    if let Err(e) = crate::utils::copy_dir_all(&src_skill_dir, &dest_skill_dir) {
                        eprintln!("Failed to copy skill {}: {}", skill_id, e);
                        // Cleanup on failure if we created an empty directory
                        if dest_skill_dir.exists() {
                            let _ = fs::remove_dir_all(&dest_skill_dir);
                        }
                    }
                }
            } else {
                eprintln!("Source skill not found: {} (checked {:?})", skill_id, src_skill_dir);
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn apply_suite_to_agent(suite: Suite, agent: String, mode: Option<String>) -> Result<(), String> {
    let home = crate::utils::get_home_dir().ok_or("Could not find home directory")?;
    let central_skills_dir = home.join(CENTRAL_SKILLS_DIR);
    
    for skill_id in suite.loadout_skills {
        let src_skill_dir = central_skills_dir.join(&skill_id);
        if src_skill_dir.exists() {
             crate::ide_sync::sync_skill(
                 src_skill_dir.to_string_lossy().to_string(),
                 vec![agent.clone()],
                 mode.clone()
             ).map_err(|e| format!("Failed to sync skill {}: {}", skill_id, e))?;
        }
    }
    Ok(())
}
