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
        
        if !target_skills_dir.exists() {
            fs::create_dir_all(&target_skills_dir)
                .map_err(|e| format!("Failed to create skills directory {}: {}", target_skills_dir.display(), e))?;
        }

        let home = crate::utils::get_home_dir().ok_or("Could not find home directory")?;
        let central_skills_dir = home.join(CENTRAL_SKILLS_DIR);

        for skill_id in suite.loadout_skills {
            let src_skill_dir = central_skills_dir.join(&skill_id);
            if src_skill_dir.exists() && src_skill_dir.is_dir() {
                let dest_skill_dir = target_skills_dir.join(&skill_id);
                
                if mode.as_deref() == Some("link") {
                    crate::utils::symlink_dir(&src_skill_dir, &dest_skill_dir)?;
                } else {
                    crate::utils::copy_dir_all(&src_skill_dir, &dest_skill_dir)?;
                }
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
