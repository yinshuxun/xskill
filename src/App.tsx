import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudDownload, BookOpen, Plus, ScanSearch, Box, Layers, LayoutGrid, Command } from "lucide-react";
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
  const [isNewSkillModalOpen, setIsNewSkillModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [configuringSkill, setConfiguringSkill] = useState<LocalSkill | null>(null);

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
      <div className="w-64 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-border/50 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Command className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">XSkill</h1>
        </div>
        <div className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={page === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 px-4 font-medium transition-all duration-200 ${
                page === item.id 
                  ? "bg-primary/10 text-primary hover:bg-primary/15 shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>
        
        <div className="p-6 border-t border-border/50 text-xs font-medium text-muted-foreground/50 flex justify-between items-center">
          <span>v0.3.1</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-background/50">
        <header className="h-16 flex items-center justify-between px-8 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center w-full max-w-md relative">
             {/* Search removed from header */}
          </div>
          {page === "hub" && (
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setIsOnboardingModalOpen(true)} className="shadow-sm hover:shadow transition-all">
                <ScanSearch className="mr-2 h-4 w-4" /> Import Skills
              </Button>
              <Button onClick={() => setIsNewSkillModalOpen(true)} className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                <Plus className="mr-2 h-4 w-4" /> New Skill
              </Button>
            </div>
          )}
        </header>

        <main className="flex-1 p-8 overflow-y-auto scroll-smooth">
          {page === "hub" && (
            <HubPage 
              skills={skills} 
              loading={loadingSkills} 
              onRefresh={refreshSkills}
              tools={tools}
              onConfigure={setConfiguringSkill}
            />
          )}

          {page === "my-skills" && (
            <MySkillsPage 
              skills={skills} 
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
