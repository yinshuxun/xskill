import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuitesStore, type Suite } from "@/hooks/useSuitesStore";
import { Layers, CheckCircle2, RefreshCw } from "lucide-react";
import type { Project } from "@/hooks/useAppStore";

export function ApplySuiteDialog({
  isOpen,
  onClose,
  project,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}) {
  const { suites } = useSuitesStore();
  const [applyingSuite, setApplyingSuite] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async (suite: Suite) => {
    if (!project) return;
    
    setApplyingSuite(suite.id);
    setError(null);
    setSuccess(false);
    
    try {
      await invoke("apply_suite", {
        projectPath: project.path,
        suite: suite
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      console.error("Apply failed", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplyingSuite(null);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply Suite to Project</DialogTitle>
          <DialogDescription className="truncate" title={project.path}>
            {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {suites.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Layers className="mx-auto h-8 w-8 mb-3 opacity-40" />
              <p>No suites available. Create one in the Suites tab first.</p>
            </div>
          ) : (
            suites.map((suite) => (
              <div 
                key={suite.id} 
                className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors
                  ${success && applyingSuite === suite.id ? "bg-green-500/10 border-green-500/30" : "bg-card hover:bg-accent/50"}
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{suite.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{suite.description}</p>
                  </div>
                  <Badge variant="outline">{suite.loadout_skills.length} Skills</Badge>
                </div>
                
                <div className="flex justify-end mt-2">
                  {success && applyingSuite === suite.id ? (
                    <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-500 pointer-events-none">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Applied
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => handleApply(suite)}
                      disabled={!!applyingSuite}
                    >
                      {applyingSuite === suite.id ? (
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Applying...</>
                      ) : (
                        "Apply Suite"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/20 mt-2">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={!!applyingSuite}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
