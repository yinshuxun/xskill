#[cfg(test)]
mod tests {
    use std::env;
    use std::fs;
    use std::path::PathBuf;
    use tempfile::TempDir;
    use std::collections::HashMap;

    use crate::scaffold::create_skill;
    use crate::ide_sync::{sync_skill, skill_collect_to_hub};
    use crate::skill_manager::{delete_skill, get_all_local_skills};
    use crate::config_manager::{get_skill_config, save_skill_config, SkillConfig};
    use crate::suite_manager::{Suite, load_suites, save_suites};
    use crate::suite_applier::{apply_suite, apply_suite_to_agent};
    use crate::git_manager::core_install_skill_from_url;
    use crate::onboarding::{scan_external_skills, import_skills};
    use crate::skill_manager::get_project_skills;
    use crate::scanner::scan_workspace;
    use crate::test_logger::TestLogger;

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
    fn test_e2e_016_project_agent_md_discovery() {
        with_test_env("e2e_016", |_, home| {
            // Setup project structure
            let project_path = home.join("project-with-agent-md");
            fs::create_dir_all(&project_path).unwrap();

            // 1. Create a skill deeply nested with AGENT.md
            let nested_skill_dir = project_path.join("src/features/my-agent");
            fs::create_dir_all(&nested_skill_dir).unwrap();
            fs::write(nested_skill_dir.join("AGENT.md"), "---\nname: my-agent-skill\ndescription: Discovered via AGENT.md\n---\nAgent Content").unwrap();

            // 2. Create another skill with SKILL.md in a custom folder
            let custom_skill_dir = project_path.join("custom-skills/my-skill");
            fs::create_dir_all(&custom_skill_dir).unwrap();
            fs::write(custom_skill_dir.join("SKILL.md"), "---\nname: my-custom-skill\ndescription: Discovered via SKILL.md\n---\nSkill Content").unwrap();

            // 3. Create a skill inside an ignored directory (should NOT be discovered)
            let ignored_skill_dir = project_path.join("node_modules/ignored-skill");
            fs::create_dir_all(&ignored_skill_dir).unwrap();
            fs::write(ignored_skill_dir.join("AGENT.md"), "Should be ignored").unwrap();

            // Scan project skills
            let skills = get_project_skills(project_path.to_string_lossy().to_string()).unwrap();

            // Verify
            assert!(skills.iter().any(|s| s.name == "my-agent-skill"), "Should discover my-agent-skill via AGENT.md");
            assert!(skills.iter().any(|s| s.name == "my-custom-skill"), "Should discover my-custom-skill via SKILL.md");
            assert!(!skills.iter().any(|s| s.path.contains("node_modules")), "Should NOT discover skills in node_modules");

            let agent_skill = skills.iter().find(|s| s.name == "my-agent-skill").unwrap();
            assert_eq!(agent_skill.description, "Discovered via AGENT.md");
            assert_eq!(agent_skill.path, nested_skill_dir.to_string_lossy().to_string());
        });
    }

    #[test]
    fn test_e2e_017_quoted_skill_metadata() {
        with_test_env("e2e_017", |_, home| {
            // Case 17: Skill metadata with quotes should be parsed correctly
            let skill_dir = home.join(".xskill/skills/quoted-skill");
            fs::create_dir_all(&skill_dir).unwrap();
            
            // Write SKILL.md with quoted values
            let content = r#"---
name: "quoted-name"
description: 'quoted description'
---
Content"#;
            fs::write(skill_dir.join("SKILL.md"), content).unwrap();

            // Verify parsing
            let skills = get_all_local_skills().unwrap();
            let skill = skills.iter().find(|s| s.path.contains("quoted-skill")).expect("Should find quoted skill");
            
            assert_eq!(skill.name, "quoted-name", "Should strip double quotes from name");
            assert_eq!(skill.description, "quoted description", "Should strip single quotes from description");
            
            // Verify sync works with this skill (simulating CLI behavior by passing path)
            let sync_res = sync_skill(skill.path.clone(), vec!["cursor".to_string()], Some("copy".to_string()));
            assert!(sync_res.is_ok(), "Should sync successfully with clean name");
            
            // Verify target directory name is clean
            let cursor_skill = home.join(".cursor/skills/quoted-name"); // Name from metadata is used for destination?
            // Wait, sync_skill uses src.file_name() as destination name, NOT metadata name.
            // Let's check sync_skill implementation again.
            // "let skill_name = src.file_name()...to_string();"
            // So if directory is "quoted-skill", destination will be "quoted-skill".
            // The metadata name is only for display/ID.
            
            let dest_dir = home.join(".cursor/skills/quoted-skill");
            assert!(dest_dir.exists(), "Should sync to directory matching source folder name");
        });
    }

