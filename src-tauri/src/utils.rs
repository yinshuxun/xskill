use std::path::PathBuf;

pub fn get_home_dir() -> Option<PathBuf> {
    if let Ok(path) = std::env::var("XSKILL_TEST_HOME") {
        return Some(PathBuf::from(path));
    }
    dirs::home_dir()
}
