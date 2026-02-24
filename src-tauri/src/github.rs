use reqwest::header::USER_AGENT;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GithubContent {
    pub name: String,
    pub path: String,
    pub sha: String,
    pub url: String,
    pub html_url: String,
    pub git_url: String,
    pub download_url: Option<String>,
    pub r#type: String,
    pub content: Option<String>,
    pub encoding: Option<String>,
}

#[tauri::command]
pub async fn fetch_github_file(url: String) -> Result<String, String> {
    // 1. Handle raw.githubusercontent.com
    if url.contains("raw.githubusercontent.com") {
        let client = reqwest::Client::new();
        let resp = client.get(&url)
            .header(USER_AGENT, "xskill")
            .send()
            .await
            .map_err(|e| e.to_string())?;
            
        if !resp.status().is_success() {
            return Err(format!("Failed to fetch: {}", resp.status()));
        }
        
        return resp.text().await.map_err(|e| e.to_string());
    }

    // 2. Handle github.com blob URLs
    // https://github.com/owner/repo/blob/branch/path/to/file
    // -> https://raw.githubusercontent.com/owner/repo/branch/path/to/file
    if url.contains("github.com") && url.contains("/blob/") {
        let raw_url = url.replace("github.com", "raw.githubusercontent.com")
                         .replace("/blob/", "/");
        // Recursive call to handle the raw url
        // Note: In async recursion we need Box::pin but here we can just reuse the logic
        // or just call the same logic. Since it's not recursive in a loop, let's just copy-paste or restructure.
        // Actually, let's just call the raw logic directly here to avoid recursion issues without async_recursion crate.
        
        let client = reqwest::Client::new();
        let resp = client.get(&raw_url)
            .header(USER_AGENT, "xskill")
            .send()
            .await
            .map_err(|e| e.to_string())?;
            
        if !resp.status().is_success() {
            return Err(format!("Failed to fetch: {}", resp.status()));
        }
        
        return resp.text().await.map_err(|e| e.to_string());
    }

    Err("Unsupported URL format".to_string())
}
