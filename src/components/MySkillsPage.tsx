import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, BookOpen, Search } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import type { LocalSkill, Tool } from "@/hooks/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

interface MySkillsPageProps {
  skills: LocalSkill[];
  loading: boolean;
  onRefresh: () => void;
  tools: Tool[];
  onConfigure: (skill: LocalSkill) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function MySkillsPage({ skills, loading, onRefresh, tools, onConfigure }: MySkillsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const skillGroups = new Map<string, { skill: LocalSkill, agents: Tool[] }>();

  skills.forEach(skill => {
    const agent = tools.find(t => 
      skill.path.includes(`.${t.key}/skills`) || 
      skill.path.includes(`.${t.key}/rules`) ||
      skill.tool_key === t.key
    );

    if (agent) {
      if (searchQuery && !skill.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !skill.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }

      const existing = skillGroups.get(skill.name);
      if (existing) {
        if (!existing.agents.some(a => a.key === agent.key)) {
          existing.agents.push(agent);
        }
      } else {
        skillGroups.set(skill.name, { skill, agents: [agent] });
      }
    }
  });

  const uniqueAgentSkills = Array.from(skillGroups.values());

  return (
    <>
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Installed Skills</h2>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">
            Skills actively running in your AI Agents.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:max-w-md">
            <div className="relative w-full group">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search installed skills..." 
                    className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} className="h-10 w-10 rounded-xl border-border/50 shadow-sm active:scale-95 transition-transform">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mb-4 text-primary" />
          <p className="text-sm font-medium tracking-wide animate-pulse">Scanning IDEs...</p>
        </div>
      )}

      {!loading && uniqueAgentSkills.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 text-center text-muted-foreground/60 border border-dashed border-border/50 rounded-3xl bg-background/30"
        >
          <div className="h-16 w-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <BookOpen className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-base font-medium text-foreground/80">No active skills found</p>
          <p className="text-sm mt-1">Go to the Hub to sync skills to your agents.</p>
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {uniqueAgentSkills.map(({ skill, agents }) => (
            <motion.div key={skill.name} variants={itemVariants} layoutId={`installed-${skill.name}`}>
              <SkillCard
                skill={skill}
                tools={tools}
                syncedTools={agents}
                onConfigure={() => onConfigure(skill)}
                onRefresh={onRefresh}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
