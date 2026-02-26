import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Tool } from "@/hooks/useAppStore";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

interface NewSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tools: Tool[];
  onCreated: () => void;
}

// Available agents for allowed-tools
const AVAILABLE_AGENTS = [
  { key: "cursor", label: "Cursor" },
  { key: "claude_code", label: "Claude Code" },
  { key: "opencode", label: "OpenCode" },
  { key: "windsurf", label: "Windsurf" },
  { key: "gemini_cli", label: "Gemini CLI" },
  { key: "github_copilot", label: "GitHub Copilot" },
  { key: "amp", label: "Amp" },
  { key: "goose", label: "Goose" },
  { key: "codex", label: "Codex" },
  { key: "roo_code", label: "Roo Code" },
];

// Name validation
function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false };
  const nameLower = name.toLowerCase();
  if (nameLower.length > 64) return { valid: false, error: "Name must be 64 characters or less" };
  if (!/^[a-z0-9-]+$/.test(nameLower)) return { valid: false, error: "Only lowercase letters, numbers, and hyphens allowed" };
  if (nameLower.includes("--")) return { valid: false, error: "Cannot contain consecutive hyphens" };
  return { valid: true };
}

export function NewSkillDialog({ isOpen, onClose, tools, onCreated }: NewSkillDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [negativeTriggers, setNegativeTriggers] = useState("");
  const [toolKey, setToolKey] = useState(tools[0]?.key ?? "xskill");
  const [instructions, setInstructions] = useState("");
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [collectToHub, setCollectToHub] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or tools change
  useEffect(() => {
    if (isOpen) {
      setToolKey(tools[0]?.key ?? "xskill");
    }
  }, [isOpen, tools]);

  // Validate name on change
  useEffect(() => {
    if (name) {
      const result = validateName(name);
      setNameError(result.valid ? null : result.error ?? "Invalid name");
    } else {
      setNameError(null);
    }
  }, [name]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    const nameValidation = validateName(name);
    if (!nameValidation.valid || !toolKey) {
      alert("Please fix the errors before creating.");
      return;
    }

    setIsLoading(true);
    try {
      await invoke("create_skill", {
        name: name.toLowerCase().trim(),
        description: description.trim(),
        toolKey,
        content: instructions.trim(),
        negativeTriggers: negativeTriggers.trim() || null,
        allowedTools: allowedTools.length > 0 ? allowedTools : null,
        collectToHub,
      });
      onCreated();
      // Reset form
      setName("");
      setDescription("");
      setNegativeTriggers("");
      setInstructions("");
      setAllowedTools([]);
      setCollectToHub(true);
    } catch (error) {
      alert(`Failed to create skill: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAllowedTool = (agentKey: string) => {
    setAllowedTools(prev => 
      prev.includes(agentKey) 
        ? prev.filter(k => k !== agentKey)
        : [...prev, agentKey]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card text-card-foreground w-full max-w-2xl max-h-[90vh] rounded-lg shadow-lg border border-border p-6 space-y-6 overflow-y-auto">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create New Skill
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Creates a professional skill structure following best practices. Skill will be automatically added to xskill hub.
          </p>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="skill-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="skill-name"
                placeholder="e.g. angular-testing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className={nameError ? "border-destructive pr-10" : "pr-10"}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {name && !nameError && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                {nameError && <AlertCircle className="h-4 w-4 text-destructive" />}
              </div>
            </div>
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              1-64 chars, lowercase letters, numbers, hyphens only (e.g., "react-component-builder")
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="skill-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="skill-description"
              placeholder="What this skill does, when to use it (max 1024 chars)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This is the only metadata agents see for routing. Be specific and include what it does.
            </p>
          </div>

          {/* Negative Triggers */}
          <div className="space-y-2">
            <Label htmlFor="negative-triggers">
              When NOT to Use (Negative Triggers)
            </Label>
            <Textarea
              id="negative-triggers"
              placeholder={`- Don't use for Vue or Svelte projects
- Don't use for vanilla CSS styling
- Not for backend-only tasks`}
              value={negativeTriggers}
              onChange={(e) => setNegativeTriggers(e.target.value)}
              disabled={isLoading}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Help agents avoid false triggers by listing similar but inappropriate use cases.
            </p>
          </div>

          {/* Target Tool */}
          <div className="space-y-2">
            <Label htmlFor="target-tool">Target Tool</Label>
            <select
              id="target-tool"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={toolKey}
              onChange={(e) => setToolKey(e.target.value)}
              disabled={isLoading || tools.length === 0}
            >
              <option value="xskill">xskill Hub (Default)</option>
              {tools.filter(t => t.installed).map((t) => (
                <option key={t.key} value={t.key}>
                  {t.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Allowed Tools */}
          <div className="space-y-2">
            <Label>Allowed Tools (Optional)</Label>
            <div className="flex flex-wrap gap-2 p-3 rounded-md border border-input bg-background min-h-[48px]">
              {AVAILABLE_AGENTS.map((agent) => (
                <Button
                  key={agent.key}
                  type="button"
                  variant={allowedTools.includes(agent.key) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAllowedTool(agent.key)}
                  disabled={isLoading}
                  className="text-xs h-7 rounded-full"
                >
                  {agent.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Restrict which agents can use this skill. Leave empty to allow all.
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Core Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Describe what this skill does in detail. This will be used as the main content in SKILL.md."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isLoading}
              className="min-h-[150px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Keep it under 500 lines. Move detailed docs to references/ and templates to assets/
            </p>
          </div>

          {/* Collect to Hub */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-primary/5 border border-primary/10">
            <Checkbox
              id="collect-hub"
              checked={collectToHub}
              onCheckedChange={(checked) => setCollectToHub(checked as boolean)}
              disabled={isLoading}
            />
            <Label htmlFor="collect-hub" className="text-sm cursor-pointer">
              Automatically add to xskill hub
            </Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isLoading || !name || !description || !!nameError || tools.length === 0}
          >
            {isLoading ? "Creating..." : "Create Skill"}
          </Button>
        </div>
      </div>
    </div>
  );
}
