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

    // 1. Get latest release
    const releaseRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      next: { revalidate: 60 },
    });

    if (!releaseRes.ok) {
      console.error(`GitHub API error (release): ${releaseRes.status} ${releaseRes.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch release info' }, { status: releaseRes.status });
    }

    const release = await releaseRes.json();
    
    // 2. Find DMG asset
    const assets = release.assets || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dmgAsset = assets.find((a: any) => a.name && a.name.toLowerCase().endsWith('.dmg'));

    if (!dmgAsset || !dmgAsset.url) {
      console.error('DMG asset not found in release');
      return NextResponse.json({ error: 'DMG asset not found' }, { status: 404 });
    }

    // 3. Request asset download URL (which redirects to S3)
    // IMPORTANT: For private repos, use the API URL (asset.url) with Accept: application/octet-stream
    const assetRes = await fetch(dmgAsset.url, {
      headers: {
        Accept: 'application/octet-stream',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      redirect: 'manual', // We want to catch the redirect
    });

    if (assetRes.status === 302 || assetRes.status === 301 || assetRes.status === 307) {
      const location = assetRes.headers.get('location');
      if (location) {
        // Redirect the client to the S3 URL
        return NextResponse.redirect(location);
      }
    }

    console.error(`Failed to get redirect URL for asset. Status: ${assetRes.status}`);
    return NextResponse.json({ error: 'Failed to retrieve download link' }, { status: 500 });

  } catch (error) {
    console.error('Error in /api/download:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
