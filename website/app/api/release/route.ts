import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || 'mgechev';
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || 'xskill';
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      console.error('GITHUB_TOKEN is missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      next: { revalidate: 60 }, // Cache for 1 minute to avoid hitting rate limits too hard
    });

    if (!res.ok) {
      console.error(`GitHub API error: ${res.status} ${res.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch release info' }, { status: res.status });
    }

    const release = await res.json();
    
    // Return minimal data to avoid leaking too much info if needed, but for now full object is fine
    // The client only needs tag_name and assets
    return NextResponse.json({
      tag_name: release.tag_name,
      assets: release.assets.map((a: any) => ({
        name: a.name,
        // We don't return browser_download_url because it requires auth for private repos
        // The client should use our /api/download endpoint
        browser_download_url: '/api/download', 
      })),
    });
  } catch (error) {
    console.error('Error in /api/release:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
