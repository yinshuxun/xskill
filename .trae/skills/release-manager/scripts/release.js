import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(cmd) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// Read current version
const packageJsonPath = path.resolve(__dirname, '../../../../package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = pkg.version;
console.log(`Current version: ${currentVersion}`);

// Increment patch version or use provided argument
let newVersion;
if (process.argv[2]) {
  newVersion = process.argv[2];
} else {
  const parts = currentVersion.split('.').map(Number);
  parts[2]++;
  newVersion = parts.join('.');
}
console.log(`New version: ${newVersion}`);

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');

// Update tauri.conf.json
const tauriConfPath = path.resolve(__dirname, '../../../../src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');

// Update Cargo.toml
const cargoTomlPath = path.resolve(__dirname, '../../../../src-tauri/Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/version = ".*"/, `version = "${newVersion}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);

// Update src-tauri/src/main.rs (CLI version)
const mainRsPath = path.resolve(__dirname, '../../../../src-tauri/src/main.rs');
let mainRs = fs.readFileSync(mainRsPath, 'utf8');
mainRs = mainRs.replace(/#\[command\(version = ".*"\)\]/, `#[command(version = "${newVersion}")]`);
fs.writeFileSync(mainRsPath, mainRs);

// Update lockfiles
try {
  run('npm install --package-lock-only');
  run('cd src-tauri && cargo check');
} catch (e) {
  console.warn('Failed to update lockfiles:', e.message);
}

// Git operations
try {
  run('git add .');
  run(`git commit -m "chore: bump version to ${newVersion}"`);
  run(`git tag v${newVersion}`);
  console.log(`\nSuccessfully bumped to v${newVersion}. run "git push && git push --tags" to release.`);
} catch (e) {
  console.error('Git operations failed:', e);
  process.exit(1);
}
