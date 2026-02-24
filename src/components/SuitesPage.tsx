import { useState } from "react";
import { useAppStore, type LocalSkill } from "@/hooks/useAppStore";
import { useSuitesStore, type Suite } from "@/hooks/useSuitesStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Layers, Plus, Trash2, Edit, Save, X, BookOpen, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suites & Kits</h2>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">
            Group skills and project rules together to apply them in one click.
          </p>
        </div>
        <Button onClick={() => setEditingSuite({ name: "", description: "", policy_rules: "You are an expert AI assistant...\n", loadout_skills: [] })} className="h-10 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-transform active:scale-[0.98]">
          <Plus className="mr-2 h-4 w-4" /> New Suite
        </Button>
      </div>

      {suites.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 text-center text-muted-foreground/60 border border-dashed border-border/50 rounded-3xl bg-background/30"
        >
          <div className="h-16 w-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Layers className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-base font-medium text-foreground/80">No suites found</p>
          <p className="text-sm mt-1">Create one to organize your skills.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {suites.map((suite) => (
              <motion.div key={suite.id} variants={itemVariants} layoutId={suite.id}>
                <Card className="flex flex-col h-full bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 group overflow-hidden rounded-3xl border-border/50">
                  <CardHeader className="pb-4 px-6 pt-6 bg-muted/5 border-b border-border/30">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold tracking-tight">{suite.name}</CardTitle>
                        <CardDescription className="text-xs">{suite.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0 rounded-full h-6 px-3 bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-medium shadow-sm">
                        {suite.loadout_skills.length} Skills
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 px-6 py-5">
                    <div className="text-xs text-muted-foreground/80 bg-background border border-border/50 p-4 rounded-2xl overflow-hidden max-h-32 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                      <pre className="font-mono whitespace-pre-wrap truncate">{suite.policy_rules}</pre>
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-5 px-6 flex justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setEditingSuite(suite)} className="h-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground font-medium">
                      <Edit className="mr-2 h-4 w-4" /> Edit Suite
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-medium" onClick={() => handleDelete(suite.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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
  const [search, setSearch] = useState("");

  const toggleSkill = (skillId: string) => {
    const current = suite.loadout_skills || [];
    if (current.includes(skillId)) {
      setSuite({ ...suite, loadout_skills: current.filter((id) => id !== skillId) });
    } else {
      setSuite({ ...suite, loadout_skills: [...current, skillId] });
    }
  };

  const filteredSkills = availableSkills.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between pb-6 border-b border-border/50">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{suite.id ? "Edit Suite" : "Craft New Suite"}</h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Configure your intelligent rules and skills bundle.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel} className="h-10 rounded-xl hover:bg-muted/50 font-medium">
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={() => onSave(suite as Suite)} disabled={!suite.name} className="h-10 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-transform active:scale-[0.98]">
            <Save className="mr-2 h-4 w-4" /> Save Suite
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suite Name</Label>
            <Input value={suite.name || ""} onChange={(e) => setSuite({ ...suite, name: e.target.value })} placeholder="e.g. React Frontend Kit" className="h-11 rounded-xl bg-background/50 focus-visible:ring-primary/20" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
            <Input value={suite.description || ""} onChange={(e) => setSuite({ ...suite, description: e.target.value })} placeholder="What is this suite for?" className="h-11 rounded-xl bg-background/50 focus-visible:ring-primary/20" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Policy Rules (AGENTS.md)</Label>
            <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">Markdown Supported</span>
          </div>
          <Textarea 
            value={suite.policy_rules || ""} 
            onChange={(e) => setSuite({ ...suite, policy_rules: e.target.value })} 
            className="font-mono text-sm min-h-[200px] rounded-2xl bg-background/50 focus-visible:ring-primary/20 p-5 leading-relaxed"
            placeholder="# Project Context&#10;..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Included Skills</Label>
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Filter skills..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 pl-9 rounded-lg text-xs bg-background/50 focus-visible:ring-primary/20" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-1 max-h-[400px] overflow-y-auto pr-2">
             {filteredSkills.map((skill) => {
               const skillId = skill.name;
               const isSelected = (suite.loadout_skills || []).includes(skillId);
               return (
                 <div 
                   key={skillId}
                   onClick={() => toggleSkill(skillId)}
                   className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                     isSelected 
                        ? "bg-primary/5 border-primary/30 shadow-[0_4px_12px_-4px_rgba(var(--primary),0.1)]" 
                        : "bg-card hover:bg-accent/50 hover:border-border shadow-sm border-transparent"
                   }`}
                 >
                   <div className="flex-1 min-w-0">
                     <p className={`text-sm font-semibold truncate tracking-tight ${isSelected ? 'text-primary' : 'text-foreground/90'}`}>{skill.name}</p>
                     <p className="text-[11px] text-muted-foreground/80 truncate mt-1">{skill.description}</p>
                   </div>
                   {isSelected && <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent shadow-sm">Added</Badge>}
                 </div>
               )
             })}
             {filteredSkills.length === 0 && (
                 <div className="col-span-full py-12 text-center text-sm text-muted-foreground border border-dashed rounded-3xl bg-background/30">
                    <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    No matching skills available.
                 </div>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
