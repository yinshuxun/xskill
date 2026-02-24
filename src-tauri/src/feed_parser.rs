use serde_json::Value;

#[tauri::command]
pub async fn fetch_feed(url: String) -> Result<Value, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch feed: {}", e))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(json)
}
