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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { type LocalSkill } from "@/hooks/useAppStore";

interface SkillConfig {
  command: string | null;
  args: string[] | null;
  env: Record<string, string> | null;
}

interface SkillConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  skill: LocalSkill | null;
}

export function SkillConfigDialog({
  isOpen,
  onClose,
  skill,
}: SkillConfigDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState<string[]>([]);
  const [env, setEnv] = useState<{ key: string; value: string }[]>([]);

  useEffect(() => {
    if (isOpen && skill) {
      loadConfig();
    }
  }, [isOpen, skill]);

  const loadConfig = async () => {
    if (!skill) return;
    setLoading(true);
    try {
      const config = await invoke<SkillConfig>("get_skill_config", {
        skillName: skill.name,
        skillPath: skill.path,
      });
      setCommand(config.command || "");
      setArgs(config.args || []);
      setEnv(
        config.env
          ? Object.entries(config.env).map(([key, value]) => ({ key, value }))
          : []
      );
    } catch (error) {
      console.error("Failed to load skill config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!skill) return;
    setSaving(true);
    try {
      const envMap: Record<string, string> = {};
      env.forEach(({ key, value }) => {
        if (key.trim()) envMap[key.trim()] = value;
      });

      const config: SkillConfig = {
        command: command.trim() || null,
        args: args.length > 0 ? args : null,
        env: Object.keys(envMap).length > 0 ? envMap : null,
      };

      await invoke("save_skill_config", {
        skillName: skill.name,
        skillPath: skill.path,
        config,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save skill config:", error);
      alert(`Save failed: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const addArg = () => setArgs([...args, ""]);
  const updateArg = (index: number, value: string) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };
  const removeArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  const addEnv = () => setEnv([...env, { key: "", value: "" }]);
  const updateEnv = (index: number, field: "key" | "value", val: string) => {
    const newEnv = [...env];
    newEnv[index] = { ...newEnv[index], [field]: val };
    setEnv(newEnv);
  };
  const removeEnv = (index: number) => {
    setEnv(env.filter((_, i) => i !== index));
  };

  if (!skill) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Skill: {skill.name}</DialogTitle>
          <DialogDescription>
            Set the execution command, arguments, and environment variables for this
            MCP server.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-2">
              {/* Command Section */}
              <div className="space-y-2">
                <Label>Command (Executable)</Label>
                <Input
                  placeholder="e.g. node, python3, npx"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The binary to run. For local scripts, use absolute paths or make sure it's in PATH.
                </p>
              </div>

              {/* Args Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Arguments</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addArg}
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Arg
                  </Button>
                </div>
                {args.map((arg, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={arg}
                      onChange={(e) => updateArg(index, e.target.value)}
                      placeholder={`Arg ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArg(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {args.length === 0 && (
                  <div className="text-sm text-muted-foreground italic px-2">
                    No arguments configured.
                  </div>
                )}
              </div>

              {/* Env Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Environment Variables</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addEnv}
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Env
                  </Button>
                </div>
                {env.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="KEY"
                      value={item.key}
                      onChange={(e) => updateEnv(index, "key", e.target.value)}
                    />
                    <Input
                      className="flex-1"
                      placeholder="VALUE"
                      type="password"
                      value={item.value}
                      onChange={(e) => updateEnv(index, "value", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEnv(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {env.length === 0 && (
                  <div className="text-sm text-muted-foreground italic px-2">
                    No environment variables configured.
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
