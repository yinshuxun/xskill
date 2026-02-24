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

export function ProjectsPage() {
  const { projects, loadingProjects, scanProjects, skills } = useAppStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applyingSkillsProject, setApplyingSkillsProject] = useState<Project | null>(null);
  const [managingProject, setManagingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Initial scan if empty
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

  // Filter Hub skills for ApplySkillsDialog
  const hubSkills = useMemo(() => {
    return skills.filter(s => s.path.includes(".xskill/hub") || s.path.includes(".xskill/skills"));
  }, [skills]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Workspace Projects</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Automatically scanned from your workspace directories.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end max-w-md">
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search projects..." 
                    className="pl-9 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" size="icon" onClick={() => scanProjects()} disabled={loadingProjects}>
                <RefreshCw className={`h-4 w-4 ${loadingProjects ? "animate-spin" : ""}`} />
            </Button>
        </div>
      </div>

      {loadingProjects && projects.length === 0 && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <FolderSearch className="mr-2 h-4 w-4 animate-pulse" /> Scanning directories...
        </div>
      )}

      {!loadingProjects && filteredProjects.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
          <FolderSearch className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p>No matching projects found.</p>
          {projects.length === 0 && (
            <p className="text-xs mt-1">(~/workspace, ~/projects, ~/codes, ~/dev)</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.map((project) => (
          <Card key={project.path} className="flex flex-row items-center p-4 gap-4 hover:border-primary/50 transition-all duration-200 group bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <div className="h-12 w-12 bg-secondary/50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-border/50">
              <Box className="h-6 w-6 opacity-70" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold truncate" title={project.name}>{project.name}</h3>
                <div className="flex gap-1.5">
                  {project.has_git && (
                    <Badge variant="outline" className="text-[10px] px-1.5 h-5 gap-1 bg-background/50">
                      <GitBranch className="h-3 w-3" /> Git
                    </Badge>
                  )}
                  {project.has_mcp && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 gap-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">
                      <Box className="h-3 w-3" /> MCP
                    </Badge>
                  )}
                  {project.has_agents_md && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 gap-1 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20">
                      <FileText className="h-3 w-3" /> AGENTS
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate font-mono mt-1" title={project.path}>
                {project.path}
              </p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => setManagingProject(project)} className="h-8">
                  <Settings className="mr-2 h-3.5 w-3.5" /> Manage
                </Button>
                <Button variant="outline" size="sm" onClick={() => setApplyingSkillsProject(project)} className="h-8 shadow-sm">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Add Skills
                </Button>
                <Button variant="default" size="sm" onClick={() => setSelectedProject(project)} className="h-8 shadow-sm shadow-primary/20">
                  <Layers className="mr-2 h-3.5 w-3.5" /> Apply Suite
                </Button>
            </div>
          </Card>
        ))}
      </div>

      <ApplySuiteDialog
        isOpen={!!selectedProject}
        onClose={() => {
          setSelectedProject(null);
          scanProjects(); // Refresh to show updated badges
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
          // Ideally refresh project skills if we had that state, but scanProjects only checks metadata
          scanProjects();
        }}
        project={managingProject}
      />
    </div>
  );
}
