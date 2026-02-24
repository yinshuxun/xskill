use serde_json::Value;

#[tauri::command]
pub async fn fetch_feed(url: String) -> Result<Value, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch feed: {}", e))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(json)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_feed_invalid_url() {
        let result = fetch_feed("not-a-url".to_string()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to fetch feed"));
    }
}