    fn run_test_with_logging<F>(test_name: &str, f: F)
    where
        F: FnOnce(&mut TestLogger),
    {
        let mut logger = TestLogger::new(test_name);
        logger.log_step("Test started");
        f(&mut logger);
        logger.log_step("Test completed");
        logger.save_report();
    }

    fn with_test_env_and_logging<F>(test_name: &str, f: F)
    where
        F: FnOnce(&TempDir, &PathBuf, &mut TestLogger),
    {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let home_path = temp_dir.path().join(test_name);
        fs::create_dir_all(&home_path).unwrap();
        
        env::set_var("XSKILL_TEST_HOME", home_path.to_str().unwrap());
        
        let mut logger = TestLogger::new(test_name);
        logger.log_step("Test started");
        
        f(&temp_dir, &home_path, &mut logger);
        
        logger.log_step("Test completed");
        logger.save_report();
        
        env::remove_var("XSKILL_TEST_HOME");
    }

    #[test]
    fn test_e2e_001_to_003_create_sync_delete() {
        run_test_with_logging("e2e_001_create_sync_delete", |logger| {
            logger.log_step("Initializing test environment");
            
            let skill_name = "test-e2e-skill".to_string();
            let description = "A test skill description".to_string();
            let content = "You are a helpful assistant.".to_string();
            
            // Case 1: Create a skill and verify ~/.xskill/skills/ and SKILL.md
            logger.log_step(&format!("Creating skill: {}", skill_name));
            let result = create_skill(
                skill_name.clone(),
                description.clone(),
                "xskill".to_string(), // central hub
                content.clone(),
                None,
                None,
                None,
            );
            assert!(result.is_ok(), "Skill creation failed: {:?}", result.err());
            let created_path_str = result.unwrap();
            let created_path = PathBuf::from(&created_path_str);
            logger.log_success(&format!("Skill created at: {:?}", created_path));
            
            // Verify path exists in Hub
            logger.log_step("Verifying skill location in Hub");
            let expected_hub_path = PathBuf::from(&created_path_str).parent().unwrap().join(&skill_name);
            assert_eq!(created_path, expected_hub_path);
            assert!(created_path.exists());
            logger.log_success("Skill exists in Hub directory");
            
            // Verify SKILL.md content
            logger.log_step("Verifying SKILL.md content");
            let skill_md_content = fs::read_to_string(created_path.join("SKILL.md")).unwrap();
            assert!(skill_md_content.contains(&format!("name: {}", skill_name)));
            assert!(skill_md_content.contains(&format!("description: {}", description)));
            assert!(skill_md_content.contains(&content));
            logger.log_success("SKILL.md content verified");
            
            // Setup a fake package.json for config parsing
            logger.log_step("Setting up package.json for config parsing");
            fs::write(created_path.join("package.json"), "{}").unwrap(); 
            fs::write(created_path.join("index.js"), "").unwrap();
            
            let config = get_skill_config(skill_name.clone(), Some(created_path_str.clone())).expect("failed to get config");
            assert_eq!(config.command.unwrap(), "node");
            logger.log_success("Config parsing verified (node command detected)");
            
            // Case 2: Sync to different agents (copy and link)
            // 2a. Sync to Cursor (copy)
            logger.log_step("Syncing skill to Cursor (copy mode)");
            let sync_cursor_res = sync_skill(created_path_str.clone(), vec!["cursor".to_string()], Some("copy".to_string()));
            assert!(sync_cursor_res.is_ok(), "Sync to Cursor failed: {:?}", sync_cursor_res.err());
            let written_paths = sync_cursor_res.unwrap();
            logger.log(&format!("Synced paths: {:?}", written_paths));
            assert!(!written_paths.is_empty(), "No paths were written");
            let cursor_target = PathBuf::from(&written_paths[0]);
            assert!(cursor_target.exists(), "Should be copied to cursor directory");
            assert!(!cursor_target.is_symlink(), "Should not be a symlink");
            logger.log_success("Skill copied to Cursor directory");
            
            // 2b. Sync to Windsurf (link)
            logger.log_step("Syncing skill to Windsurf (link mode)");
            let sync_windsurf_res = sync_skill(created_path_str.clone(), vec!["windsurf".to_string()], Some("link".to_string()));
            assert!(sync_windsurf_res.is_ok(), "Sync to Windsurf failed: {:?}", sync_windsurf_res.err());
            let written_paths = sync_windsurf_res.unwrap();
            logger.log(&format!("Synced paths: {:?}", written_paths));
            assert!(!written_paths.is_empty(), "No paths were written");
            let windsurf_target = PathBuf::from(&written_paths[0]);
            assert!(windsurf_target.exists(), "Should be linked to windsurf directory");
            #[cfg(unix)]
            assert!(windsurf_target.is_symlink(), "Should be a symlink");
            logger.log_success("Skill linked to Windsurf directory");
            
            // Case 3: Successfully delete the skill
            logger.log_step("Deleting skill");
            let delete_res = delete_skill(created_path_str.clone());
            assert!(delete_res.is_ok());
            assert!(!created_path.exists(), "Original skill folder should be completely deleted");
            logger.log_success("Skill deleted successfully");
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
            let apply_res = apply_suite(project_path.to_string_lossy().to_string(), suite, Some("cursor".to_string()), Some("copy".to_string()));
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

    #[test]
    fn test_e2e_005_skill_config_lifecycle() {
        with_test_env_and_logging("e2e_005_skill_config_lifecycle", |_, home, logger| {
            logger.log_step("Initializing skill config test");
            
            // Case 5: Skill config lifecycle - create, get, save, update, delete
            let skill_name = "test-config-skill".to_string();
            let description = "Test skill for config".to_string();
            let content = "You are a helpful assistant.".to_string();
            
            logger.log_step(&format!("Creating skill: {}", skill_name));
            let result = create_skill(
                skill_name.clone(),
                description.clone(),
                "xskill".to_string(),
                content.clone(),
                None,
                None,
                None,
            );
            assert!(result.is_ok());
            let skill_path = result.unwrap();
            let skill_dir = PathBuf::from(&skill_path);
            logger.log_success(&format!("Skill created at: {:?}", skill_dir));
            
            logger.log_step("Getting initial skill config");
            let config = get_skill_config(skill_name.clone(), Some(skill_path.clone())).expect("failed to get config");
            assert_eq!(config.command, None);
            assert_eq!(config.args, None);
            assert_eq!(config.env, None);
            logger.log_success("Initial config verified (no command)");
            
            logger.log_step("Setting up package.json for auto-detection");
            fs::write(skill_dir.join("package.json"), "{}").unwrap();
            fs::write(skill_dir.join("index.js"), "console.log('test');").unwrap();
            
            logger.log_step("Getting config after adding files");
            let config_after =get_skill_config(skill_name.clone(), Some(skill_path.clone())).expect("failed to get config");
            assert_eq!(config_after.command, Some("node".to_string()));
            assert!(config_after.args.is_some());
            logger.log_success("Config auto-detected (node command)");
            
            logger.log_step("Updating skill config");
            let new_config = SkillConfig {
                command: Some("bun".to_string()),
                args: Some(vec!["index.ts".to_string()]),
                env: Some({
                    let mut m = HashMap::new();
                    m.insert("GITHUB_TOKEN".to_string(), "xxx".to_string());
                    m
                }),
            };
            
            let save_result = save_skill_config(skill_name.clone(), new_config.clone());
            assert!(save_result.is_ok());
            logger.log_success("Config saved");
            
            logger.log_step("Loading updated config");
            let loaded_config = get_skill_config(skill_name.clone(), Some(skill_path.clone())).expect("failed to get config");
            assert_eq!(loaded_config.command, Some("bun".to_string()));
            assert_eq!(loaded_config.args, Some(vec!["index.ts".to_string()]));
            assert!(loaded_config.env.is_some());
            assert_eq!(loaded_config.env.unwrap().get("GITHUB_TOKEN"), Some(&"xxx".to_string()));
            logger.log_success("Updated config verified");
            
            logger.log_step("Adding new environment variable");
            let updated_config = SkillConfig {
                command: Some("bun".to_string()),
                args: Some(vec!["index.ts".to_string()]),
                env: Some({
                    let mut m = HashMap::new();
                    m.insert("GITHUB_TOKEN".to_string(), "xxx".to_string());
                    m.insert("NEW_VAR".to_string(), "new_value".to_string());
                    m
                }),
            };
            
            save_skill_config(skill_name.clone(), updated_config).unwrap();
            logger.log_success("New env var added");
            
            logger.log_step("Verifying final config");
            let final_config = get_skill_config(skill_name.clone(), Some(skill_path.clone())).expect("failed to get config");
            assert!(final_config.env.is_some());
            assert_eq!(final_config.env.unwrap().get("NEW_VAR"), Some(&"new_value".to_string()));
            logger.log_success("Final config verified");
            
            logger.log_step("Deleting skill");
            delete_skill(skill_path.clone()).unwrap();
            assert!(!skill_dir.exists());
            logger.log_success("Skill deleted");
        });
    }

    #[test]
    fn test_e2e_006_skill_collect_to_hub() {
        with_test_env("e2e_006", |_, home| {
            // Case 6: Collect skill from agent directory to Hub
            let agent_skills_dir = home.join(".cursor/skills");
            fs::create_dir_all(&agent_skills_dir).unwrap();
            
            let skill_name = "collected-skill".to_string();
            let skill_dir = agent_skills_dir.join(&skill_name);
            fs::create_dir_all(&skill_dir).unwrap();
            fs::write(skill_dir.join("SKILL.md"), "---\nname: Collected Skill\ndescription: Test\n---\nContent").unwrap();
            fs::write(skill_dir.join("package.json"), "{}").unwrap();
            fs::write(skill_dir.join("index.js"), "console.log('test');").unwrap();
            
            let collect_result = skill_collect_to_hub(skill_dir.to_string_lossy().to_string());
            assert!(collect_result.is_ok());
            
            let hub_skill_dir = home.join(".xskill/skills").join(&skill_name);
            assert!(hub_skill_dir.exists());
            assert!(hub_skill_dir.join("SKILL.md").exists());
            assert!(hub_skill_dir.join("package.json").exists());
            assert!(hub_skill_dir.join("index.js").exists());
            
            assert!(skill_dir.exists(), "Original skill should be preserved (collect is copy)");
            
            delete_skill(hub_skill_dir.to_string_lossy().to_string()).unwrap();
            assert!(!hub_skill_dir.exists());
        });
    }

    #[test]
    fn test_e2e_004_github_import() {
        with_test_env("e2e_004", |_, _home| {
            let repo_url = "https://github.com/OthmanAdi/planning-with-files".to_string();
            
            let result = std::thread::spawn(move || {
                tokio::runtime::Runtime::new().unwrap().block_on(async {
                    core_install_skill_from_url(&repo_url, |_| {}).await
                })
            }).join();
            
            assert!(result.is_ok(), "GitHub import failed: {:?}", result.unwrap().err());
            
            let imported_path_str = result.unwrap().unwrap();
            let imported_path = PathBuf::from(&imported_path_str);
            
            assert!(imported_path.exists());
            assert!(imported_path.join(".git").exists());
            
            let sync_res = sync_skill(imported_path_str.clone(), vec!["cursor".to_string()], Some("copy".to_string()));
            assert!(sync_res.is_ok(), "Sync failed: {:?}", sync_res.err());
            
            let delete_res = delete_skill(imported_path_str.clone());
            assert!(delete_res.is_ok());
            assert!(!imported_path.exists());
        });
    }

    #[test]
    fn test_e2e_007_github_subdirectory_import() {
        with_test_env("e2e_007", |_, _home| {
            let repo_url = "https://github.com/OthmanAdi/planning-with-files/tree/master/examples".to_string();
            
            let result = std::thread::spawn(move || {
                tokio::runtime::Runtime::new().unwrap().block_on(async {
                    core_install_skill_from_url(&repo_url, |_| {}).await
                })
            }).join();
            
            assert!(result.is_ok(), "Subdirectory import failed: {:?}", result.unwrap().err());
            
            let imported_path_str = result.unwrap().unwrap();
            let imported_path = PathBuf::from(&imported_path_str);
            
            assert!(imported_path.exists());
            
            delete_skill(imported_path_str.clone()).unwrap();
            assert!(!imported_path.exists());
        });
    }

    #[test]
    fn test_e2e_008_local_skills_scan_and_import() {
        with_test_env("e2e_008", |_, home| {
            let cursor_skills_dir = home.join(".cursor/skills");
            fs::create_dir_all(&cursor_skills_dir).unwrap();
            
            let skill1_dir = cursor_skills_dir.join("local-skill-1");
            fs::create_dir_all(&skill1_dir).unwrap();
            fs::write(skill1_dir.join("SKILL.md"), "---\nname: local-skill-1\ndescription: Test\n---\nContent").unwrap();
            
            let skill2_dir = cursor_skills_dir.join("local-skill-2");
            fs::create_dir_all(&skill2_dir).unwrap();
            fs::write(skill2_dir.join("SKILL.md"), "---\nname: local-skill-2\ndescription: Test\n---\nContent").unwrap();
            
            let discovered = scan_external_skills().unwrap();
            eprintln!("Discovered skills: {:?}", discovered);
            assert!(!discovered.is_empty(), "Should discover skills from .cursor/skills");
            assert!(discovered.iter().any(|s| s.name == "local-skill-1"));
            assert!(discovered.iter().any(|s| s.name == "local-skill-2"));
            
            for skill in discovered {
                if !skill.is_duplicate {
                    import_skills(vec![skill], "copy".to_string()).unwrap();
                }
            }
            
            let hub_skills_dir = home.join(".xskill/skills");
            eprintln!("Hub skills dir: {:?}", hub_skills_dir);
            eprintln!("Hub skills dir exists: {}", hub_skills_dir.exists());
            eprintln!("local-skill-1 exists: {}", hub_skills_dir.join("local-skill-1").exists());
            eprintln!("local-skill-2 exists: {}", hub_skills_dir.join("local-skill-2").exists());
            assert!(hub_skills_dir.exists(), "Hub skills directory should exist");
            assert!(hub_skills_dir.join("local-skill-1").exists(), "local-skill-1 should be copied to hub");
            assert!(hub_skills_dir.join("local-skill-2").exists(), "local-skill-2 should be copied to hub");
        });
    }

    #[test]
    fn test_e2e_009_multi_agent_sync() {
        with_test_env("e2e_009", |_, home| {
            let skill_name = "multi-sync-skill".to_string();
            let description = "Multi-agent sync test".to_string();
            let content = "You are a helpful assistant.".to_string();
            
            let result = create_skill(
                skill_name.clone(),
                description.clone(),
                "xskill".to_string(),
                content.clone(),
                None,
                None,
                None,
            );
            assert!(result.is_ok());
            let skill_path = result.unwrap();
            
            let sync_res = sync_skill(
                skill_path.clone(),
                vec!["cursor".to_string(), "claude_code".to_string(), "windsurf".to_string()],
                Some("copy".to_string()),
            );
            assert!(sync_res.is_ok());
            
            let cursor_target = home.join(".cursor/skills").join(&skill_name);
            let claude_target = home.join(".claude/skills").join(&skill_name);
            let windsurf_target = home.join(".codeium/windsurf/skills").join(&skill_name);
            
            assert!(cursor_target.exists());
            assert!(claude_target.exists());
            assert!(windsurf_target.exists());
            
            let link_res = sync_skill(skill_path.clone(), vec!["opencode".to_string()], Some("link".to_string()));
            assert!(link_res.is_ok());
            
            let link_target = home.join(".config/opencode/skills").join(&skill_name);
            assert!(link_target.exists());
            #[cfg(unix)]
            assert!(link_target.is_symlink());
            
            let skill_path_buf = PathBuf::from(&skill_path);
            fs::write(skill_path_buf.join("test.txt"), "Updated content").unwrap();
            
            assert!(cursor_target.exists());
            assert!(claude_target.exists());
            
            assert!(link_target.exists());
        });
    }

    #[test]
    fn test_e2e_011_claude_desktop_config_update() {
        with_test_env("e2e_011", |_, home| {
            let skill_name = "claude-sync-skill".to_string();
            let description = "Claude Desktop config test".to_string();
            let content = "You are a helpful assistant.".to_string();
            
            let result = create_skill(
                skill_name.clone(),
                description.clone(),
                "xskill".to_string(),
                content.clone(),
                None,
                None,
                None,
            );
            assert!(result.is_ok());
            let skill_path = result.unwrap();
            
            let config = SkillConfig {
                command: Some("node".to_string()),
                args: Some(vec!["index.js".to_string()]),
                env: Some(std::collections::HashMap::new()),
            };
            save_skill_config(skill_name.clone(), config).unwrap();
            
            fs::write(PathBuf::from(&skill_path).join("package.json"), "{}").unwrap();
            fs::write(PathBuf::from(&skill_path).join("index.js"), "console.log('test');").unwrap();
            
            let sync_res = sync_skill(skill_path.clone(), vec!["claude_code".to_string()], Some("copy".to_string()));
            assert!(sync_res.is_ok());
            
            let config_path = home.join("Library/Application Support/Claude/claude_desktop_config.json");
            assert!(config_path.exists());
            
            let content = fs::read_to_string(&config_path).unwrap();
            assert!(content.contains(&skill_name));
            assert!(content.contains("node"));
            
            delete_skill(skill_path.clone()).unwrap();
        });
    }

    #[test]
    fn test_e2e_012_project_skills_management() {
        with_test_env("e2e_012", |_, home| {
            let project_path = home.join("my_test_project");
            fs::create_dir_all(project_path.join(".git")).unwrap();
            
            let project_skill_dir = project_path.join(".cursor/skills/project-skill");
            fs::create_dir_all(&project_skill_dir).unwrap();
            fs::write(project_skill_dir.join("SKILL.md"), "---\nname: project-skill\ndescription: Test\n---\nContent").unwrap();
            
            let skills = get_project_skills(project_path.to_string_lossy().to_string()).unwrap();
            assert!(skills.iter().any(|s| s.name == "project-skill"));
            
            let collect_res = skill_collect_to_hub(project_skill_dir.to_string_lossy().to_string());
            assert!(collect_res.is_ok());
            
            let hub_skill_dir = home.join(".xskill/skills").join("project-skill");
            assert!(hub_skill_dir.exists());
            
            let delete_res = delete_skill(project_skill_dir.to_string_lossy().to_string());
            assert!(delete_res.is_ok());
            assert!(!project_skill_dir.exists());
        });
    }

    #[test]
    fn test_e2e_014_suite_lifecycle() {
        with_test_env("e2e_014", |_, _home| {
            let suite = Suite {
                id: "suite_1".to_string(),
                name: "React Frontend Kit".to_string(),
                description: "For React projects".to_string(),
                policy_rules: "# Project Context\n...".to_string(),
                loadout_skills: vec!["skill_1".to_string(), "skill_2".to_string()],
            };
            
            save_suites(vec![suite.clone()]).unwrap();
            
            let loaded = load_suites().unwrap();
            assert_eq!(loaded.len(), 1);
            assert_eq!(loaded[0].name, "React Frontend Kit");
            assert_eq!(loaded[0].id, "suite_1");
            
            let updated_suite = Suite {
                id: "suite_1".to_string(),
                name: "React Frontend Kit Updated".to_string(),
                description: "For React projects".to_string(),
                policy_rules: "# Project Context\n...".to_string(),
                loadout_skills: vec!["skill_1".to_string(), "skill_2".to_string()],
            };
            
            save_suites(vec![updated_suite.clone()]).unwrap();
            
            let loaded_after = load_suites().unwrap();
            assert_eq!(loaded_after[0].name, "React Frontend Kit Updated");
            
            save_suites(vec![]).unwrap();
            let loaded_final = load_suites().unwrap();
            assert_eq!(loaded_final.len(), 0);
        });
    }

    #[test]
    fn test_e2e_015_suite_apply_to_project() {
        with_test_env("e2e_015", |_, home| {
            let project_path = home.join("test_project");
            fs::create_dir_all(&project_path).unwrap();
            
            let hub_skill_dir = home.join(".xskill/skills/test-skill");
            fs::create_dir_all(&hub_skill_dir).unwrap();
            fs::write(hub_skill_dir.join("SKILL.md"), "---\nname: test-skill\ndescription: Test\n---\nContent").unwrap();
            
            let suite = Suite {
                id: "apply_suite_1".to_string(),
                name: "Test Suite".to_string(),
                description: "Test".to_string(),
                policy_rules: "# Test Policy\n...".to_string(),
                loadout_skills: vec!["test-skill".to_string()],
            };
            
            let apply_res = apply_suite(project_path.to_string_lossy().to_string(), suite, Some("cursor".to_string()), Some("copy".to_string()));
            assert!(apply_res.is_ok());
            
            let agents_md_path = project_path.join("AGENTS.md");
            assert!(agents_md_path.exists());
            
            let synced_skill = project_path.join(".cursor/skills/test-skill");
            assert!(synced_skill.exists());
        });
    }

    #[test]
    fn test_e2e_025_suite_apply_to_agent() {
        with_test_env("e2e_025", |_, home| {
            // Setup Hub Skill
            let hub_skill_dir = home.join(".xskill/skills/agent-skill");
            fs::create_dir_all(&hub_skill_dir).unwrap();
            fs::write(hub_skill_dir.join("SKILL.md"), "Agent Skill").unwrap();
            
            let suite = Suite {
                id: "agent_suite".to_string(),
                name: "Agent Suite".to_string(),
                description: "Test".to_string(),
                policy_rules: "".to_string(),
                loadout_skills: vec!["agent-skill".to_string()],
            };
            
            // Apply to Cursor (Global)
            let res = apply_suite_to_agent(suite.clone(), "cursor".to_string(), Some("copy".to_string()));
            assert!(res.is_ok());
            
            let cursor_global_skill = home.join(".cursor/skills/agent-skill");
             assert!(cursor_global_skill.exists());
             assert!(cursor_global_skill.join("SKILL.md").exists());
             
             // Apply to VSCode (Link) - macOS/Linux only
             #[cfg(unix)]
             {
                 let res_link = apply_suite_to_agent(suite.clone(), "vscode".to_string(), Some("link".to_string()));
                 assert!(res_link.is_ok());
                 let vscode_global_skill = home.join(".vscode/skills/agent-skill");
                 assert!(vscode_global_skill.exists());
                 assert!(vscode_global_skill.is_symlink());
             }
         });
     }

    #[test]
    fn test_e2e_016_multi_suite_management() {
        with_test_env("e2e_016", |_, _home| {
            let suite1 = Suite {
                id: "suite_1".to_string(),
                name: "Suite 1".to_string(),
                description: "Test".to_string(),
                policy_rules: "Rules 1".to_string(),
                loadout_skills: vec!["skill_1".to_string()],
            };
            
            let suite2 = Suite {
                id: "suite_2".to_string(),
                name: "Suite 2".to_string(),
                description: "Test".to_string(),
                policy_rules: "Rules 2".to_string(),
                loadout_skills: vec!["skill_2".to_string()],
            };
            
            let suite3 = Suite {
                id: "suite_3".to_string(),
                name: "Suite 3".to_string(),
                description: "Test".to_string(),
                policy_rules: "Rules 3".to_string(),
                loadout_skills: vec!["skill_3".to_string()],
            };
            
            save_suites(vec![suite1.clone(), suite2.clone(), suite3.clone()]).unwrap();
            
            let loaded = load_suites().unwrap();
            assert_eq!(loaded.len(), 3);
            
            let updated_suite2 = Suite {
                id: "suite_2".to_string(),
                name: "Suite 2 Updated".to_string(),
                description: "Test".to_string(),
                policy_rules: "Rules 2 Updated".to_string(),
                loadout_skills: vec!["skill_2".to_string()],
            };
            
            save_suites(vec![suite1.clone(), updated_suite2, suite3.clone()]).unwrap();
            
            let loaded_after = load_suites().unwrap();
            assert_eq!(loaded_after.len(), 3);
            assert_eq!(loaded_after.iter().find(|s| s.id == "suite_2").unwrap().name, "Suite 2 Updated");
            
            save_suites(vec![suite1, suite3]).unwrap();
            
            let loaded_final = load_suites().unwrap();
            assert_eq!(loaded_final.len(), 2);
        });
    }

    #[test]
    fn test_e2e_017_project_scan_and_deduplication() {
        with_test_env("e2e_017", |_, home| {
            let workspace = home.join("workspace");
            fs::create_dir_all(&workspace).unwrap();
            
            let proj_a = workspace.join("proj_a");
            fs::create_dir_all(proj_a.join(".git")).unwrap();
            fs::write(proj_a.join("AGENTS.md"), "rules").unwrap();
            
            let proj_b = workspace.join("proj_b");
            fs::create_dir_all(proj_b.join(".git")).unwrap();
            fs::write(proj_b.join("package.json"), "{\"mcp\": {}}").unwrap();
            
            let proj_c = workspace.join("proj_c");
            fs::create_dir_all(proj_c.join(".git")).unwrap();
            
            let scan_result = scan_workspace(None).unwrap();
            assert!(scan_result.iter().any(|p| p.name == "proj_a"), "Should find proj_a in workspace");
            assert!(scan_result.iter().any(|p| p.name == "proj_b"), "Should find proj_b in workspace");
            assert!(scan_result.iter().any(|p| p.name == "proj_c"), "Should find proj_c in workspace");
            
            assert!(scan_result.iter().find(|p| p.name == "proj_a").unwrap().has_agents_md);
            assert!(scan_result.iter().find(|p| p.name == "proj_b").unwrap().has_mcp);
            
            let node_modules = workspace.join("proj_a/node_modules");
            fs::create_dir_all(&node_modules).unwrap();
            
            let scan_result2 = scan_workspace(None).unwrap();
            assert!(scan_result2.iter().find(|p| p.name == "proj_a").is_some());
        });
    }

    #[test]
    fn test_e2e_018_workspace_deep_scan() {
        with_test_env("e2e_018", |_, home| {
            let level1 = home.join("workspace").join("level1");
            fs::create_dir_all(level1.join(".git")).unwrap();
            
            let level2 = level1.join("level2");
            fs::create_dir_all(level2.join(".git")).unwrap();
            
            let level3 = level2.join("level3");
            fs::create_dir_all(level3.join(".git")).unwrap();
            
            let scan_result = scan_workspace(None).unwrap();
            assert!(scan_result.iter().any(|p| p.name == "level3"));
        });
    }

    #[test]
    fn test_e2e_019_large_scale_processing() {
        with_test_env("e2e_019", |_, home| {
            let hub_skills_dir = home.join(".xskill/skills");
            fs::create_dir_all(&hub_skills_dir).unwrap();
            
            for i in 0..100 {
                let skill_dir = hub_skills_dir.join(format!("skill_{}", i));
                fs::create_dir_all(&skill_dir).unwrap();
                fs::write(skill_dir.join("SKILL.md"), format!("---\nname: skill_{}\n---\nContent", i)).unwrap();
            }
            
            let start = std::time::Instant::now();
            let skills = get_all_local_skills().unwrap();
            let duration = start.elapsed();
            
            assert_eq!(skills.len(), 100);
            assert!(duration.as_secs() < 5, "Should complete in less than 5 seconds");
            
            let start = std::time::Instant::now();
            for skill in skills.iter().take(10) {
                let _ = sync_skill(skill.path.clone(), vec!["cursor".to_string()], Some("copy".to_string()));
            }
            let duration = start.elapsed();
            
            assert!(duration.as_secs() < 10, "Sync 10 skills should complete in less than 10 seconds");
            
            let start = std::time::Instant::now();
            for skill in skills.iter() {
                let _ = delete_skill(skill.path.clone());
            }
            let duration = start.elapsed();
            
            assert!(duration.as_secs() < 5, "Delete 100 skills should complete in less than 5 seconds");
        });
    }

    #[test]
    fn test_e2e_021_cli_sync_all() {
        with_test_env("e2e_021", |_, home| {
            let hub_skills_dir = home.join(".xskill/skills");
            fs::create_dir_all(&hub_skills_dir).unwrap();
            
            for i in 0..3 {
                let skill_dir = hub_skills_dir.join(format!("cli_skill_{}", i));
                fs::create_dir_all(&skill_dir).unwrap();
                fs::write(skill_dir.join("SKILL.md"), format!("---\nname: cli_skill_{}\n---\nContent", i)).unwrap();
                fs::write(skill_dir.join("package.json"), "{}").unwrap();
                fs::write(skill_dir.join("index.js"), "console.log('test');").unwrap();
            }
            
            let cursor_skills_dir = home.join(".cursor/skills");
            fs::create_dir_all(&cursor_skills_dir).unwrap();
            
            for i in 0..3 {
                let skill_name = format!("cli_skill_{}", i);
                let skill_path = hub_skills_dir.join(&skill_name);
                let _ = sync_skill(skill_path.to_string_lossy().to_string(), vec!["cursor".to_string()], Some("copy".to_string()));
            }
            
            let cursor_skills = std::fs::read_dir(&cursor_skills_dir).unwrap();
            assert!(cursor_skills.count() >= 3);
        });
    }

    #[test]
    fn test_e2e_022_cli_create_skill() {
        with_test_env("e2e_022", |_, home| {
            let skill_name = "cli-test-skill".to_string();
            let description = "CLI test skill".to_string();
            let content = "You are a helpful assistant.".to_string();
            
            let result = create_skill(
                skill_name.clone(),
                description.clone(),
                "xskill".to_string(),
                content.clone(),
                None,
                None,
                None,
            );
            assert!(result.is_ok());
            
            let skill_path = result.unwrap();
            let skill_dir = PathBuf::from(&skill_path);
            
            assert!(skill_dir.exists());
            assert!(skill_dir.join("SKILL.md").exists());
            
            let md_content = fs::read_to_string(skill_dir.join("SKILL.md")).unwrap();
            assert!(md_content.contains(&skill_name));
            assert!(md_content.contains(&description));
        });
    }

    #[test]
    fn test_e2e_015_import_from_ignored_dir() {
        with_test_env("e2e_015", |_, home| {
            // Case: Import a skill from a path that contains an ignored directory name (e.g., .cursor)
            // The structure is: <project>/.cursor/skills/my-skill
            let project_path = home.join("project-with-ignored-dir");
            let skill_dir = project_path.join(".cursor/skills/my-skill");
            fs::create_dir_all(&skill_dir).unwrap();
            
            // Create a file inside the skill directory
            fs::write(skill_dir.join("SKILL.md"), "My Skill Content").unwrap();
            fs::write(skill_dir.join("script.py"), "print('hello')").unwrap();
            
            // Also create a nested directory to ensure recursion works
            let nested_dir = skill_dir.join("lib");
            fs::create_dir_all(&nested_dir).unwrap();
            fs::write(nested_dir.join("utils.py"), "def foo(): pass").unwrap();
            
            // Import to Hub
            let result = skill_collect_to_hub(skill_dir.to_string_lossy().to_string());
            assert!(result.is_ok());
            
            // Verify files in Hub
            let hub_skill_dir = home.join(".xskill/skills/my-skill");
            assert!(hub_skill_dir.exists());
            assert!(hub_skill_dir.join("SKILL.md").exists(), "SKILL.md should be copied");
            assert!(hub_skill_dir.join("script.py").exists(), "script.py should be copied");
            assert!(hub_skill_dir.join("lib/utils.py").exists(), "nested file should be copied");
            
            // Verify content
            let content = fs::read_to_string(hub_skill_dir.join("SKILL.md")).unwrap();
            assert_eq!(content, "My Skill Content");
        });
    }
}
