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

pub fn convert_github_url(url: &str) -> Option<String> {
    if url.contains("raw.githubusercontent.com") {
        Some(url.to_string())
    } else if url.contains("github.com") && url.contains("/blob/") {
        Some(url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/"))
    } else {
        None
    }
}

#[tauri::command]
pub async fn fetch_github_file(url: String) -> Result<String, String> {
    let raw_url = convert_github_url(&url).ok_or("Unsupported URL format")?;

    let client = reqwest::Client::builder().timeout(std::time::Duration::from_secs(10)).build().unwrap();
    let resp = client.get(&raw_url)
        .header(USER_AGENT, "xskill")
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    if !resp.status().is_success() {
        return Err(format!("Failed to fetch: {}", resp.status()));
    }
    
    resp.text().await.map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convert_github_url() {
        let raw = "https://raw.githubusercontent.com/owner/repo/main/file.txt";
        assert_eq!(convert_github_url(raw).unwrap(), raw);

        let blob = "https://github.com/owner/repo/blob/main/file.txt";
        let expected = "https://raw.githubusercontent.com/owner/repo/main/file.txt";
        assert_eq!(convert_github_url(blob).unwrap(), expected);

        let invalid = "https://google.com";
        assert!(convert_github_url(invalid).is_none());
    }

    #[tokio::test]
    async fn test_fetch_github_file_invalid() {
        let result = fetch_github_file("https://google.com".to_string()).await;
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Unsupported URL format");
    }
}
