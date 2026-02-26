import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, RefreshCw, Link as LinkIcon, ArrowUpCircle, Trash2, Check, Copy, FolderOpen, Eye, FileText } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip-simple";
import { AgentIcons } from "@/components/ui/icons";
import type { LocalSkill, Tool } from "@/hooks/useAppStore";
import { motion } from "framer-motion";

interface SkillCardProps {
  skill: LocalSkill;
  tools: Tool[];
  syncedTools?: Tool[];
  onRefresh: () => void;
  onConfigure: (skill: LocalSkill) => void;
}

export function SkillCard({ skill, tools, syncedTools = [], onRefresh, onConfigure }: SkillCardProps) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(skill.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenFolder = async () => {
    try {
      await invoke("open_folder", { path: skill.path });
    } catch (err) {
      console.error("Failed to open folder:", err);
    }
  };

  // Determine skill tier
  let tier = "Project";
  let tierColor = "bg-slate-100 text-slate-700 border-slate-200";
  
  if (skill.path.includes(".xskill/hub") || skill.path.includes(".xskill/skills")) {
    tier = "Hub";
    tierColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
  } else if (tools.some(t => skill.path.includes(`.${t.key}/`))) {
    tier = "Agent";
    tierColor = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
  }

  const installedTools = tools.filter(t => t.installed);

  const handleSync = async (targetKey: string, mode: "copy" | "link") => {
    setSyncing(`${targetKey}-${mode}`);
    try {
      await invoke("sync_skill", {
        skillDir: skill.path,
        targetToolKeys: [targetKey],
        mode,
      });
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
      await invoke("delete_skill", { path: skill.path });
      onRefresh();
    } catch (err) {
      alert(`Delete failed: ${err}`);
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

  return (
    <>
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-shadow duration-300 group relative overflow-visible rounded-3xl border-border/50">
        <CardHeader className="pb-3 px-6 pt-6">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-semibold tracking-tight text-foreground/90">{skill.name}</CardTitle>
              <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium tracking-wide rounded-full ${tierColor}`}>
                {tier} Skill
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 px-6 pb-2">
          <CardDescription className="line-clamp-3 text-sm leading-relaxed mb-5 text-muted-foreground/80">
            {skill.description || "No description provided."}
          </CardDescription>
          
          <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 pr-2 rounded-xl border border-border/30 group/path">
            <div className="text-[10px] text-muted-foreground/70 font-mono truncate flex-1 pl-1" title={skill.path}>
              {skill.path}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover/path:opacity-100 transition-opacity">
              <Tooltip content="Copy Path">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-background shadow-sm" onClick={handleCopyPath}>
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                </Button>
              </Tooltip>
              <Tooltip content="Open Folder">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-background shadow-sm" onClick={handleOpenFolder}>
                  <FolderOpen className="h-3 w-3 text-muted-foreground" />
                </Button>
              </Tooltip>
              <Tooltip content="View SKILL.md">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-background shadow-sm" onClick={() => setShowPreview(true)}>
                  <Eye className="h-3 w-3 text-muted-foreground" />
                </Button>
              </Tooltip>
            </div>
          </div>
          
          {syncedTools && syncedTools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {syncedTools.map(tool => (
                <Badge key={tool.key} variant="outline" className="text-[10px] h-5 px-2.5 rounded-full border-primary/20 bg-primary/5 text-primary font-medium shadow-sm">
                  {tool.display_name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="mt-5 px-6 py-4 border-t border-border/30 flex justify-between items-center bg-muted/5 rounded-b-3xl">
          <div className="flex gap-1">
            <Tooltip content="Configure Skill">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => onConfigure(skill)}>
                <Wrench className="h-4 w-4" />
              </Button>
            </Tooltip>
            
            {tier !== "Hub" && (
              <Tooltip content="Collect to Hub">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 transition-colors" onClick={handleCollect}>
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
                  className="h-9 px-3 rounded-xl text-xs font-medium bg-background border border-border/50 text-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 shadow-sm transition-all active:scale-[0.97]"
                  onClick={() => setShowSyncDialog(true)}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" /> Sync
                </Button>
              </Tooltip>
            </div>
            
            <Tooltip content="Delete Skill">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        </CardFooter>
      </Card>
    </motion.div>

    <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Sync to Agent</DialogTitle>
        </DialogHeader>
        <div className="px-1 py-2">
            <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available Agents</span>
                <Badge variant="secondary" className="text-[10px] h-5 rounded-full font-medium text-muted-foreground bg-muted/50">
                    {installedTools.length} Active
                </Badge>
            </div>
            <div className="grid gap-1 max-h-[400px] overflow-y-auto">
                {installedTools.map((t) => {
                    const Icon = AgentIcons[t.key] || AgentIcons.cursor;
                    return (
                    <div key={t.key} className="flex items-center justify-between px-3 py-2.5 hover:bg-accent/50 rounded-xl group/item transition-all border border-transparent hover:border-border/30">
                        <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-sm group-hover/item:border-primary/20 group-hover/item:shadow-md transition-all">
                            <Icon className="h-4.5 w-4.5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                        </div>
                        <span className="text-sm text-foreground/90 truncate font-medium tracking-tight" title={t.display_name}>{t.display_name}</span>
                        </div>
                        <div className="flex gap-1 opacity-60 group-hover/item:opacity-100 transition-opacity shrink-0">
                        <Tooltip content="Copy Skill (Standard)" side="left">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary active:scale-95" disabled={syncing === `${t.key}-copy`} onClick={() => handleSync(t.key, "copy")}>
                            <RefreshCw className={`h-3.5 w-3.5 ${syncing === `${t.key}-copy` ? "animate-spin" : ""}`} />
                            </Button>
                        </Tooltip>
                        <Tooltip content="Link Skill (Live Update)" side="left">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 active:scale-95" disabled={syncing === `${t.key}-link`} onClick={() => handleSync(t.key, "link")}>
                            <LinkIcon className="h-3.5 w-3.5" />
                            </Button>
                        </Tooltip>
                        </div>
                    </div>
                    )
                })}
            </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-[66vw] w-full h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            {skill.name}
            <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium tracking-wide rounded-full ${tierColor}`}>
              {tier}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none text-muted-foreground">Description</h4>
              <p className="text-sm leading-relaxed text-foreground/90">
                {skill.description || "No description provided."}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none text-muted-foreground">Path</h4>
              <div className="rounded-md bg-muted/50 p-2.5 font-mono text-xs break-all select-all border border-border/50">
                {skill.path}
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-[300px] border rounded-xl overflow-hidden shadow-sm bg-card">
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                SKILL.md Content
              </span>
              <Badge variant="secondary" className="text-[10px] h-5 px-2">Markdown</Badge>
            </div>
            <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="p-6">
                {skill.content ? (
                  <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/80 selection:bg-primary/20 selection:text-primary">
                    {skill.content}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <FileText className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No content available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
