import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, FolderOpen, Import } from "lucide-react";
import type { Project, LocalSkill } from "@/hooks/useAppStore";

interface ManageProjectSkillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function ManageProjectSkillsDialog({ isOpen, onClose, project }: ManageProjectSkillsDialogProps) {
  const [skills, setSkills] = useState<LocalSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [importingPath, setImportingPath] = useState<string | null>(null);

  const loadSkills = async () => {
    if (!project) return;
    setLoading(true);
    setSkills([]);
    
    try {
      const result = await invoke<LocalSkill[]>("get_project_skills", { projectPath: project.path });
      setSkills(result || []);
    } catch (e) {
        console.error("Failed to scan project skills", e);
    } finally {
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

  const handleImport = async (skill: LocalSkill) => {
    setImportingPath(skill.path);
    try {
      await invoke("skill_collect_to_hub", { skillDir: skill.path });
      alert(`✅ Skill "${skill.name}" imported to Hub successfully!`);
    } catch (err) {
      alert(`❌ Import failed: ${err}`);
    } finally {
      setImportingPath(null);
    }
  };

  // Group skills by tool_key
  const groupedSkills = skills.reduce((acc, skill) => {
    const key = skill.tool_key || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(skill);
    return acc;
  }, {} as Record<string, LocalSkill[]>);

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
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
             <div className="space-y-6">
                {Object.entries(groupedSkills).map(([toolKey, toolSkills]) => (
                  <div key={toolKey} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1">
                      {toolKey === 'cursor' ? 'Cursor Agent' : 
                       toolKey === 'claude' ? 'Claude Desktop' : 
                       toolKey}
                    </h3>
                    <div className="space-y-2">
                      {toolSkills.map(skill => (
                        <div key={skill.path} className="flex items-center justify-between p-3 rounded-md border bg-card">
                            <div className="min-w-0 pr-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">{skill.name}</span>
                                    {/* <Badge variant="secondary" className="text-[10px] h-4 px-1">{skill.tool_key}</Badge> */}
                                </div>
                                <div className="text-xs text-muted-foreground truncate mt-0.5" title={skill.path}>
                                    {skill.path.split('/').slice(-4).join('/')}
                                </div>
                                {skill.description && (
                                    <div className="text-xs text-muted-foreground/80 truncate mt-1">
                                        {skill.description}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-muted-foreground hover:text-primary shrink-0"
                                    onClick={() => handleImport(skill)}
                                    disabled={!!importingPath}
                                    title="Import to Hub"
                                >
                                    {importingPath === skill.path ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Import className="h-4 w-4" />
                                    )}
                                </Button>
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
                        </div>
                      ))}
                    </div>
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
