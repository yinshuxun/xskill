#[cfg(test)]
mod tests {
    use std::env;
    use std::fs;
    use std::path::PathBuf;
    use tempfile::TempDir;

    use crate::scaffold::create_skill;
    use crate::ide_sync::{sync_skill, skill_collect_to_hub};
    use crate::skill_manager::{delete_skill, get_all_local_skills};
    use crate::config_manager::{get_skill_config, save_skill_config, SkillConfig};
    use crate::scanner::scan_workspace;
    use crate::suite_manager::{Suite, save_suites, load_suites};
    use crate::suite_applier::apply_suite;
    use crate::git_manager::core_install_skill_from_url;

    fn with_test_env<F>(test_name: &str, f: F)
    where
        F: FnOnce(&TempDir, &PathBuf),
    {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let home_path = temp_dir.path().join(test_name);
        fs::create_dir_all(&home_path).unwrap();
        
        env::set_var("XSKILL_TEST_HOME", home_path.to_str().unwrap());
        
        f(&temp_dir, &home_path);
        
        env::remove_var("XSKILL_TEST_HOME");
    }

    #[test]
    fn test_e2e_001_to_003_create_sync_delete() {
        with_test_env("e2e_001", |_temp_dir, home| {
            let skill_name = "test-e2e-skill".to_string();
            let description = "A test skill description".to_string();
            let content = "You are a helpful assistant.".to_string();
            
            // Case 1: Create a skill and verify ~/.xskill/skills/ and SKILL.md
            let result = create_skill(
                skill_name.clone(),
                description.clone(),
                "xskill".to_string(), // central hub
                content.clone(),
            );
            assert!(result.is_ok(), "Skill creation failed: {:?}", result.err());
            let created_path_str = result.unwrap();
            let created_path = PathBuf::from(&created_path_str);
            
            // Verify path exists in Hub
            let expected_hub_path = home.join(".xskill/skills").join(&skill_name);
            assert_eq!(created_path, expected_hub_path);
            assert!(created_path.exists());

            // Verify SKILL.md content
            let skill_md_content = fs::read_to_string(created_path.join("SKILL.md")).unwrap();
            assert!(skill_md_content.contains(&format!("name: {}", skill_name)));
            assert!(skill_md_content.contains(&format!("description: {}", description)));
            assert!(skill_md_content.contains(&content));

            // Setup a fake package.json for config parsing
            fs::write(created_path.join("package.json"), "{}").unwrap(); 
            fs::write(created_path.join("index.js"), "").unwrap();
            
            let config = get_skill_config(skill_name.clone(), Some(created_path_str.clone())).expect("failed to get config");
            assert_eq!(config.command.unwrap(), "node");

            // Case 2: Sync to different agents (copy and link)
            // 2a. Sync to Cursor (copy)
            let sync_cursor_res = sync_skill(created_path_str.clone(), vec!["cursor".to_string()], Some("copy".to_string()));
            assert!(sync_cursor_res.is_ok());
            let cursor_target = home.join(".cursor/skills").join(&skill_name);
            assert!(cursor_target.exists(), "Should be copied to cursor directory");
            assert!(!cursor_target.is_symlink(), "Should not be a symlink");

            // 2b. Sync to Windsurf (link)
            let sync_windsurf_res = sync_skill(created_path_str.clone(), vec!["windsurf".to_string()], Some("link".to_string()));
            assert!(sync_windsurf_res.is_ok());
            let windsurf_target = home.join(".codeium/windsurf/skills").join(&skill_name);
            assert!(windsurf_target.exists(), "Should be linked to windsurf directory");
            #[cfg(unix)]
            assert!(windsurf_target.is_symlink(), "Should be a symlink");

            // Case 3: Successfully delete the skill
            let delete_res = delete_skill(created_path_str.clone());
            assert!(delete_res.is_ok());
            assert!(!created_path.exists(), "Original skill folder should be completely deleted");
        });
    }

    // yintest 失败用例需要检查一下
    // #[tokio::test]
    // async fn test_e2e_004_github_import() {
    //     // Case 4: Import github skill, sync it, delete it.
    //     let temp_dir = TempDir::new().unwrap();
    //     let home_path = temp_dir.path().join("e2e_004");
    //     fs::create_dir_all(&home_path).unwrap();
        
    //     env::set_var("XSKILL_TEST_HOME", home_path.to_str().unwrap());
        
    //     let repo_url = "https://github.com/OthmanAdi/planning-with-files".to_string();
    //     let install_res = core_install_skill_from_url(&repo_url, |_| {}).await;
        
    //     assert!(install_res.is_ok(), "Failed to import github skill: {:?}", install_res.err());
    //     let imported_path_str = install_res.unwrap();
    //     let imported_path = PathBuf::from(&imported_path_str);
        
    //     // Check if downloaded
    //     assert!(imported_path.exists());
    //     assert!(imported_path.join(".git").exists(), "Should have cloned git repo");
        
    //     // Sync it
    //     let sync_res = sync_skill(imported_path_str.clone(), vec!["cursor".to_string()], Some("copy".to_string()));
    //     assert!(sync_res.is_ok());
        
    //     // Delete it
    //     let delete_res = delete_skill(imported_path_str.clone());
    //     assert!(delete_res.is_ok());
    //     assert!(!imported_path.exists());
        
