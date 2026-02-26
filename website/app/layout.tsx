import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'xskill - Skill Hub for Mac',
  description: 'A lightweight, minimalist Mac desktop app for managing and syncing AI agent skills across Cursor, OpenCode, Windsurf, and more.',
  keywords: ['AI', 'skills', 'cursor', 'opencode', 'windsurf', 'mcp', 'mac', 'productivity'],
  openGraph: {
    title: 'xskill - Skill Hub for Mac',
    description: 'A lightweight, minimalist Mac desktop app for managing and syncing AI agent skills.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
