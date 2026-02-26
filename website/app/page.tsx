'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Download, ArrowRight, Check, ChevronRight } from 'lucide-react';

// ─── App Icon SVG (matches exactly the real xskill app icon) ────────────────
function AppIcon({ size = 48, className = '' }: { size?: number; className?: string }) {
  const id = useRef(`g-${Math.random().toString(36).slice(2)}`).current;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="64" y="64" width="896" height="896" rx="224" fill="#0A0A0A" />
      <rect x="64" y="64" width="896" height="896" rx="224" stroke={`url(#${id})`} strokeWidth="32" />
      <path d="M256 256 L768 768" stroke={`url(#${id})`} strokeWidth="140" strokeLinecap="round" />
      <path d="M768 256 L256 768" stroke={`url(#${id})`} strokeWidth="140" strokeLinecap="round" />
      <rect x="180" y="680" width="664" height="180" rx="40" fill="#0A0A0A" fillOpacity="0.8" />
      <text x="512" y="820" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="160" textAnchor="middle" fill="white" letterSpacing="20">SKILL</text>
      <defs>
        <linearGradient id={id} x1="64" y1="64" x2="960" y2="960" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────
const features = [
  {
    tag: '01',
    title: 'Central Hub',
    description: 'One place for all your skills. Create, browse, and manage from a single minimalist dashboard.',
  },
  {
    tag: '02',
    title: 'One-Click Sync',
    description: 'Propagate skills to Cursor, Claude Code, OpenCode, Windsurf, and 10+ other agents instantly.',
  },
  {
    tag: '03',
    title: 'Smart Scaffold',
    description: 'New skill in seconds. Auto-generates SKILL.md with proper frontmatter, scripts/, references/, assets/.',
  },
  {
    tag: '04',
    title: 'Private by Design',
    description: 'Zero cloud. All data stays local on your Mac. Perfect for company-internal or personal skills.',
  },
  {
    tag: '05',
    title: 'Marketplace',
    description: 'Browse and import curated skills from the community. One click to install.',
  },
  {
    tag: '06',
    title: 'Project Skills',
    description: 'Detect per-project skill directories. Different skill sets for different codebases.',
  },
];

const agents = [
  'Cursor', 'Claude Code', 'OpenCode', 'Windsurf', 'Gemini CLI',
  'GitHub Copilot', 'Amp', 'Goose', 'Codex', 'Trae', 'Roo Code',
];

// ─── GitHub Release ───────────────────────────────────────────────────────────
interface Release {
  tag_name: string;
  assets: Array<{ name: string; browser_download_url: string }>;
}

async function fetchRelease(): Promise<Release | null> {
  try {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || 'mgechev';
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || 'xskill';
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

function getDmgAsset(release: Release | null) {
  return release?.assets?.find(a => a.name.toLowerCase().endsWith('.dmg')) ?? null;
}

// ─── Noise texture overlay ───────────────────────────────────────────────────
function Noise() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[999] opacity-[0.025] w-full h-full" aria-hidden>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  );
}

// ─── Terminal typing animation ────────────────────────────────────────────────
function TerminalLine({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, 28);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  return (
    <div className="flex items-start gap-3 font-mono text-sm leading-relaxed">
      <span className="text-emerald-500 shrink-0">$</span>
      <span className="text-slate-300">
        {displayed}
        {!done && <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-0.5 animate-pulse align-text-bottom" />}
      </span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [release, setRelease] = useState<Release | null>(null);
  const [dmgAsset, setDmgAsset] = useState<Release['assets'][0] | null>(null);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(9,9,11,0)', 'rgba(9,9,11,0.95)']);

  useEffect(() => {
    fetchRelease().then(r => {
      setRelease(r);
      setDmgAsset(getDmgAsset(r));
      setLoading(false);
    });
  }, []);

  const version = release?.tag_name ?? null;

  return (
    <div className="bg-[#09090B] text-white min-h-screen overflow-x-hidden">
      <Noise />

      {/* ── Nav ── */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppIcon size={28} />
            <span className="text-[15px] font-bold tracking-tight text-white">xskill</span>
          </div>
          <div className="flex items-center gap-8">
            {['Features', 'Supported'].map(label => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {label}
              </a>
            ))}
            <a
              href={dmgAsset?.browser_download_url ?? '#'}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download
              {version && <span className="text-emerald-300/60 text-xs">{version}</span>}
            </a>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-emerald-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl" />
        </div>
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_40%,transparent_100%)]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-emerald-500/40 to-violet-500/40 rounded-[32px]" />
                <AppIcon size={88} className="relative drop-shadow-2xl" />
              </motion.div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-400 tracking-wide font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              macOS · Universal Binary · Free
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-[4.5rem] font-bold leading-[1.05] tracking-tight mb-6">
              <span className="text-white">Skill Hub</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
                for AI Agents.
              </span>
            </h1>

            <p className="text-lg text-zinc-400 mb-12 max-w-xl mx-auto leading-relaxed">
              Discover, create, and sync agent skills across Cursor, Claude Code,
              OpenCode, Windsurf — and 8 more. Fully local. No cloud.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={dmgAsset?.browser_download_url ?? '#'}
                className="group relative flex items-center gap-3 px-7 py-3.5 rounded-xl font-semibold text-[15px] bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.5),0_8px_32px_rgba(16,185,129,0.25)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.7),0_12px_40px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download for Mac
                {version && (
                  <span className="px-2 py-0.5 text-xs font-mono bg-black/25 rounded-md text-emerald-100">
                    {version}
                  </span>
                )}
              </a>
              <a
                href="#features"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-medium text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 transition-all duration-200"
              >
                See what&apos;s inside
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {!loading && !dmgAsset && (
              <p className="mt-6 text-sm text-zinc-600 font-mono">
                // no release yet — check back soon
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Terminal Preview ── */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl border border-white/10 bg-[#0D0D10] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_64px_rgba(0,0,0,0.5)]"
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className="ml-3 text-xs text-zinc-600 font-mono">xskill — skill manager</span>
            </div>
            {/* Content */}
            <div className="p-6 space-y-3">
              <TerminalLine text="xskill sync --all" delay={400} />
              <div className="font-mono text-sm text-zinc-500 pl-6 space-y-1.5 pt-1">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                  <span className="text-emerald-500">✓</span> Cursor          <span className="text-zinc-600">synced 12 skills</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>
                  <span className="text-emerald-500">✓</span> Claude Code     <span className="text-zinc-600">synced 12 skills</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                  <span className="text-emerald-500">✓</span> OpenCode        <span className="text-zinc-600">synced 12 skills</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
                  <span className="text-emerald-500">✓</span> Windsurf        <span className="text-zinc-600">synced 12 skills</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.9 }} className="pt-2">
                  <span className="text-zinc-500">Done in </span><span className="text-white">0.4s</span>
                  <span className="text-zinc-600"> · 4 agents updated</span>
                </motion.div>
              </div>
              <TerminalLine text="xskill create --name react-perf-audit" delay={3400} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5.4 }}
                className="font-mono text-sm text-zinc-500 pl-6 space-y-1.5 pt-1"
              >
                <div><span className="text-violet-400">→</span> Created <span className="text-white">~/.xskill/skills/react-perf-audit/</span></div>
                <div><span className="text-violet-400">→</span> Scaffolded SKILL.md, scripts/, references/, assets/</div>
                <div><span className="text-emerald-500">✓</span> Added to Hub automatically</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs font-mono text-emerald-500 tracking-widest uppercase mb-4">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight max-w-xl">
              Everything a skill-heavy developer needs.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {features.map((f, i) => (
              <motion.div
                key={f.tag}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group p-7 bg-[#09090B] hover:bg-[#0D0D10] transition-colors duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <span className="font-mono text-[11px] text-zinc-700 tracking-widest">{f.tag}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/80 transition-all duration-300 mt-1" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported Agents ── */}
      <section id="supported" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-xs font-mono text-emerald-500 tracking-widest uppercase mb-4">Supported</p>
            <h2 className="text-3xl font-bold text-white">Works with the tools you already use.</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2"
          >
            {agents.map((agent, i) => (
              <motion.div
                key={agent}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/8 bg-white/[0.03] text-sm text-zinc-300 hover:border-emerald-500/30 hover:text-white hover:bg-emerald-500/5 transition-all duration-200"
              >
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                {agent}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-[#09090B] to-violet-950/60" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            <div className="relative px-10 py-14 text-center">
              <div className="flex justify-center mb-6">
                <AppIcon size={52} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ready to unify your skills?
              </h2>
              <p className="text-zinc-400 mb-10 max-w-md mx-auto">
                Free. Local. No account required. Works on Apple Silicon and Intel.
              </p>
              <a
                href={dmgAsset?.browser_download_url ?? '#'}
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-xl font-semibold bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.5),0_8px_32px_rgba(16,185,129,0.2)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.7),0_12px_48px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download xskill
                {version && (
                  <span className="px-2 py-0.5 text-xs font-mono bg-black/30 rounded text-emerald-100">
                    {version}
                  </span>
                )}
                <ArrowRight className="w-4 h-4" />
              </a>
              {!loading && !dmgAsset && (
                <p className="mt-4 text-sm text-zinc-600 font-mono">// no release available yet</p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AppIcon size={22} />
            <span className="text-sm font-semibold text-white">xskill</span>
            {version && <span className="text-xs text-zinc-700 font-mono">{version}</span>}
          </div>
          <p className="text-sm text-zinc-700 font-mono">
            © {new Date().getFullYear()} xskill
          </p>
        </div>
      </footer>
    </div>
  );
}
