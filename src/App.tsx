import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Settings, CloudDownload, BookOpen, Plus, RefreshCw, ScanSearch, Box, Layers } from "lucide-react";
import { NewSkillDialog } from "@/components/NewSkillDialog";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { SkillConfigDialog } from "@/components/SkillConfigDialog";
import { SettingsPage } from "@/components/SettingsPage";
import { MarketplacePage } from "@/components/MarketplacePage";
import { ProjectsPage } from "@/components/ProjectsPage";
import { useAppStore, type LocalSkill } from "@/hooks/useAppStore";
import { SuitesPage } from "@/components/SuitesPage";
import { SkillCard } from "@/components/SkillCard";

type Page = "my-skills" | "marketplace" | "settings" | "projects" | "suites";

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
    { id: "suites", label: "Suites", icon: <Layers className="mr-2 h-4 w-4" /> },
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
                  {filteredSkills.map((skill) => {
                    const syncedTools = tools.filter(t => 
                      skills.some(s => s.name === skill.name && s.tool_key === t.key)
                    );
                    
                    return (
                      <SkillCard
                        key={`${skill.tool_key}-${skill.name}`}
                        skill={skill}
                        tools={tools}
                        syncedTools={syncedTools}
                        onConfigure={() => setConfiguringSkill(skill)}
                        onRefresh={refreshSkills}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {page === "projects" && <ProjectsPage />}
          
          {page === "suites" && <SuitesPage />}

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

export default App;
