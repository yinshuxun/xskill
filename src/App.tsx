import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Settings, CloudDownload, Server, Plus } from "lucide-react";
import { NewSkillDialog } from "@/components/NewSkillDialog";
import { SettingsPage } from "@/components/SettingsPage";
import { MarketplacePage } from "@/components/MarketplacePage";
import { useAppStore, type Skill } from "@/hooks/useAppStore";

type Page = "my-skills" | "marketplace" | "settings";



function App() {
  const { skills, feeds, persistSkills, persistFeeds } = useAppStore();
  const [page, setPage] = useState<Page>("my-skills");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSkillModalOpen, setIsNewSkillModalOpen] = useState(false);

  const handleSkillCreated = (skill: Skill) => {
    persistSkills([...skills, skill]);
  };

  const filteredSkills = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSync = async (ideName: string, skill: Skill) => {
    try {
      const mcpConfig = {
        mcpServers: {
          [skill.name.replace(/\s+/g, "_").toLowerCase()]: {
            command: "node",
            args: [skill.path ? `${skill.path}/dist/index.js` : "/path/to/script.js"],
          },
        },
      };
      await invoke("sync_to_ide", { ideName, mcpConfig });
      alert(`Successfully synced ${skill.name} to ${ideName === "cursor" ? "Cursor" : "OpenCode"}!`);
    } catch (error) {
      alert(`Failed to sync ${skill.name} to ${ideName}: ${error}`);
    }
  };

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: "my-skills", label: "My Skills", icon: <Server className="mr-2 h-4 w-4" /> },
    { id: "marketplace", label: "Marketplace", icon: <CloudDownload className="mr-2 h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
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
            <Button onClick={() => setIsNewSkillModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Skill
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {page === "my-skills" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Installed Skills</h2>
                <p className="text-muted-foreground text-sm">Manage and sync your AI skills to local IDEs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSkills.map((skill) => (
                  <Card key={skill.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{skill.name}</CardTitle>
                        <Badge variant={skill.skill_type === "Internal" ? "default" : "secondary"}>
                          {skill.skill_type}
                        </Badge>
                      </div>
                      <CardDescription>{skill.desc}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto flex justify-between pt-4 border-t border-border/50">
                      <span className="text-xs text-muted-foreground flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            skill.status === "Active" ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        {skill.status}
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleSync("cursor", skill)}>
                          Sync Cursor
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleSync("opencode", skill)}>
                          Sync OpenCode
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                {filteredSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-3 py-10 text-center">
                    No skills match your search.
                  </p>
                )}
              </div>
            </>
          )}

          {page === "marketplace" && <MarketplacePage feeds={feeds} />}

          {page === "settings" && <SettingsPage feeds={feeds} setFeeds={persistFeeds} />}
        </main>
      </div>

      <NewSkillDialog
        isOpen={isNewSkillModalOpen}
        onClose={() => setIsNewSkillModalOpen(false)}
        onCreated={handleSkillCreated}
      />
    </div>
  );
}

export default App;
