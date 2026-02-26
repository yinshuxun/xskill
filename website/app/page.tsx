'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Sparkles, 
  Zap, 
  Shield, 
  FolderSync, 
  Search,
  Settings,
  ArrowRight,
  Github,
  Apple,
  Check,
  Terminal,
  Package
} from 'lucide-react';

// Feature data
const features = [
  {
    icon: FolderSync,
    title: 'One-Click Sync',
    description: 'Automatically sync skills to Cursor, OpenCode, Windsurf, and more. No manual configuration needed.',
  },
  {
    icon: Search,
    title: 'Smart Discovery',
    description: 'Built-in crawler discovers the best skills from GitHub, skillsmp.com, and smithery.ai.',
  },
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Get intelligent skill suggestions based on your workflow using local Ollama or cloud APIs.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'All data stays local on your Mac. Create private skills for your company without leaks.',
  },
  {
    icon: Terminal,
    title: 'Quick Scaffold',
    description: 'Initialize new skills in seconds with TypeScript or Python templates.',
  },
  {
    icon: Package,
    title: 'Hub Collection',
    description: 'Build your personal skill library in the central hub, sync anywhere.',
  },
];

// Supported agents
const supportedAgents = [
  'Cursor',
  'Claude Code',
  'OpenCode',
  'Windsurf',
  'Trae',
  'Gemini CLI',
  'GitHub Copilot',
  'Amp',
  'Goose',
  'Codex',
  'Roo Code',
];

// GitHub Release API type
interface Release {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

async function getLatestRelease(): Promise<Release | null> {
  try {
    const response = await fetch('https://api.github.com/repos/mgechev/xskill/releases/latest', {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function findDmgUrl(release: Release | null): string | null {
  if (!release?.assets) return null;
  const dmgAsset = release.assets.find((asset) => 
    asset.name.toLowerCase().endsWith('.dmg')
  );
  return dmgAsset?.browser_download_url || null;
}

export default function Home() {
  const [release, setRelease] = useState<Release | null>(null);
  const [dmgUrl, setDmgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestRelease().then((rel) => {
      setRelease(rel);
      setDmgUrl(findDmgUrl(rel));
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">xskill</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#agents" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Supported
            </a>
            <a 
              href={dmgUrl || '#download'} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
              <Apple className="w-4 h-4" />
              <span>For macOS</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 text-balance">
              Your Personal
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"> Skill Hub</span>
              <br />for AI Agents
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto text-balance">
              A lightweight, minimalist Mac desktop app for discovering, managing, and 
              syncing AI agent skills across Cursor, OpenCode, Windsurf, and more.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={dmgUrl || '#download'}
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-semibold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5" />
                Download for Mac
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-sm">
                  {release ? release.tag_name.replace('v', '') : 'Latest'}
                </span>
              </a>
              
              <a
                href="https://github.com/mgechev/xskill"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-4 bg-white text-slate-700 rounded-2xl font-semibold text-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            {!loading && !dmgUrl && (
              <p className="mt-4 text-sm text-slate-500">
                No release available yet. Check GitHub for latest builds.
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Screenshot Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 blur-3xl" />
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-4 text-sm text-slate-500">xskill</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-slate-400 text-lg">
                    Preview coming soon
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to manage AI skills
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built for developers who want a simple, powerful way to manage their AI agent capabilities.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Agents Section */}
      <section id="agents" className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Works with your favorite tools
            </h2>
            <p className="text-lg text-slate-600">
              Seamlessly sync skills across all major AI coding agents
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {supportedAgents.map((agent) => (
              <div
                key={agent}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-slate-700 font-medium"
              >
                <Check className="w-4 h-4 text-emerald-500" />
                {agent}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to supercharge your AI workflow?
            </h2>
            <p className="text-slate-300 mb-8 text-lg">
              Download xskill today and start building your personal skill library.
            </p>
            <a
              href={dmgUrl || 'https://github.com/mgechev/xskill'}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-semibold text-lg hover:bg-slate-100 transition-all"
            >
              <Download className="w-5 h-5" />
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">xskill</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="https://github.com/mgechev/xskill" className="hover:text-slate-900 transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-slate-900 transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-slate-900 transition-colors">
              License
            </a>
          </div>
          
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} xskill. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
