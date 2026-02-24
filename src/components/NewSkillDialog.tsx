import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tool } from "@/hooks/useAppStore";

interface NewSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tools: Tool[];
  onCreated: () => void;
}

export function NewSkillDialog({ isOpen, onClose, tools, onCreated }: NewSkillDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toolKey, setToolKey] = useState(tools[0]?.key ?? "");
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim() || !toolKey) {
      alert("Name and Target Tool are required.");
      return;
    }

    setIsLoading(true);
    try {
      await invoke("create_skill", {
        name: name.trim(),
        description: description.trim(),
        toolKey,
        content: instructions,
      });
      onCreated();
      setName("");
      setDescription("");
      setInstructions("");
      setToolKey(tools[0]?.key ?? "");
    } catch (error) {
      alert(`Failed to create skill: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-lg shadow-lg border border-border p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Create New Skill</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Creates a SKILL.md file in the selected tool's skills directory.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g. explain-code"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="What this skill does, when to use it"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Tool</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={toolKey}
              onChange={(e) => setToolKey(e.target.value)}
              disabled={isLoading || tools.length === 0}
            >
              {tools.length === 0 && <option value="">No tools detected</option>}
              {tools.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Instructions</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 min-h-[120px] resize-y"
              placeholder="Write the skill instructions in Markdown…"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || tools.length === 0}>
            {isLoading ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
