import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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
import { AlertCircle, CheckCircle2, Copy, Move, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [skills, setSkills] = useState<DiscoveredSkill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [strategy, setStrategy] = useState<"copy" | "move">("copy");

  useEffect(() => {
    if (isOpen) {
      scanSkills();
    }
  }, [isOpen]);

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
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import Existing Skills</DialogTitle>
          <DialogDescription>
            We found {skills.length} skills in your other tools. Import them to
            Skills Hub to manage them centrally.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Scanning your system for skills...
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-hidden">
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

            <ScrollArea className="flex-1 border rounded-md p-4 h-full">
              {skills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
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
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <div className="flex-1 text-xs text-muted-foreground flex items-center">
            {strategy === "copy"
              ? "Files will be duplicated to ~/.xskill/skills"
              : "Files will be moved to ~/.xskill/skills (Original location will be empty)"}
          </div>
          <Button variant="outline" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedSkills.size === 0 || importing}
          >
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {selectedSkills.size} Skills
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
