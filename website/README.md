# xskill Website

Landing page for xskill - Skill Hub for Mac

## Environment Variables

Configure these in Vercel project settings:

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes (for private repo) | GitHub Personal Access Token with `repo` scope |
| `NEXT_PUBLIC_GITHUB_OWNER` | No | GitHub repository owner (default: mgechev) |
| `NEXT_PUBLIC_GITHUB_REPO` | No | GitHub repository name (default: xskill) |

### Setting up GitHub Token

1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select `repo` scope
   - Copy the token

2. Add to Vercel:
   - Go to your Vercel project settings
   - Add environment variable: `GITHUB_TOKEN`
   - Paste your token value
   - Set environment to "Production" (or as needed)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
