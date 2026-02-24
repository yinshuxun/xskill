import { useState, useEffect, useMemo } from "react";
import { useAppStore, type Project } from "@/hooks/useAppStore";
import { ApplySuiteDialog } from "@/components/ApplySuiteDialog";
import { ApplySkillsDialog } from "@/components/ApplySkillsDialog";
import { ManageProjectSkillsDialog } from "@/components/ManageProjectSkillsDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, FolderSearch, GitBranch, Box, FileText, Layers, Plus, Settings, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function ProjectsPage() {
  const { projects, loadingProjects, scanProjects, skills } = useAppStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applyingSkillsProject, setApplyingSkillsProject] = useState<Project | null>(null);
  const [managingProject, setManagingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (projects.length === 0) {
      scanProjects();
    }
  }, [scanProjects, projects.length]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const hubSkills = useMemo(() => {
    return skills.filter(s => s.path.includes(".xskill/hub") || s.path.includes(".xskill/skills"));
  }, [skills]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workspace Projects</h2>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">
            Automatically scanned environments ready for intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:max-w-md">
            <div className="relative w-full group">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search projects..." 
                    className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" size="icon" onClick={() => scanProjects()} disabled={loadingProjects} className="h-10 w-10 rounded-xl border-border/50 shadow-sm active:scale-95 transition-transform">
                <RefreshCw className={`h-4 w-4 ${loadingProjects ? "animate-spin" : ""}`} />
            </Button>
        </div>
      </div>

      {loadingProjects && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <FolderSearch className="h-6 w-6 animate-pulse mb-4 text-primary" />
          <p className="text-sm font-medium tracking-wide">Deep scanning local workspace...</p>
        </div>
      )}

      {!loadingProjects && filteredProjects.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 text-center text-muted-foreground/60 border border-dashed border-border/50 rounded-3xl bg-background/30"
        >
          <div className="h-16 w-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <FolderSearch className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-base font-medium text-foreground/80">No matching projects found</p>
          {projects.length === 0 && (
            <p className="text-xs mt-1">(Looking in ~/workspace, ~/projects, ~/codes, ~/dev)</p>
          )}
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 xl:grid-cols-2 gap-5"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div key={project.path} variants={itemVariants} layoutId={project.path}>
              <Card className="flex flex-col sm:flex-row items-start sm:items-center p-5 gap-5 group bg-card shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-2xl border-border/50">
                <div className="h-14 w-14 bg-secondary/30 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-border/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <Box className="h-6 w-6 opacity-70" />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-base font-semibold truncate tracking-tight text-foreground/90" title={project.name}>{project.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.has_git && (
                        <Badge variant="outline" className="text-[10px] px-2 h-5.5 gap-1.5 bg-background/50 rounded-full font-medium">
                          <GitBranch className="h-3 w-3" /> Git
                        </Badge>
                      )}
                      {project.has_mcp && (
                        <Badge variant="secondary" className="text-[10px] px-2 h-5.5 gap-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-transparent font-medium shadow-sm">
                          <Box className="h-3 w-3" /> MCP
                        </Badge>
                      )}
                      {project.has_agents_md && (
                        <Badge variant="secondary" className="text-[10px] px-2 h-5.5 gap-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border-transparent font-medium shadow-sm">
                          <FileText className="h-3 w-3" /> AGENTS
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 truncate font-mono mt-3 bg-muted/30 px-2 py-1 rounded-md" title={project.path}>
                    {project.path}
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => setManagingProject(project)} className="h-8 rounded-lg text-xs justify-start px-3 bg-muted/20 hover:bg-muted/50">
                      <Settings className="mr-2 h-3.5 w-3.5" /> Manage
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setApplyingSkillsProject(project)} className="h-8 flex-1 rounded-lg text-xs bg-background shadow-sm hover:text-primary hover:border-primary/30">
                        <Plus className="mr-2 h-3 w-3" /> Add
                      </Button>
                      <Button variant="default" size="sm" onClick={() => setSelectedProject(project)} className="h-8 flex-1 rounded-lg text-xs shadow-md shadow-primary/20 hover:bg-primary/90">
                        <Layers className="mr-2 h-3 w-3" /> Suite
                      </Button>
                    </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <ApplySuiteDialog
        isOpen={!!selectedProject}
        onClose={() => {
          setSelectedProject(null);
          scanProjects();
        }}
        project={selectedProject}
      />

      <ApplySkillsDialog
        isOpen={!!applyingSkillsProject}
        onClose={() => {
          setApplyingSkillsProject(null);
          scanProjects();
        }}
        project={applyingSkillsProject}
        skills={hubSkills}
      />

      <ManageProjectSkillsDialog
        isOpen={!!managingProject}
        onClose={() => {
          setManagingProject(null);
          scanProjects();
        }}
        project={managingProject}
      />
    </div>
  );
}
