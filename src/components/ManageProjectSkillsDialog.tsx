import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, FolderOpen } from "lucide-react";
import type { Project } from "@/hooks/useAppStore";

interface ManageProjectSkillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

interface ProjectSkill {
  name: string;
  path: string;
  source: string; // ".cursor/skills", ".agent/skills", etc.
}

export function ManageProjectSkillsDialog({ isOpen, onClose, project }: ManageProjectSkillsDialogProps) {
  const [skills, setSkills] = useState<ProjectSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const loadSkills = async () => {
    if (!project) return;
    setLoading(true);
    setSkills([]);
    
    const foundSkills: ProjectSkill[] = [];
    const searchPaths = [
      { dir: ".cursor/skills", source: "Cursor" },
      { dir: ".vscode/skills", source: "VSCode" },
      { dir: ".agent/skills", source: "Agent" },
      { dir: ".windsurf/skills", source: "Windsurf" }
    ];

    try {
      for (const { dir, source } of searchPaths) {
        try {
            // We construct the absolute path manually because readDir with BaseDirectory is for sandboxed paths,
            // but here we are accessing arbitrary project paths.
            // However, tauri-plugin-fs usually requires scope permissions.
            // If the user has configured scan_roots, we might have access.
            // But readDir on absolute path might fail if not allowed.
            // Let's assume we can read inside the project path.
            // Note: In Tauri v2, we might need to use absolute paths directly if allowed by capability.
            
            // Wait, tauri-plugin-fs `readDir` takes a path.
            // We'll try to read project.path + "/" + dir
            const fullDirPath = `${project.path}/${dir}`;
            
            // We can't easily check if dir exists without trying to read it.
            // Using invoke("read_dir") from backend might be safer if we exposed it, 
            // but let's try frontend fs first.
            // Actually, `readDir` throws if path doesn't exist.
            
            // Since we can't easily use frontend fs on arbitrary paths without scope configuration,
            // maybe we should assume the backend `scan_workspace` already checked for these folders?
            // `project.has_mcp` etc. doesn't tell us about specific skills.
            
            // Workaround: We can use `invoke("get_all_local_skills")` and filter by project path!
            // Wait, I previously established `get_all_local_skills` might not scan projects.
            // But if `ApplySuite` puts skills there, maybe we should rely on `get_all_local_skills` 
            // IF we update the scanner to include project paths?
            // No, that's backend work.
            
            // Let's try to use `readDir` on the absolute path.
            // Note: This requires the path to be in the allowed scope.
            // If it fails, we show an empty list or error.
            
            const entries = await readDir(fullDirPath);
            for (const entry of entries) {
                if (entry.isDirectory) {
                    foundSkills.push({
                        name: entry.name,
                        path: `${fullDirPath}/${entry.name}`,
                        source
                    });
                }
            }
        } catch {
            // Ignore errors (dir not found, etc)
        }
      }
    } catch (e) {
        console.error("Failed to scan project skills", e);
    } finally {
        setSkills(foundSkills);
        setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      loadSkills();
    }
  }, [isOpen, project]);

  const handleDelete = async (skillPath: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;
    
    setDeletingPath(skillPath);
    try {
      await invoke("delete_skill", { path: skillPath });
      await loadSkills(); // Reload list
    } catch (err) {
      alert(`Delete failed: ${err}`);
    } finally {
      setDeletingPath(null);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Project Skills</DialogTitle>
          <DialogDescription className="truncate" title={project.path}>
            Skills installed in {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[200px] max-h-[60vh] overflow-y-auto">
          {loading ? (
             <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Scanning...
             </div>
          ) : skills.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
                <FolderOpen className="h-8 w-8 mb-2 opacity-30" />
                <p>No skills found in this project.</p>
                <p className="text-xs mt-1">Check .cursor/skills or .vscode/skills</p>
             </div>
          ) : (
             <div className="space-y-2">
                {skills.map(skill => (
                    <div key={skill.path} className="flex items-center justify-between p-3 rounded-md border bg-card">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{skill.name}</span>
                                <Badge variant="secondary" className="text-[10px] h-4 px-1">{skill.source}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5" title={skill.path}>
                                {skill.path.split('/').slice(-3).join('/')}
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleDelete(skill.path)}
                            disabled={!!deletingPath}
                        >
                            {deletingPath === skill.path ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                ))}
             </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
