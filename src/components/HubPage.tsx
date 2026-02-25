import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ScanSearch, RefreshCw, LayoutGrid, Search } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import type { LocalSkill, Tool } from "@/hooks/useAppStore";
import { motion, AnimatePresence } from "framer-motion";

interface HubPageProps {
  skills: LocalSkill[];
  loading: boolean;
  onRefresh: () => void;
  tools: Tool[];
  onConfigure: (skill: LocalSkill) => void;
  onImport: () => void;
  onNewSkill: () => void;
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

export function HubPage({ skills, loading, onRefresh, tools, onConfigure, onImport, onNewSkill }: HubPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const hubSkills = skills.filter(
    (s) => (s.path.includes(".xskill/hub") || s.path.includes(".xskill/skills")) &&
           (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ); 

  const installedTools = tools.filter((t) => t.installed);

  return (
    <div className="min-h-full pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sticky top-0 z-50 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md px-10 py-6 border-b border-border/5 shadow-sm mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Central Hub</h2>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">
            Manage all your agent skills in the master repository.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:max-w-xl justify-end">
            <div className="relative w-full max-w-[240px] group">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search skills..." 
                    className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} className="h-10 w-10 shrink-0 rounded-xl border-border/50 shadow-sm active:scale-95 transition-transform">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <div className="h-8 w-px bg-border/50 mx-1" />
            <Button variant="outline" onClick={onImport} className="h-10 rounded-xl shadow-sm hover:shadow transition-all border-border/50 bg-background font-medium whitespace-nowrap">
              <ScanSearch className="mr-2 h-4 w-4 opacity-70" /> Import
            </Button>
            <Button onClick={onNewSkill} className="h-10 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-transform active:scale-[0.98] whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> New Skill
            </Button>
        </div>
      </div>

      <div className="px-10">
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mb-4 text-primary" />
          <p className="text-sm font-medium tracking-wide animate-pulse">Syncing ecosystem...</p>
        </div>
      )}

      {!loading && hubSkills.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 text-center text-muted-foreground/60 border border-dashed border-border/50 rounded-3xl bg-background/30"
        >
          <div className="h-16 w-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <LayoutGrid className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-base font-medium text-foreground/80">No skills found</p>
          <p className="text-sm mt-1">Import from marketplace or craft a new one.</p>
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {hubSkills.map((skill) => (
            <motion.div key={skill.path} variants={itemVariants} layoutId={skill.path}>
              <SkillCard
                skill={skill}
                tools={tools}
                syncedTools={installedTools.filter(
                  (t) => t.key !== skill.tool_key 
                )}
                onConfigure={() => onConfigure(skill)}
                onRefresh={onRefresh}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      </div>
    </div>
  );
}
