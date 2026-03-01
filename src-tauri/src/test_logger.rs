use std::fs;
use std::path::PathBuf;
use std::time::Instant;

pub struct TestLogger {
    test_name: String,
    start_time: Instant,
    log_entries: Vec<String>,
    screenshots_dir: PathBuf,
}

impl TestLogger {
    pub fn new(test_name: &str) -> Self {
        let start_time = Instant::now();
        // Use relative path from src-tauri directory
        let screenshots_dir = PathBuf::from("dist/test-results");
        
        // Ensure the directory exists
        fs::create_dir_all(&screenshots_dir).expect("Failed to create test results directory");
        
        Self {
            test_name: test_name.to_string(),
            start_time,
            log_entries: Vec::new(),
            screenshots_dir,
        }
    }
    
    pub fn log(&mut self, message: &str) {
        let timestamp = self.start_time.elapsed();
        let entry = format!("[{:?}] {}", timestamp, message);
        self.log_entries.push(entry);
        println!("  {}", message);
    }
    
    pub fn log_step(&mut self, step: &str) {
        self.log(&format!(">>> {}", step));
    }
    
    pub fn log_success(&mut self, message: &str) {
        self.log(&format!("✅ {}", message));
    }
    
    pub fn log_error(&mut self, message: &str) {
        self.log(&format!("❌ {}", message));
    }
    
    pub fn save_report(&self) {
        let report_path = self.screenshots_dir.join(format!("{}.txt", self.test_name));
        let report_content = self.generate_report();
        fs::write(&report_path, report_content).expect("Failed to save test report");
    }
    
    fn generate_report(&self) -> String {
        let mut report = String::new();
        report.push_str(&format!("Test: {}\n", self.test_name));
        report.push_str(&format!("Duration: {:?}\n", self.start_time.elapsed()));
        report.push_str("Steps:\n");
        for entry in &self.log_entries {
            report.push_str(&format!("  {}\n", entry));
        }
        report
    }
}
