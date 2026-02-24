import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Settings, CloudDownload, BookOpen, Plus, RefreshCw, ScanSearch, Wrench, Box } from "lucide-react";
import { NewSkillDialog } from "@/components/NewSkillDialog";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { SkillConfigDialog } from "@/components/SkillConfigDialog";
import { SettingsPage } from "@/components/SettingsPage";
import { MarketplacePage } from "@/components/MarketplacePage";
import { ProjectsPage } from "@/components/ProjectsPage";
import { useAppStore, type LocalSkill, type Tool } from "@/hooks/useAppStore";

type Page = "my-skills" | "marketplace" | "settings" | "projects";

function SyncButton({ skill, tools }: { skill: LocalSkill; tools: Tool[] }) {
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const installedTools = tools.filter((t) => t.installed && t.key !== skill.tool_key);

  const handleSync = async (targetKey: string) => {
    setSyncing(targetKey);
    try {
      await invoke("sync_skill", {
        skillDir: skill.path,
        targetToolKeys: [targetKey],
      });
      setOpen(false);
    } catch (err) {
      alert(`Sync failed: ${err}`);
    } finally {
      setSyncing(null);
    }
  };

  if (installedTools.length === 0) return null;

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        Sync to…
      </Button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-50 bg-popover border border-border rounded-md shadow-lg min-w-[160px] py-1">
          {installedTools.map((t) => (
            <button
              key={t.key}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              disabled={syncing === t.key}
              onClick={() => handleSync(t.key)}
            >
              {syncing === t.key ? "Syncing…" : t.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const { skills, tools, feeds, loadingSkills, persistFeeds, refreshSkills } = useAppStore();
  const [page, setPage] = useState<Page>("my-skills");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSkillModalOpen, setIsNewSkillModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [configuringSkill, setConfiguringSkill] = useState<LocalSkill | null>(null);

  const filteredSkills = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: "my-skills", label: "My Skills", icon: <BookOpen className="mr-2 h-4 w-4" /> },
    { id: "projects", label: "Projects", icon: <Box className="mr-2 h-4 w-4" /> },
    { id: "marketplace", label: "Marketplace", icon: <CloudDownload className="mr-2 h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="mr-2 h-4 w-4" /> },
  ];

  const installedTools = tools.filter((t) => t.installed);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <div className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight">XSkill</h1>
        </div>
        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={page === item.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
          <div className="flex items-center w-full max-w-md relative">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              className="pl-9 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsOnboardingModalOpen(true)}>
              <ScanSearch className="mr-2 h-4 w-4" /> Import Skills
            </Button>
            <Button onClick={() => setIsNewSkillModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Skill
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {page === "my-skills" && (
            <>
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">My Skills</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Skills read from your local AI tool directories.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshSkills} disabled={loadingSkills}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loadingSkills ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {loadingSkills && (
                <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading skills…
                </div>
              )}

              {!loadingSkills && filteredSkills.length === 0 && (
                <div className="py-16 text-center text-muted-foreground text-sm">
                  <BookOpen className="mx-auto h-8 w-8 mb-3 opacity-40" />
                  <p>No skills found. Skills are read from your local tool directories.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={refreshSkills}>
                    Refresh
                  </Button>
                </div>
              )}

              {!loadingSkills && filteredSkills.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSkills.map((skill) => (
                    <SkillCard 
                      key={`${skill.tool_key}-${skill.name}`} 
                      skill={skill} 
                      tools={tools}
                      onConfigure={() => setConfiguringSkill(skill)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {page === "projects" && <ProjectsPage />}

          {page === "marketplace" && <MarketplacePage feeds={feeds} />}

          {page === "settings" && <SettingsPage feeds={feeds} setFeeds={persistFeeds} />}
        </main>
      </div>

      <NewSkillDialog
        isOpen={isNewSkillModalOpen}
        onClose={() => setIsNewSkillModalOpen(false)}
        tools={installedTools}
        onCreated={() => {
          setIsNewSkillModalOpen(false);
          refreshSkills();
        }}
      />
      
      <OnboardingDialog
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onImportComplete={() => {
          refreshSkills();
        }}
      />

      <SkillConfigDialog 
        isOpen={!!configuringSkill}
        onClose={() => setConfiguringSkill(null)}
        skill={configuringSkill}
      />
    </div>
  );
}

function SkillCard({ 
  skill, 
  tools,
  onConfigure
}: { 
  skill: LocalSkill; 
  tools: Tool[];
  onConfigure: () => void;
}) {
  const toolLabel = tools.find((t) => t.key === skill.tool_key)?.display_name ?? skill.tool_key;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg leading-tight">{skill.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {toolLabel}
          </Badge>
        </div>
        <CardDescription>{skill.description || "No description"}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto pt-4 border-t border-border/50 flex justify-between">
        <Button variant="ghost" size="sm" onClick={onConfigure}>
          <Wrench className="mr-2 h-4 w-4" /> Config
        </Button>
        <SyncButton skill={skill} tools={tools} />
      </CardFooter>
    </Card>
  );
}

export default App;
