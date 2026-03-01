import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Copy, Link, AlertCircle, Folder } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Suite } from "@/hooks/useSuitesStore";
import { useAppStore } from "@/hooks/useAppStore";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SyncSuiteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suite: Suite | null;
}

export function SyncSuiteDialog({ isOpen, onClose, suite }: SyncSuiteDialogProps) {
  const { tools, projects, scanProjects } = useAppStore();
  const [targetType, setTargetType] = useState<"project" | "agent">("project");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("cursor");
  const [mode, setMode] = useState<"copy" | "link">("copy");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSyncing(false);
      if (projects.length === 0) {
        scanProjects();
      }
    }
  }, [isOpen]);

  if (!suite) return null;

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      if (targetType === "project") {
        if (!selectedProject) {
            setError("Please select a project.");
            setSyncing(false);
            return;
        }
        await invoke("apply_suite", {
          projectPath: selectedProject,
          suite: suite,
          agent: selectedAgent,
          mode: mode
        });
      } else {
        await invoke("apply_suite_to_agent", {
          suite: suite,
          agent: selectedAgent,
          mode: mode
        });
      }
      alert(`✅ Suite "${suite.name}" synced successfully!`);
      onClose();
    } catch (err) {
      console.error("Sync failed:", err);
      setError(err as string);
    } finally {
      setSyncing(false);
    }
  };

  const installedTools = tools.filter(t => t.installed);

  const projectItems = projects.map(p => ({
    value: p.path,
    label: p.name,
    icon: <Folder className="h-4 w-4 opacity-50" />
  }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !syncing && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sync Suite: {suite.name}</DialogTitle>
          <DialogDescription>
            Deploy this suite's skills and rules to a Project or an Agent.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <Tabs value={targetType} onValueChange={(v) => setTargetType(v as "project" | "agent")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">Sync to Project</TabsTrigger>
              <TabsTrigger value="agent">Sync to Agent (Global)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="project" className="space-y-4 pt-4">
               <div className="space-y-2">
                <Label>Select Project</Label>
                <Combobox
                  items={projectItems}
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                  placeholder="Select a project..."
                  searchPlaceholder="Search projects..."
                  emptyText="No project found."
                />
                {projects.length === 0 && (
                    <div className="text-xs text-muted-foreground">No projects found. Check Workspace settings.</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Target Agent (Subdirectory)</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {installedTools.map((t) => (
                      <SelectItem key={t.key} value={t.key}>
                        {t.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                    Skills will be synced to <code>{selectedProject ? `${selectedProject.split('/').pop()}/.${selectedAgent === 'vscode' ? 'vscode' : selectedAgent}/skills` : `.../.${selectedAgent}/skills`}</code>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="agent" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Select Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {installedTools.map((t) => (
                      <SelectItem key={t.key} value={t.key}>
                        {t.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                    Skills will be available globally in this agent.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3">
            <Label>Sync Mode</Label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`cursor-pointer flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all ${mode === 'copy' ? 'border-primary bg-primary/5' : 'border-muted bg-popover hover:border-primary/50'}`}
                onClick={() => setMode('copy')}
              >
                <Copy className={`mb-2 h-5 w-5 ${mode === 'copy' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-semibold">Copy</span>
                <span className="text-[10px] text-muted-foreground mt-1 text-center">Independent copy</span>
              </div>
              <div 
                className={`cursor-pointer flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground transition-all ${mode === 'link' ? 'border-primary bg-primary/5' : 'border-muted bg-popover hover:border-primary/50'}`}
                onClick={() => setMode('link')}
              >
                <Link className={`mb-2 h-5 w-5 ${mode === 'link' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-semibold">Link</span>
                <span className="text-[10px] text-muted-foreground mt-1 text-center">Live symlink</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={syncing}>Cancel</Button>
          <Button onClick={handleSync} disabled={syncing || (targetType === "project" && !selectedProject)}>
            {syncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : (mode === "link" ? <Link className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />)}
            {syncing ? "Syncing..." : "Sync Suite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}