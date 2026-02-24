import { useState } from "react";
import { useAppStore, type LocalSkill } from "@/hooks/useAppStore";
import { useSuitesStore, type Suite } from "@/hooks/useSuitesStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Layers, Plus, Trash2, Edit, Save, X, BookOpen } from "lucide-react";

export function SuitesPage() {
  const { suites, saveSuites } = useSuitesStore();
  const { skills } = useAppStore();
  const [editingSuite, setEditingSuite] = useState<Suite | Partial<Suite> | null>(null);

  const handleSave = async (suiteToSave: Suite) => {
    let newSuites;
    if (suites.find((s) => s.id === suiteToSave.id)) {
      newSuites = suites.map((s) => (s.id === suiteToSave.id ? suiteToSave : s));
    } else {
      newSuites = [...suites, { ...suiteToSave, id: crypto.randomUUID() }];
    }
    await saveSuites(newSuites);
    setEditingSuite(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this suite?")) {
      await saveSuites(suites.filter((s) => s.id !== id));
    }
  };

  if (editingSuite) {
    return (
      <SuiteEditor
        suite={editingSuite}
        availableSkills={skills}
        onSave={handleSave}
        onCancel={() => setEditingSuite(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Suites & Kits</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Group skills and project rules together to apply them in one click.
          </p>
        </div>
        <Button onClick={() => setEditingSuite({ name: "", description: "", policy_rules: "You are an expert AI assistant...\n", loadout_skills: [] })}>
          <Plus className="mr-2 h-4 w-4" /> New Suite
        </Button>
      </div>

      {suites.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
          <Layers className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p>No suites found. Create one to organize your skills.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {suites.map((suite) => (
            <Card key={suite.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-lg">{suite.name}</CardTitle>
                    <CardDescription className="mt-1">{suite.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {suite.loadout_skills.length} Skills
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-hidden max-h-24 relative">
                  <pre className="font-mono text-xs whitespace-pre-wrap truncate">{suite.policy_rules}</pre>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-muted to-transparent pointer-events-none" />
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setEditingSuite(suite)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(suite.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SuiteEditor({
  suite: initialSuite,
  availableSkills,
  onSave,
  onCancel,
}: {
  suite: Partial<Suite>;
  availableSkills: LocalSkill[];
  onSave: (suite: Suite) => void;
  onCancel: () => void;
}) {
  const [suite, setSuite] = useState(initialSuite);

  const toggleSkill = (skillId: string) => {
    const current = suite.loadout_skills || [];
    if (current.includes(skillId)) {
      setSuite({ ...suite, loadout_skills: current.filter((id) => id !== skillId) });
    } else {
      setSuite({ ...suite, loadout_skills: [...current, skillId] });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{suite.id ? "Edit Suite" : "New Suite"}</h2>
          <p className="text-sm text-muted-foreground">Configure your rules and skills bundle.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={() => onSave(suite as Suite)} disabled={!suite.name}>
            <Save className="mr-2 h-4 w-4" /> Save Suite
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input value={suite.name || ""} onChange={(e) => setSuite({ ...suite, name: e.target.value })} placeholder="e.g. React Frontend Kit" />
        </div>

        <div className="grid gap-2">
          <Label>Description</Label>
          <Input value={suite.description || ""} onChange={(e) => setSuite({ ...suite, description: e.target.value })} placeholder="What is this suite for?" />
        </div>

        <div className="grid gap-2">
          <Label>Policy Rules (AGENTS.md)</Label>
          <Textarea 
            value={suite.policy_rules || ""} 
            onChange={(e) => setSuite({ ...suite, policy_rules: e.target.value })} 
            className="font-mono text-sm h-48"
            placeholder="# Project Context&#10;..."
          />
          <p className="text-xs text-muted-foreground">This content will be written to AGENTS.md in the project root.</p>
        </div>

        <div className="grid gap-2">
          <Label>Included Skills</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 border p-4 rounded-md max-h-[300px] overflow-y-auto">
             {availableSkills.map((skill) => {
               // Fallback: use skill.name if skill.id is missing (from LocalSkill type)
               const skillId = skill.id || skill.name;
               const isSelected = (suite.loadout_skills || []).includes(skillId);
               return (
                 <div 
                   key={skillId}
                   onClick={() => toggleSkill(skillId)}
                   className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                     isSelected ? "bg-primary/10 border-primary" : "hover:bg-accent"
                   }`}
                 >
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium truncate">{skill.name}</p>
                     <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
                   </div>
                   {isSelected && <Badge>Selected</Badge>}
                 </div>
               )
             })}
             {availableSkills.length === 0 && (
                 <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    No local skills available.
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
