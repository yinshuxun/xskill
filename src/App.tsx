import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudDownload, BookOpen, Plus, ScanSearch, Box, Layers, LayoutGrid } from "lucide-react";
import { NewSkillDialog } from "@/components/NewSkillDialog";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { SkillConfigDialog } from "@/components/SkillConfigDialog";
import { MarketplacePage } from "@/components/MarketplacePage";
import { ProjectsPage } from "@/components/ProjectsPage";
import { useAppStore, type LocalSkill } from "@/hooks/useAppStore";
import { SuitesPage } from "@/components/SuitesPage";
import { HubPage } from "@/components/HubPage";
import { MySkillsPage } from "@/components/MySkillsPage";
import { motion } from "framer-motion";

type Page = "hub" | "my-skills" | "marketplace" | "projects" | "suites";

function App() {
  const { skills, tools, loadingSkills, refreshSkills } = useAppStore();
  const [page, setPage] = useState<Page>("hub");
  const [isNewSkillModalOpen, setIsNewSkillModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [configuringSkill, setConfiguringSkill] = useState<LocalSkill | null>(null);

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: "hub", label: "XSkill Hub", icon: <LayoutGrid className="mr-3 h-4 w-4 opacity-70" /> },
    { id: "my-skills", label: "My Skills", icon: <BookOpen className="mr-3 h-4 w-4 opacity-70" /> },
    { id: "projects", label: "Projects", icon: <Box className="mr-3 h-4 w-4 opacity-70" /> },
    { id: "suites", label: "Suites", icon: <Layers className="mr-3 h-4 w-4 opacity-70" /> },
    { id: "marketplace", label: "Marketplace", icon: <CloudDownload className="mr-3 h-4 w-4 opacity-70" /> },
  ];

  const installedTools = tools.filter((t) => t.installed);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar: Glassmorphism Refraction */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 30, duration: 0.2 }}
        className="w-[280px] border-r border-border/40 bg-card/40 backdrop-blur-xl flex flex-col z-20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
      >
        <div className="p-8 pb-6 flex items-center gap-3">
          <div className="h-8 w-8 flex items-center justify-center">
            <img src="/src/assets/app-icon.svg" className="h-full w-full object-contain drop-shadow-md" alt="logo" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">XSkill</h1>
        </div>
        
        <div className="flex-1 px-4 space-y-1">
          <p className="px-4 text-[11px] font-medium text-muted-foreground/80 uppercase tracking-widest mb-4 mt-3">Menu</p>
          {navItems.map((item) => (
            <div key={item.id} className="relative">
              {page === item.id && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <button
                className={`relative flex w-full items-center h-10 px-4 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  page === item.id 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
                onClick={() => setPage(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-6 border-t border-border/30 text-[11px] font-medium text-muted-foreground/80 flex justify-between items-center bg-muted/10">
          <span className="tracking-wide">v0.3.1</span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>System Active</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 relative">
        <header className="h-[88px] flex items-center justify-between px-10 border-b border-border/30 bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold tracking-tight capitalize">{page.replace("-", " ")}</h2>
          </div>
          {page === "hub" && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-3"
            >
              <Button variant="outline" onClick={() => setIsOnboardingModalOpen(true)} className="h-10 rounded-xl shadow-sm hover:shadow transition-all border-border/50 bg-background font-medium">
                <ScanSearch className="mr-2 h-4 w-4 opacity-70" /> Import Skills
              </Button>
              <Button onClick={() => setIsNewSkillModalOpen(true)} className="h-10 rounded-xl shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-transform active:scale-[0.98]">
                <Plus className="mr-2 h-4 w-4" /> New Skill
              </Button>
            </motion.div>
          )}
        </header>

        <main className="flex-1 p-10 overflow-y-auto scroll-smooth">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 30, duration: 0.2 }}
            className="h-full max-w-[1400px] mx-auto"
          >
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
          </motion.div>
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
