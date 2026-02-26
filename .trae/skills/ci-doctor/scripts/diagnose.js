import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to run shell commands
function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (error) {
        return null;
    }
}

// Get current git info
const currentBranch = run('git branch --show-current');
const currentCommit = run('git rev-parse HEAD');
const remoteUrl = run('git config --get remote.origin.url');

if (!remoteUrl) {
    console.error('Error: Not a git repository or no remote origin found.');
    process.exit(1);
}

// Extract owner and repo from remote URL
// Supports:
// - https://github.com/owner/repo.git
// - git@github.com:owner/repo.git
const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?/);
if (!match) {
    console.error('Error: Could not parse GitHub owner/repo from remote URL.');
    process.exit(1);
}
const owner = match[1];
const repo = match[2];

console.log(`Analyzing CI status for ${owner}/${repo} @ ${currentBranch} (${currentCommit.substring(0, 7)})...`);

// Get GitHub Token
const token = process.env.GITHUB_TOKEN;
if (!token) {
    console.error('\nError: GITHUB_TOKEN environment variable is not set.');
    console.error('Please set it using: export GITHUB_TOKEN=your_token');
    console.error('Or add it to a .env file.');
    process.exit(1);
}

// Helper to make GitHub API requests
function githubRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js/CI-Doctor',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`GitHub API Error: ${res.statusCode} ${res.statusMessage}\n${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function diagnose() {
    try {
        // 1. Get workflow runs for the current commit
        const runs = await githubRequest(`/repos/${owner}/${repo}/commits/${currentCommit}/check-runs`);
        
        if (!runs.check_runs || runs.check_runs.length === 0) {
            console.log('No workflow runs found for this commit.');
            return;
        }

        console.log(`Found ${runs.check_runs.length} checks.`);

        const failedChecks = runs.check_runs.filter(check => check.conclusion === 'failure' || check.conclusion === 'timed_out' || check.conclusion === 'cancelled');

        if (failedChecks.length === 0) {
            console.log('✅ All checks passed!');
            return;
        }

        console.log(`\n❌ Found ${failedChecks.length} failed checks:\n`);

        for (const check of failedChecks) {
            console.log(`[${check.name}] Status: ${check.status}, Conclusion: ${check.conclusion}`);
            console.log(`Url: ${check.html_url}`);
            if (check.output) {
                if (check.output.title) console.log(`Title: ${check.output.title}`);
                if (check.output.summary) console.log(`Summary: ${check.output.summary}`);
                if (check.output.text) console.log(`Details: ${check.output.text.substring(0, 200)}...`);
            }
            // Attempt to get logs if available (requires more complex logic usually, but output often has details)
            console.log('-'.repeat(40));
        }

        // Common error analysis
        console.log('\n🔍 Diagnosis:');
        const summary = failedChecks.map(c => (c.output?.summary || '') + (c.output?.title || '') + (c.output?.text || '')).join(' ');
        
        if (summary.includes('quota') || summary.includes('payment') || summary.includes('billing') || summary.includes('spending limit')) {
            console.log('⚠️  It seems like you hit a GitHub Actions usage limit.');
            console.log('   Check your billing settings: https://github.com/settings/billing');
        } else if (failedChecks.some(c => c.name.includes('release'))) {
             console.log('⚠️  Release workflow failed. Check if the tag already exists or if you have permission to create releases.');
        } else {
            console.log('⚠️  Please check the logs above for specific error messages.');
        }

    } catch (error) {
        console.error('Diagnosis failed:', error.message);
    }
}

diagnose();
