import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (skill: { id: string; name: string; desc: string; skill_type: string; status: string; path: string }) => void;
}

export function NewSkillDialog({ isOpen, onClose, onCreated }: NewSkillDialogProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [lang, setLang] = useState("ts");
  const [targetDir, setTargetDir] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === "string") {
        setTargetDir(selected);
      }
    } catch (error) {
      console.error("Failed to open directory picker:", error);
    }
  };

  const handleCreate = async () => {
    if (!name || !targetDir) {
      alert("Name and Target Directory are required.");
      return;
    }

    setIsLoading(true);
    try {
      const skillPath = `${targetDir}/${name}`;
      await invoke("create_skill_template", {
        name,
        desc,
        lang,
        targetDir,
      });
      onCreated?.({
        id: crypto.randomUUID(),
        name,
        desc,
        skill_type: "Internal",
        status: "Active",
        path: skillPath,
      });
      alert(`Successfully created skill: ${name}`);
      onClose();
      setName("");
      setDesc("");
      setLang("ts");
      setTargetDir("");
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
            Scaffold a new skill template in your chosen directory.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g. my-awesome-skill"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Brief description of what this skill does"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="lang"
                  value="ts"
                  checked={lang === "ts"}
                  onChange={(e) => setLang(e.target.value)}
                  disabled={isLoading}
                  className="accent-primary"
                />
                <span className="text-sm">TypeScript</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="lang"
                  value="python"
                  checked={lang === "python"}
                  onChange={(e) => setLang(e.target.value)}
                  disabled={isLoading}
                  className="accent-primary"
                />
                <span className="text-sm">Python</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Directory</label>
            <div className="flex space-x-2">
              <Input
                readOnly
                placeholder="Select a directory..."
                value={targetDir}
                className="flex-1 bg-muted/50"
                disabled={isLoading}
              />
              <Button variant="secondary" onClick={handleBrowse} disabled={isLoading}>
                Browse
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
