import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Copy, Move, Loader2, GitBranch, FolderSearch, ArrowLeft, Download,  } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export interface DiscoveredSkill {
  name: string;
  path: string;
  original_tool: string;
  fingerprint: string;
  is_duplicate: boolean;
}

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function OnboardingDialog({
  isOpen,
  onClose,
  onImportComplete,
}: OnboardingDialogProps) {
  const [mode, setMode] = useState<"select" | "git" | "scan">("select");
  
  // Git Import State
  const [gitUrl, setGitUrl] = useState("");
  const [gitLoading, setGitLoading] = useState(false);
  const [gitStatus, setGitStatus] = useState("");

  // Scan Import State
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [skills, setSkills] = useState<DiscoveredSkill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [strategy, setStrategy] = useState<"copy" | "move">("copy");

  useEffect(() => {
    if (isOpen) {
      setMode("select");
      setGitUrl("");
      setGitStatus("");
      setSkills([]);
      setSelectedSkills(new Set());
    }
  }, [isOpen]);

  // Listen for import progress events
  useEffect(() => {
    const unlisten = listen<string>("import-progress", (event) => {
        setGitStatus(event.payload);
    });
    return () => {
        unlisten.then(f => f());
    };
  }, []);

  useEffect(() => {
    if (mode === "scan" && skills.length === 0) {
      scanSkills();
    }
  }, [mode]);

  const scanSkills = async () => {
    setLoading(true);
    try {
      const result = await invoke<DiscoveredSkill[]>("scan_external_skills");
      setSkills(result);
      // Select non-duplicates by default
      const nonDuplicates = result
        .filter((s) => !s.is_duplicate)
        .map((s) => s.path);
      setSelectedSkills(new Set(nonDuplicates));
    } catch (error) {
      console.error("Failed to scan skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const skillsToImport = skills.filter((s) => selectedSkills.has(s.path));
      await invoke("import_skills", {
        skills: skillsToImport,
        strategy,
      });
      onImportComplete();
      onClose();
    } catch (error) {
      console.error("Failed to import skills:", error);
      alert(`Import failed: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  const handleGitImport = async () => {
    if (!gitUrl) return;
    setGitLoading(true);
    setGitStatus("Initializing...");
    try {
        await invoke("install_skill_from_url", { repoUrl: gitUrl });
        setGitStatus("Success!");
        setTimeout(() => {
            onImportComplete();
            onClose();
        }, 1000);
    } catch (error) {
        setGitStatus(`Error: ${error}`);
        // Keep loading false but show error state if we had one
    } finally {
        setGitLoading(false);
    }
  };

  const toggleSkill = (path: string) => {
    const next = new Set(selectedSkills);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedSkills(next);
  };

  const uniqueCount = skills.filter((s) => !s.is_duplicate).length;
  const duplicateCount = skills.filter((s) => s.is_duplicate).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden transition-all duration-300">
        <DialogHeader>
          <DialogTitle>Import Skills</DialogTitle>
          <DialogDescription>
            {mode === "select" && "Choose how you want to import skills into Skills Hub."}
            {mode === "git" && "Import a skill directly from a GitHub repository."}
            {mode === "scan" && "Scan your local system for existing skills configuration."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-1">
            {mode === "select" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full py-8">
                    <Card 
                        className="flex flex-col items-center justify-center p-8 gap-4 hover:bg-accent/50 cursor-pointer transition-all border-dashed border-2 hover:border-primary/50 group"
                        onClick={() => setMode("git")}
                    >
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <GitBranch className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg">Import from Git</h3>
                            <p className="text-sm text-muted-foreground px-4">
                                Clone a skill directly from a GitHub repository URL.
                            </p>
                        </div>
                    </Card>

                    <Card 
                        className="flex flex-col items-center justify-center p-8 gap-4 hover:bg-accent/50 cursor-pointer transition-all border-dashed border-2 hover:border-primary/50 group"
                        onClick={() => setMode("scan")}
                    >
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <FolderSearch className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg">Scan Local Projects</h3>
                            <p className="text-sm text-muted-foreground px-4">
                                Find skills in your existing projects and tools (Cursor, VSCode, etc).
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {mode === "git" && (
                <div className="flex flex-col justify-center h-full max-w-md mx-auto gap-6 py-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">GitHub Repository URL</label>
                            <div className="relative">
                                <GitBranch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="https://github.com/username/skill-repo" 
                                    className="pl-9"
                                    value={gitUrl}
                                    onChange={(e) => setGitUrl(e.target.value)}
                                    disabled={gitLoading}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Supports standard GitHub URLs. The repository will be cloned to your Hub.
                            </p>
                        </div>

                        {gitStatus && (
                            <div className="bg-muted/50 rounded-md p-3 text-sm font-mono flex items-center gap-2 animate-in fade-in">
                                {gitLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : gitStatus.startsWith("Error") ? (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                                <span className={gitStatus.startsWith("Error") ? "text-destructive" : ""}>
                                    {gitStatus}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mode === "scan" && (
                loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                        Scanning your system for skills...
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full gap-4">
                        <div className="flex items-center gap-4 px-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                            {uniqueCount} New
                            </Badge>
                            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                            {duplicateCount} Duplicates
                            </Badge>
                        </div>
                        <div className="flex-1" />
                        <Tabs
                            value={strategy}
                            onValueChange={(v) => setStrategy(v as "copy" | "move")}
                            className="w-[200px]"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="copy" className="text-xs">
                                <Copy className="mr-2 h-3 w-3" /> Copy
                            </TabsTrigger>
                            <TabsTrigger value="move" className="text-xs">
                                <Move className="mr-2 h-3 w-3" /> Move
                            </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        </div>

                        <ScrollArea className="flex-1 border rounded-md p-4 h-[300px]">
                        {skills.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                            No external skills found.
                            </div>
                        ) : (
                            <div className="space-y-3 pb-2">
                            {skills.map((skill) => (
                                <div
                                key={skill.path}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                    selectedSkills.has(skill.path)
                                    ? "bg-accent/50 border-primary/20"
                                    : "border-transparent hover:bg-muted/50"
                                }`}
                                >
                                <Checkbox
                                    checked={selectedSkills.has(skill.path)}
                                    onCheckedChange={() => toggleSkill(skill.path)}
                                    className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium truncate">
                                        {skill.name}
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                        {skill.original_tool}
                                    </Badge>
                                    {skill.is_duplicate && (
                                        <Badge
                                        variant="outline"
                                        className="text-[10px] h-5 text-amber-600 border-amber-200"
                                        >
                                        Duplicate
                                        </Badge>
                                    )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate font-mono" title={skill.path}>
                                    {skill.path}
                                    </p>
                                </div>
                                {skill.is_duplicate ? (
                                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-1" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                                )}
                                </div>
                            ))}
                            </div>
                        )}
                        </ScrollArea>
                    </div>
                )
            )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
            {mode === "select" && (
                <Button variant="outline" onClick={onClose}>Cancel</Button>
            )}

            {mode === "git" && (
                <>
                    <Button variant="ghost" onClick={() => setMode("select")} disabled={gitLoading}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex-1" />
                    <Button onClick={handleGitImport} disabled={!gitUrl || gitLoading}>
                        {gitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Import
                    </Button>
                </>
            )}

            {mode === "scan" && (
                <>
                    <Button variant="ghost" onClick={() => setMode("select")} disabled={importing}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex-1 text-xs text-muted-foreground flex items-center justify-end px-4 text-right">
                        {strategy === "copy"
                        ? "Duplicate to Hub"
                        : "Move to Hub"}
                    </div>
                    <Button
                        onClick={handleImport}
                        disabled={selectedSkills.size === 0 || importing}
                    >
                        {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import {selectedSkills.size} Skills
                    </Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
