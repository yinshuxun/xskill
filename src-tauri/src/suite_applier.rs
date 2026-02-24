use crate::suite_manager::Suite;
use crate::skill_manager::CENTRAL_SKILLS_DIR;
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create dir {}: {}", dst.display(), e))?;

    for entry in WalkDir::new(src).min_depth(1) {
        let entry = entry.map_err(|e| format!("Walk error: {}", e))?;
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
pub fn apply_suite(project_path: String, suite: Suite) -> Result<(), String> {
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

    // Sync skills to .cursor/skills or .agent/skills (we will default to .cursor/skills for now as it's common)
    if !suite.loadout_skills.is_empty() {
        let target_skills_dir = proj_dir.join(".cursor").join("skills");
        if !target_skills_dir.exists() {
            fs::create_dir_all(&target_skills_dir)
                .map_err(|e| format!("Failed to create .cursor/skills directory: {}", e))?;
        }

        let home = dirs::home_dir().ok_or("Could not find home directory")?;
        let central_skills_dir = home.join(CENTRAL_SKILLS_DIR);

        for skill_id in suite.loadout_skills {
            let src_skill_dir = central_skills_dir.join(&skill_id);
            if src_skill_dir.exists() && src_skill_dir.is_dir() {
                let dest_skill_dir = target_skills_dir.join(&skill_id);
                copy_dir_all(&src_skill_dir, &dest_skill_dir)?;
            }
        }
    }

    Ok(())
}
