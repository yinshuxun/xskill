import { useState, useEffect, useCallback } from "react";
import { load } from "@tauri-apps/plugin-store";

export interface Skill {
  id: string;
  name: string;
  desc: string;
  skill_type: string;
  status: string;
  path?: string;
  repo_url?: string;
}

export interface FeedEntry {
  id: string;
  label: string;
  url: string;
}

const STORE_FILE = "xskill.json";
const KEY_SKILLS = "skills";
const KEY_FEEDS = "feeds";

const DEFAULT_SKILLS: Skill[] = [
  { id: "1", name: "Jira Helper", desc: "Manage your Jira tickets via Vibe Coding.", skill_type: "Internal", status: "Active" },
  { id: "2", name: "Figma MCP", desc: "Read and generate Figma components.", skill_type: "Public", status: "Inactive" },
  { id: "3", name: "Local RAG", desc: "Query company docs securely.", skill_type: "Internal", status: "Active" },
];

const DEFAULT_FEEDS: FeedEntry[] = [
  {
    id: "default-opencode",
    label: "OpenCode Built-in",
    url: "https://raw.githubusercontent.com/opencode-ai/skills/main/registry.json",
  },
];

export function useAppStore() {
  const [skills, setSkillsState] = useState<Skill[]>(DEFAULT_SKILLS);
  const [feeds, setFeedsState] = useState<FeedEntry[]>(DEFAULT_FEEDS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const store = await load(STORE_FILE, { defaults: {} });
        const savedSkills = await store.get<Skill[]>(KEY_SKILLS);
        const savedFeeds = await store.get<FeedEntry[]>(KEY_FEEDS);
        if (!cancelled) {
          if (savedSkills && savedSkills.length > 0) setSkillsState(savedSkills);
          if (savedFeeds && savedFeeds.length > 0) setFeedsState(savedFeeds);
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistSkills = useCallback(async (updated: Skill[]) => {
    setSkillsState(updated);
    try {
      const store = await load(STORE_FILE, { defaults: {} });
      await store.set(KEY_SKILLS, updated);
      await store.save();
    } catch {}
  }, []);

  const persistFeeds = useCallback(async (updated: FeedEntry[]) => {
    setFeedsState(updated);
    try {
      const store = await load(STORE_FILE, { defaults: {} });
      await store.set(KEY_FEEDS, updated);
      await store.save();
    } catch {}
  }, []);

  return { skills, feeds, ready, persistSkills, persistFeeds };
}
