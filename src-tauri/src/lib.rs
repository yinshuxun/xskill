pub mod commands;
pub mod config;
pub mod crawler;
pub mod feed_parser;
pub mod git_manager;
pub mod ide_sync;
pub mod scaffold;
pub mod skill_manager;
pub mod store;
pub mod fingerprint;
pub mod onboarding;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            skill_manager::get_installed_tools,
            skill_manager::get_skills_for_tool,
            skill_manager::get_all_local_skills,
            scaffold::create_skill,
            ide_sync::sync_skill,
            feed_parser::fetch_feed,
            git_manager::clone_skill,
            git_manager::update_skill,
            store::load_skills,
            store::save_skills,
            store::load_feeds,
            store::save_feeds,
            onboarding::scan_external_skills,
            onboarding::import_skills,
        ])
        .setup(|_app| {
            config::init_config();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
