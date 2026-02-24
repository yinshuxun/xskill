import { Button } from "@/components/ui/button";
import { RefreshCw, BookOpen } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import type { LocalSkill, Tool } from "@/hooks/useAppStore";

interface MySkillsPageProps {
  skills: LocalSkill[];
  loading: boolean;
  onRefresh: () => void;
  tools: Tool[];
  onConfigure: (skill: LocalSkill) => void;
}

export function MySkillsPage({ skills, loading, onRefresh, tools, onConfigure }: MySkillsPageProps) {
  // My Skills page shows ONLY skills that are actively installed/linked to Agents
  // We need to:
  // 1. Identify which skills are "Agent Skills" (not just raw Hub files)
  // 2. Deduplicate them (e.g. if "create-pr" is in Cursor and Claude, show one card with both badges)
  
  // const installedTools = tools.filter((t) => t.installed);

  // Group skills by name to handle deduplication and find which agents have them
  const skillGroups = new Map<string, { skill: LocalSkill, agents: Tool[] }>();

  skills.forEach(skill => {
    // Determine if this skill instance belongs to an agent
    const agent = tools.find(t => 
      // Simple heuristic: if skill path contains agent's skill dir
      // This might need refinement based on exact path matching logic in backend
      skill.path.includes(`.${t.key}/skills`) || 
      skill.path.includes(`.${t.key}/rules`) ||
      // Or if it was explicitly tagged with tool_key by the backend
      skill.tool_key === t.key
    );

    if (agent) {
      const existing = skillGroups.get(skill.name);
      if (existing) {
        // Add this agent to the list if not already there
        if (!existing.agents.some(a => a.key === agent.key)) {
          existing.agents.push(agent);
        }
        // We keep the existing skill object as the representative, or update if this one is "better" (e.g. Hub source)
        // For My Skills, any instance is fine as representative for metadata
      } else {
        skillGroups.set(skill.name, { skill, agents: [agent] });
      }
    }
  });

  const uniqueAgentSkills = Array.from(skillGroups.values());

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Skills</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Skills actively installed in your Agents.
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

      {!loading && uniqueAgentSkills.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
          <BookOpen className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p>No installed skills found.</p>
          <p className="text-xs mt-1">Go to the Hub to sync skills to your agents.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uniqueAgentSkills.map(({ skill, agents }) => (
          <SkillCard
            key={skill.name} // Use name as key since we are deduplicating
            skill={skill}
            tools={tools}
            syncedTools={agents} // Pass the calculated list of agents that have this skill
            onConfigure={() => onConfigure(skill)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </>
  );
}
