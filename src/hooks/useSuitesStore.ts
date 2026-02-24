import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface Suite {
  id: string;
  name: string;
  description: string;
  policy_rules: string;
  loadout_skills: string[];
}

export function useSuitesStore() {
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuites = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<Suite[]>("load_suites");
      setSuites(result);
    } catch (e) {
      console.error("Failed to load suites", e);
      setSuites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSuites = useCallback(async (updated: Suite[]) => {
    try {
      await invoke("save_suites", { suites: updated });
      setSuites(updated);
    } catch (e) {
      console.error("Failed to save suites", e);
      throw e;
    }
  }, []);

  useEffect(() => {
    loadSuites();
  }, [loadSuites]);

  return {
    suites,
    loading,
    loadSuites,
    saveSuites,
  };
}
