import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, RefreshCw, Link as LinkIcon, ArrowUpCircle, Folder, Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip-simple";
import type { LocalSkill, Tool } from "@/hooks/useAppStore";

export function SkillCard({ 
  skill, 
  tools,
  syncedTools,
  onConfigure,
  onRefresh
}: { 
  skill: LocalSkill; 
  tools: Tool[];
  syncedTools?: Tool[];
  onConfigure: () => void;
  onRefresh: () => void;
}) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showSyncMenu, setShowSyncMenu] = useState(false);

  // Determine tier based on path
  const isHub = skill.path.includes(".xskill/hub") || skill.path.includes(".xskill/skills");
  const isProject = skill.path.includes(".agent/skills") || skill.path.includes(".cursor/skills") && !skill.path.includes("~");
  const tier = isHub ? "Hub" : isProject ? "Project" : "Agent";
  
  const tierColor = tier === "Hub" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                    tier === "Project" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" : 
                    "bg-orange-500/10 text-orange-500 border-orange-500/20";

  // Filter out the tool that this skill belongs to (if any) from the sync list,
  // but keep all installed tools available for syncing
  const installedTools = tools.filter((t) => t.installed);

  const handleSync = async (targetKey: string, mode: "copy" | "link") => {
    setSyncing(`${targetKey}-${mode}`);
    try {
      await invoke("sync_skill", {
        skillDir: skill.path,
        targetToolKeys: [targetKey],
        mode,
      });
      setShowSyncMenu(false);
      onRefresh();
    } catch (err) {
      alert(`Sync failed: ${err}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleCollect = async () => {
    try {
      await invoke("skill_collect_to_hub", { skillDir: skill.path });
      onRefresh();
    } catch (err) {
      alert(`Collect failed: ${err}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete skill "${skill.name}"?\nThis action cannot be undone.`)) {
      return;
    }
    try {
      await invoke("delete_skill", { path: skill.path });
      onRefresh();
    } catch (err) {
      alert(`Delete failed: ${err}`);
    }
  };

  return (
    <Card className="flex flex-col group hover:border-primary/50 transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
      {/* Subtle gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <CardHeader className="pb-3 space-y-2">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors truncate" title={skill.name}>{skill.name}</CardTitle>
          </div>
          <Badge variant="secondary" className={`shrink-0 text-[10px] px-2 h-5 font-medium ${tierColor}`}>
            {tier}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 text-sm text-muted-foreground/80 h-10">{skill.description || "No description provided."}</CardDescription>
      </CardHeader>
      
      <CardContent className="py-0 flex-1">
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground/70 bg-muted/40 p-2 rounded-md font-mono truncate border border-border/30" title={skill.path}>
          <Folder className="h-3 w-3 shrink-0" />
          <span className="truncate">{skill.path.replace(/\/Users\/[^/]+/, '~')}</span>
        </div>
        
        {syncedTools && syncedTools.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {syncedTools.map(tool => (
              <Badge key={tool.key} variant="outline" className="text-[10px] h-5 px-2 border-primary/20 bg-primary/5 text-primary font-normal shadow-sm">
                {tool.display_name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-4 pt-4 pb-4 border-t border-border/40 flex justify-between items-center bg-muted/20">
        <div className="flex gap-1">
          <Tooltip content="Configure Skill">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={onConfigure}>
              <Wrench className="h-4 w-4" />
            </Button>
          </Tooltip>
          
          {tier !== "Hub" && (
            <Tooltip content="Collect to Hub">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 transition-colors" onClick={handleCollect}>
                <ArrowUpCircle className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Tooltip content="Sync to other agents">
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 text-xs font-medium bg-background border border-border/50 text-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 shadow-sm transition-all"
                onClick={() => setShowSyncMenu(!showSyncMenu)}
              >
                <RefreshCw className="mr-1.5 h-3 w-3" /> Sync
              </Button>
            </Tooltip>
            
            {showSyncMenu && installedTools.length > 0 && (
              <div className="absolute right-0 bottom-full mb-2 z-50 bg-popover border border-border rounded-lg shadow-xl w-[240px] overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                  Sync to Agent
                </div>
                <div className="p-1 max-h-[200px] overflow-y-auto">
                  {installedTools.map((t) => (
                    <div key={t.key} className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-md group/item">
                      <span className="text-sm text-foreground/90 truncate mr-2" title={t.display_name}>{t.display_name}</span>
                      <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                        <Tooltip content="Copy Skill" side="left">
                          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={syncing === `${t.key}-copy`} onClick={() => handleSync(t.key, "copy")}>
                            <RefreshCw className={`h-3 w-3 ${syncing === `${t.key}-copy` ? "animate-spin" : ""}`} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Symlink Skill" side="left">
                          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={syncing === `${t.key}-link`} onClick={() => handleSync(t.key, "link")}>
                            <LinkIcon className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Tooltip content="Delete Skill">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}
