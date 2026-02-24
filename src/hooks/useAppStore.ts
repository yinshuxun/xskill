import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";

export interface LocalSkill {
  name: string;
  description: string;
  path: string;
  tool_key: string;
  disable_model_invocation: boolean;
  allowed_tools: string[];
  content: string;
}

export interface Tool {
  key: string;
  display_name: string;
  skills_dir: string;
  installed: boolean;
}

export interface FeedEntry {
  id: string;
  label: string;
  url: string;
}

const STORE_FILE = "xskill.json";
const KEY_FEEDS = "feeds";

const DEFAULT_FEEDS: FeedEntry[] = [
  {
    id: "default-opencode",
    label: "OpenCode Built-in",
    url: "https://raw.githubusercontent.com/opencode-ai/skills/main/registry.json",
  },
];

export interface Project {
  path: string;
  name: string;
  has_git: boolean;
  has_mcp: boolean;
  has_agents_md: boolean;
}

export function useAppStore() {
  const [skills, setSkills] = useState<LocalSkill[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [feeds, setFeedsState] = useState<FeedEntry[]>(DEFAULT_FEEDS);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const loadSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const result = await invoke<LocalSkill[]>("get_all_local_skills");
      setSkills(result);
    } catch {
      setSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  const scanProjects = useCallback(async (extraRoots?: string[]) => {
    setLoadingProjects(true);
    try {
      const result = await invoke<Project[]>("scan_workspace", { extraRoots });
      setProjects(result);
    } catch (e) {
      console.error(e);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadTools = useCallback(async () => {
    try {
      const result = await invoke<Tool[]>("get_installed_tools");
      setTools(result);
    } catch {
      setTools([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const store = await load(STORE_FILE, { defaults: {} });
        const savedFeeds = await store.get<FeedEntry[]>(KEY_FEEDS);
        if (!cancelled && savedFeeds && savedFeeds.length > 0) {
          setFeedsState(savedFeeds);
        }
      } catch {
        // ignore
      }
    })();

    loadSkills();
    loadTools();

    return () => {
      cancelled = true;
    };
  }, [loadSkills, loadTools]);

  const refreshSkills = useCallback(() => {
    loadSkills();
  }, [loadSkills]);

  const persistFeeds = useCallback(async (updated: FeedEntry[]) => {
    setFeedsState(updated);
    try {
      const store = await load(STORE_FILE, { defaults: {} });
      await store.set(KEY_FEEDS, updated);
      await store.save();
    } catch {
      // ignore
    }
  }, []);

  return { 
    skills, 
    tools, 
    feeds, 
    loadingSkills, 
    projects, 
    loadingProjects, 
    persistFeeds, 
    refreshSkills, 
    scanProjects 
  };
}
