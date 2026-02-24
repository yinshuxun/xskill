import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, RefreshCw, Link as LinkIcon, ArrowUpCircle, Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip-simple";
import { AgentIcons } from "@/components/ui/icons";
import type { LocalSkill, Tool } from "@/hooks/useAppStore";

interface SkillCardProps {
  skill: LocalSkill;
  tools: Tool[];
  syncedTools?: Tool[];
  onRefresh: () => void;
  onConfigure: (skill: LocalSkill) => void;
}

export function SkillCard({ skill, tools, syncedTools = [], onRefresh, onConfigure }: SkillCardProps) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showSyncMenu, setShowSyncMenu] = useState(false);

  // Determine skill tier
  let tier = "Project";
  let tierColor = "bg-slate-100 text-slate-700 border-slate-200";
  
  if (skill.path.includes(".xskill/hub") || skill.path.includes(".xskill/skills")) {
    tier = "Hub";
    tierColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (tools.some(t => skill.path.includes(`.${t.key}/`))) {
    tier = "Agent";
    tierColor = "bg-blue-50 text-blue-700 border-blue-200";
  }

  // Find which tools have this skill installed (by name matching for now, simplistic)
  // In a real app, we'd check if the skill exists in the tool's dir
  // For now, let's just use the `tools` prop which contains ALL tools, and filter for installed ones
  const installedTools = tools.filter(t => t.installed);

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

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${skill.name}"?\nThis action cannot be undone.`)) return;
    
    try {
      await invoke("delete_skill", { skillPath: skill.path });
      onRefresh();
    } catch (err) {
      alert(`Delete failed: ${err}`);
    }
  };

  const handleCollect = async () => {
    try {
      await invoke("skill_collect_to_hub", { skillPath: skill.path });
      onRefresh();
    } catch (err) {
      alert(`Collect failed: ${err}`);
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow group relative overflow-visible">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold leading-tight">{skill.name}</CardTitle>
            <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium ${tierColor}`}>
              {tier} Skill
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-2">
        <CardDescription className="line-clamp-3 text-xs mb-4">
          {skill.description || "No description provided."}
        </CardDescription>
        
        <div className="text-[10px] text-muted-foreground font-mono bg-muted/50 p-1.5 rounded truncate" title={skill.path}>
          {skill.path}
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
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => onConfigure(skill)}>
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
              <div className="absolute right-0 bottom-full mb-2 z-50 bg-popover border border-border rounded-lg shadow-xl w-[340px] overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Sync to Agent</span>
                  <Badge variant="secondary" className="text-[10px] h-5 font-normal text-muted-foreground">
                    {installedTools.length} Active
                  </Badge>
                </div>
                <div className="p-2 grid grid-cols-1 gap-1 max-h-[320px] overflow-y-auto">
                  {installedTools.map((t) => {
                    const Icon = AgentIcons[t.key] || AgentIcons.cursor;
                    return (
                      <div key={t.key} className="flex items-center justify-between px-3 py-2 hover:bg-accent rounded-md group/item transition-all border border-transparent hover:border-border/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-md bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-sm group-hover/item:border-primary/20 group-hover/item:shadow-md transition-all">
                            <Icon className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors" />
                          </div>
                          <span className="text-sm text-foreground/90 truncate font-medium" title={t.display_name}>{t.display_name}</span>
                        </div>
                        <div className="flex gap-1 opacity-80 group-hover/item:opacity-100 transition-opacity shrink-0">
                          <Tooltip content="Copy Skill (Standard)" side="left">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" disabled={syncing === `${t.key}-copy`} onClick={() => handleSync(t.key, "copy")}>
                              <RefreshCw className={`h-3.5 w-3.5 ${syncing === `${t.key}-copy` ? "animate-spin" : ""}`} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Link Skill (Live Update)" side="left">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-600" disabled={syncing === `${t.key}-link`} onClick={() => handleSync(t.key, "link")}>
                              <LinkIcon className="h-3.5 w-3.5" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          
          <Tooltip content="Delete Skill">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}
