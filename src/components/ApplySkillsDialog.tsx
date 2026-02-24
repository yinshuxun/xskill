import { useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, CheckCircle2 } from "lucide-react";
import type { Project, LocalSkill } from "@/hooks/useAppStore";
import type { Suite } from "@/hooks/useSuitesStore";

interface ApplySkillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  skills: LocalSkill[]; // Should be Hub skills
}

export function ApplySkillsDialog({ isOpen, onClose, project, skills }: ApplySkillsDialogProps) {
  const [selectedSkillPaths, setSelectedSkillPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [skills, searchQuery]);

  const handleToggle = (path: string) => {
    const next = new Set(selectedSkillPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedSkillPaths(next);
  };

  const handleApply = async () => {
    if (!project || selectedSkillPaths.size === 0) return;
    
    setApplying(true);
    setError(null);
    setSuccess(false);
    
    // Construct a temporary suite
    const tempSuite: Suite = {
      id: "temp-apply-skills",
      name: "Manual Selection",
      description: "Manually selected skills",
      loadout_skills: Array.from(selectedSkillPaths),
      policy_rules: ""
    };

    try {
      await invoke("apply_suite", {
        projectPath: project.path,
        suite: tempSuite
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedSkillPaths(new Set());
      }, 1500);
    } catch (err: unknown) {
      console.error("Apply failed", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplying(false);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Apply Skills to Project</DialogTitle>
          <DialogDescription className="truncate" title={project.path}>
            Select skills to install into {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 my-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search skills..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
            />
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md p-2 min-h-[300px]">
          {filteredSkills.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <p>No matching skills found.</p>
            </div>
          ) : (
            <div className="space-y-1">
                {filteredSkills.map(skill => {
                    const isSelected = selectedSkillPaths.has(skill.path);
                    return (
                        <div 
                            key={skill.path} 
                            className={`flex items-start gap-3 p-3 rounded-md border transition-colors cursor-pointer hover:bg-accent/50 ${isSelected ? "bg-accent border-primary/50" : "bg-card border-transparent"}`}
                            onClick={() => handleToggle(skill.path)}
                        >
                            <Checkbox 
                                checked={isSelected}
                                onCheckedChange={() => handleToggle(skill.path)}
                                id={skill.path}
                            />
                            <div className="flex-1 grid gap-1">
                                <label htmlFor={skill.path} className="text-sm font-medium leading-none cursor-pointer">
                                    {skill.name}
                                </label>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {skill.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
          )}
        </div>

        {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20">
                <strong>Error:</strong> {error}
            </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="text-xs text-muted-foreground">
                {selectedSkillPaths.size} skills selected
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={applying}>Cancel</Button>
                {success ? (
                    <Button variant="ghost" className="text-green-500 hover:text-green-500 pointer-events-none">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Applied
                    </Button>
                ) : (
                    <Button onClick={handleApply} disabled={applying || selectedSkillPaths.size === 0}>
                        {applying ? (
                            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Applying...</>
                        ) : (
                            "Apply Selected"
                        )}
                    </Button>
                )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
