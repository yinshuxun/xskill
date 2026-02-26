// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::{Parser, Subcommand};
use xskill_lib::{ide_sync, scaffold, skill_manager};

#[derive(Parser)]
#[command(name = "xskill")]
#[command(version = "0.5.1")]
#[command(about = "XSkill CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Sync skills to all supported agents
    Sync {
        #[arg(long)]
        all: bool,
    },
    /// Create a new skill
    Create {
        #[arg(long)]
        name: String,
    },
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Some(Commands::Sync { all }) => {
            if *all {
                handle_sync_all();
            } else {
                println!("Please use --all to sync all skills");
            }
        }
        Some(Commands::Create { name }) => {
            handle_create(name);
        }
        None => {
            xskill_lib::run();
        }
    }
}

fn handle_sync_all() {
    let start = std::time::Instant::now();
    
    // 1. Get installed tools
    let tools = match skill_manager::get_installed_tools() {
        Ok(t) => t,
        Err(e) => {
            eprintln!("Failed to get installed tools: {}", e);
            return;
        }
    };
    
    let installed_tools: Vec<String> = tools.into_iter()
        .filter(|t| t.installed)
        .map(|t| t.key)
        .collect();

    if installed_tools.is_empty() {
        println!("No supported agents found.");
        return;
    }

    // 2. Get all skills
    let skills = match skill_manager::get_all_local_skills() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to get local skills: {}", e);
            return;
        }
    };

    if skills.is_empty() {
        println!("No skills found to sync.");
        return;
    }

    // 3. Sync each skill
    // We could optimize this to sync all skills to one tool at a time, but reusing sync_skill is easier
    for skill in &skills {
        if let Err(e) = ide_sync::sync_skill(skill.name.clone(), installed_tools.clone(), Some("copy".to_string())) {
            eprintln!("Failed to sync skill '{}': {}", skill.name, e);
        }
    }

    // Output summary
    for tool in &installed_tools {
        // Capitalize first letter
        let display_name = tool.chars().next().map(|c| c.to_uppercase().to_string()).unwrap_or_default() + &tool[1..];
        // Special casing names could be better, but this is fine for now
        let pretty_name = match tool.as_str() {
            "claude_code" => "Claude Code",
            "opencode" => "OpenCode",
            "windsurf" => "Windsurf",
            "gemini_cli" => "Gemini CLI",
            "github_copilot" => "GitHub Copilot",
            "roo_code" => "Roo Code",
            _ => &display_name,
        };
        println!(" \x1b[32m✓\x1b[0m {} synced {} skills", pretty_name, skills.len());
    }
    
    let duration = start.elapsed();
    println!(" Done in {:.1}s · {} agents updated", duration.as_secs_f32(), installed_tools.len());
}

fn handle_create(name: &str) {
    match scaffold::create_skill(
        name.to_string(),
        "Created via CLI".to_string(),
        "xskill".to_string(),
        "TODO: Add skill logic here".to_string(),
        None,
        None,
        Some(true)
    ) {
        Ok(path) => {
            println!(" → Created {}", path);
            println!(" → Scaffolded SKILL.md, scripts/, references/, assets/");
            println!(" \x1b[32m✓\x1b[0m Added to Hub automatically");
        },
        Err(e) => eprintln!("Failed to create skill: {}", e),
    }
}
