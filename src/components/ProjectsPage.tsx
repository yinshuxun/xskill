import { useState, useEffect } from "react";
import { useAppStore, type Project } from "@/hooks/useAppStore";
import { ApplySuiteDialog } from "@/components/ApplySuiteDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FolderSearch, GitBranch, Box, FileText, Layers } from "lucide-react";

export function ProjectsPage() {
  const { projects, loadingProjects, scanProjects } = useAppStore();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    // Initial scan if empty
    if (projects.length === 0) {
      scanProjects();
    }
  }, [scanProjects, projects.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Workspace Projects</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Automatically scanned from your workspace directories.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => scanProjects()} disabled={loadingProjects}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingProjects ? "animate-spin" : ""}`} />
          Scan Workspace
        </Button>
      </div>

      {loadingProjects && projects.length === 0 && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <FolderSearch className="mr-2 h-4 w-4 animate-pulse" /> Scanning directories...
        </div>
      )}

      {!loadingProjects && projects.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
          <FolderSearch className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p>No projects found in standard directories.</p>
          <p className="text-xs mt-1">(~/workspace, ~/projects, ~/codes, ~/dev)</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <Card key={project.path} className="flex flex-row items-center p-4 gap-4">
            <div className="h-10 w-10 bg-secondary/50 rounded-md flex items-center justify-center shrink-0">
              <Box className="h-5 w-5 opacity-70" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate" title={project.name}>{project.name}</h3>
                <div className="flex gap-1">
                  {project.has_git && (
                    <Badge variant="outline" className="text-[10px] px-1 h-5 gap-0.5">
                      <GitBranch className="h-3 w-3" /> Git
                    </Badge>
                  )}
                  {project.has_mcp && (
                    <Badge variant="secondary" className="text-[10px] px-1 h-5 gap-0.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">
                      <Box className="h-3 w-3" /> MCP
                    </Badge>
                  )}
                  {project.has_agents_md && (
                    <Badge variant="secondary" className="text-[10px] px-1 h-5 gap-0.5 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20">
                      <FileText className="h-3 w-3" /> AGENTS
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate font-mono mt-0.5" title={project.path}>
                {project.path}
              </p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedProject(project)}>
                  <Layers className="mr-2 h-4 w-4" /> Apply Suite
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
    </div>
  );
}
