import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'xskill — Skill Hub for AI Agents',
  description: 'Discover, create, and sync agent skills across Cursor, Claude Code, OpenCode, Windsurf, and more. Local-first. Free.',
  openGraph: {
    title: 'xskill — Skill Hub for AI Agents',
    description: 'Manage and sync skills across all your AI coding agents. Free, local, no cloud.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