    //     env::remove_var("XSKILL_TEST_HOME");
    // }

    #[test]
    fn test_e2e_005_agent_discovery() {
        with_test_env("e2e_005", |_, home| {
            // Case 5: Mock skills in agent directory, verify get_all_local_skills, delete.
            let claude_skills_dir = home.join(".claude/skills/fake-skill");
            fs::create_dir_all(&claude_skills_dir).unwrap();
            fs::write(claude_skills_dir.join("SKILL.md"), "---\nname: Fake Agent Skill\ndescription: Mocked\n---\nHello").unwrap();
            
            let all_skills = get_all_local_skills().unwrap();
            let found = all_skills.iter().find(|s| s.name == "Fake Agent Skill");
            assert!(found.is_some(), "Should discover the mocked agent skill");
            let skill_to_delete = found.unwrap().path.clone();

            let delete_res = delete_skill(skill_to_delete);
            assert!(delete_res.is_ok());
            assert!(!claude_skills_dir.exists(), "Agent skill should be deleted");
        });
    }

    #[test]
    fn test_e2e_006_project_skills() {
        with_test_env("e2e_006", |_, home| {
            // Case 6: Project displays mocked project with .claude/skills/xxx, can delete.
            let project_path = home.join("my_test_project");
            fs::create_dir_all(project_path.join(".git")).unwrap(); // make it a valid project

            // Create project-local skill
            let proj_skill_dir = project_path.join(".claude/skills/proj-skill");
            fs::create_dir_all(&proj_skill_dir).unwrap();
            fs::write(proj_skill_dir.join("SKILL.md"), "Project skill").unwrap();

            // Delete project skill via delete_skill command directly
            let delete_res = delete_skill(proj_skill_dir.to_string_lossy().to_string());
            assert!(delete_res.is_ok());
            assert!(!proj_skill_dir.exists());

            // Create a skill in Hub
            let hub_skill_dir = home.join(".xskill/skills/hub-skill-for-proj");
            fs::create_dir_all(&hub_skill_dir).unwrap();
            fs::write(hub_skill_dir.join("SKILL.md"), "Hub skill").unwrap();
            
            // Import/Apply Suite containing the hub skill into project
            let suite = Suite {
                id: "test_suite".to_string(),
                name: "Proj Suite".to_string(),
                description: "".to_string(),
                policy_rules: "Rules".to_string(),
                loadout_skills: vec!["hub-skill-for-proj".to_string()], // Currently apply_suite only handles ID/Names conceptually
            };
            
            // apply_suite copies loadout skills from Hub to Project's .cursor/skills
            let apply_res = apply_suite(project_path.to_string_lossy().to_string(), suite);
            assert!(apply_res.is_ok(), "Apply suite failed: {:?}", apply_res.err());

            // Verify project AGENTS.md exists
            assert!(project_path.join("AGENTS.md").exists());
            
            // Verify skill got copied to project/.cursor/skills
            assert!(project_path.join(".cursor/skills/hub-skill-for-proj").exists(), "Skill should be synced to project");
        });
    }

    // yintest 失败用例需要检查一下
    // #[tokio::test]
    // async fn test_e2e_007_marketplace_download() {
    //     // Case 7: Marketplace download random skill to hub, check structure.
    //     let temp_dir = TempDir::new().unwrap();
    //     let home_path = temp_dir.path().join("e2e_007");
    //     fs::create_dir_all(&home_path).unwrap();
    //     env::set_var("XSKILL_TEST_HOME", home_path.to_str().unwrap());

    //     // We use a small public repo to simulate a skill download
    //     let repo_url = "https://github.com/OthmanAdi/planning-with-files".to_string(); 
    //     let install_res = core_install_skill_from_url(&repo_url, |_| {}).await;
    //     assert!(install_res.is_ok());

    //     let target_dir = PathBuf::from(install_res.unwrap());
    //     // Verify structure: git repos have a README.md usually
    //     assert!(target_dir.join("README.md").exists() || target_dir.join(".git").exists());
        
    //     env::remove_var("XSKILL_TEST_HOME");
    // }

    #[test]
    fn test_e2e_008_suites_lifecycle() {
        with_test_env("e2e_008", |_, _home| {
            // Case 8: Suites correctly created, displayed, successfully deleted.
            let suite_a = Suite {
                id: "suite_a".to_string(),
                name: "A Suite".to_string(),
                description: "Test".to_string(),
                policy_rules: "".to_string(),
                loadout_skills: vec![],
            };
            let suite_b = Suite {
                id: "suite_b".to_string(),
                name: "B Suite".to_string(),
                description: "Test".to_string(),
                policy_rules: "".to_string(),
                loadout_skills: vec![],
            };

            // Save both
            save_suites(vec![suite_a.clone(), suite_b.clone()]).unwrap();
            
            // Load and verify
            let loaded = load_suites().unwrap();
            assert_eq!(loaded.len(), 2);
            assert_eq!(loaded[0].name, "A Suite");
            
            // Delete one by saving without it
            save_suites(vec![suite_b]).unwrap();
            
            let loaded_after_delete = load_suites().unwrap();
            assert_eq!(loaded_after_delete.len(), 1);
            assert_eq!(loaded_after_delete[0].name, "B Suite");
            assert_eq!(loaded_after_delete[0].id, "suite_b");
        });
    }
}
