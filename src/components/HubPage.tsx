import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutGrid } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import type { LocalSkill, Tool } from "@/hooks/useAppStore";

interface HubPageProps {
  skills: LocalSkill[];
  loading: boolean;
  onRefresh: () => void;
  tools: Tool[];
  onConfigure: (skill: LocalSkill) => void;
}

export function HubPage({ skills, loading, onRefresh, tools, onConfigure }: HubPageProps) {
  // Hub page shows ALL skills, primarily focusing on the central hub content
  // In v0.3, this acts as the "Master List" of all skills available in the ecosystem
  
  // Filter for skills that are primarily in the Hub
  // We identify Hub skills by their path containing .xskill/hub or .xskill/skills
  const hubSkills = skills.filter(
    (s) => s.path.includes(".xskill/hub") || s.path.includes(".xskill/skills")
  ); 

  const installedTools = tools.filter((t) => t.installed);

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">XSkill Hub</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all your skills in one place.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading skills…
        </div>
      )}

      {!loading && hubSkills.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
          <LayoutGrid className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p>No skills found in the Hub.</p>
          <p className="text-xs mt-1">Import skills or create a new one to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubSkills.map((skill) => (
          <SkillCard
            key={skill.path}
            skill={skill}
            tools={tools}
            syncedTools={installedTools.filter(
              (t) => t.key !== skill.tool_key 
            )}
            onConfigure={() => onConfigure(skill)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </>
  );
}
