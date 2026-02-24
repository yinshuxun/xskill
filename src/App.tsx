import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CloudDownload, BookOpen, Plus, ScanSearch, Box, Layers, LayoutGrid } from "lucide-react";
import { NewSkillDialog } from "@/components/NewSkillDialog";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { SkillConfigDialog } from "@/components/SkillConfigDialog";
import { MarketplacePage } from "@/components/MarketplacePage";
import { ProjectsPage } from "@/components/ProjectsPage";
import { useAppStore, type LocalSkill } from "@/hooks/useAppStore";
import { SuitesPage } from "@/components/SuitesPage";
import { HubPage } from "@/components/HubPage";
import { MySkillsPage } from "@/components/MySkillsPage";

type Page = "hub" | "my-skills" | "marketplace" | "projects" | "suites";

function App() {
  const { skills, tools, loadingSkills, refreshSkills } = useAppStore();
  const [page, setPage] = useState<Page>("hub");
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
    { id: "hub", label: "XSkill Hub", icon: <LayoutGrid className="mr-2 h-4 w-4" /> },
    { id: "my-skills", label: "My Skills", icon: <BookOpen className="mr-2 h-4 w-4" /> },
    { id: "projects", label: "Projects", icon: <Box className="mr-2 h-4 w-4" /> },
    { id: "marketplace", label: "Marketplace", icon: <CloudDownload className="mr-2 h-4 w-4" /> },
    { id: "suites", label: "Suites", icon: <Layers className="mr-2 h-4 w-4" /> },
  ];

  const installedTools = tools.filter((t) => t.installed);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <div className="w-64 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-violet-500 bg-clip-text text-transparent">XSkill</h1>
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
        
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          v0.3.0
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
          {page === "hub" && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setIsOnboardingModalOpen(true)}>
                <ScanSearch className="mr-2 h-4 w-4" /> Import Skills
              </Button>
              <Button onClick={() => setIsNewSkillModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Skill
              </Button>
            </div>
          )}
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {page === "hub" && (
            <HubPage 
              skills={filteredSkills} 
              loading={loadingSkills} 
              onRefresh={refreshSkills}
              tools={tools}
              onConfigure={setConfiguringSkill}
            />
          )}

          {page === "my-skills" && (
            <MySkillsPage 
              skills={filteredSkills} 
              loading={loadingSkills} 
              onRefresh={refreshSkills}
              tools={tools}
              onConfigure={setConfiguringSkill}
            />
          )}

          {page === "projects" && <ProjectsPage />}
          
          {page === "marketplace" && <MarketplacePage />}
          
          {page === "suites" && <SuitesPage />}
        </main>
      </div>

      {isNewSkillModalOpen && (
        <NewSkillDialog
          isOpen={isNewSkillModalOpen}
          onClose={() => setIsNewSkillModalOpen(false)}
          tools={installedTools}
          onCreated={() => {
            setIsNewSkillModalOpen(false);
            refreshSkills();
          }}
        />
      )}

      {isOnboardingModalOpen && (
        <OnboardingDialog
          isOpen={isOnboardingModalOpen}
          onClose={() => setIsOnboardingModalOpen(false)}
          onImportComplete={() => {
            setIsOnboardingModalOpen(false);
            refreshSkills();
          }}
        />
      )}

      {configuringSkill && (
        <SkillConfigDialog
          isOpen={!!configuringSkill}
          onClose={() => setConfiguringSkill(null)}
          skill={configuringSkill}
        />
      )}
    </div>
  );
}

export default App;
