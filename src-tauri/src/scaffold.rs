use std::fs;
use std::path::Path;
use std::process::Command;

#[tauri::command]
pub fn create_skill_template(
    name: String,
    desc: String,
    lang: String,
    target_dir: String,
) -> Result<(), String> {
    let target_path = Path::new(&target_dir).join(&name);


    if let Err(e) = fs::create_dir_all(&target_path) {
        return Err(format!("Failed to create directory: {}", e));
    }

    if lang == "ts" {

        let package_json = format!(
            r#"{{
  "name": "{}",
  "version": "0.1.0",
  "description": "{}",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {{
    "build": "tsc",
    "start": "node dist/index.js"
  }},
  "dependencies": {{
    "@modelcontextprotocol/sdk": "latest"
  }},
  "devDependencies": {{
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }}
}}"#,
            name, desc
        );
        if let Err(e) = fs::write(target_path.join("package.json"), package_json) {
            return Err(format!("Failed to write package.json: {}", e));
        }


        let tsconfig_json = r#"{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}"#;
        if let Err(e) = fs::write(target_path.join("tsconfig.json"), tsconfig_json) {
            return Err(format!("Failed to write tsconfig.json: {}", e));
        }


        let src_path = target_path.join("src");
        if let Err(e) = fs::create_dir_all(&src_path) {
            return Err(format!("Failed to create src directory: {}", e));
        }


        let index_ts = r#"import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "my-skill",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Skill server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
"#;
        if let Err(e) = fs::write(src_path.join("index.ts"), index_ts) {
            return Err(format!("Failed to write index.ts: {}", e));
        }
    } else {

        let readme = format!("# {}\n\n{}", name, desc);
        if let Err(e) = fs::write(target_path.join("README.md"), readme) {
            return Err(format!("Failed to write README.md: {}", e));
        }
    }


    let git_status = Command::new("git")
        .arg("init")
        .current_dir(&target_path)
        .status()
        .map_err(|e| format!("Failed to execute git init: {}", e))?;

    if !git_status.success() {
        return Err("git init failed".to_string());
    }


    if lang == "ts" {
        let npm_cmd = if cfg!(target_os = "windows") {
            "npm.cmd"
        } else {
            "npm"
        };

        let npm_status = Command::new(npm_cmd)
            .arg("install")
            .current_dir(&target_path)
            .status()
            .map_err(|e| format!("Failed to execute npm install: {}", e))?;

        if !npm_status.success() {
            return Err("npm install failed".to_string());
        }
    }

    Ok(())
}
