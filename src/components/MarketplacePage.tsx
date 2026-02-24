import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudDownload, RefreshCw, AlertCircle, Star, GitFork, Search, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FixedSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useAppStore } from "@/hooks/useAppStore";

interface MarketplaceSkill {
  id: string;
  name: string;
  author: string;
  authorAvatar: string;
  description: string;
  githubUrl: string;
  stars: number;
  forks: number;
  updatedAt: number;
  tags?: string[];
}

interface CellData {
  skills: MarketplaceSkill[];
  columnCount: number;
  installingId: string | null;
  onInstall: (skill: MarketplaceSkill) => void;
  installedSkills: Set<string>;
}

const GUTTER_SIZE = 24;
const ROW_HEIGHT = 280;

const SkillCell = ({ columnIndex, rowIndex, style, data }: { columnIndex: number; rowIndex: number; style: React.CSSProperties; data: CellData }) => {
  const { skills, columnCount, installingId, onInstall, installedSkills } = data;
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= skills.length) return null;
  const skill = skills[index];
  const isInstalled = installedSkills.has(skill.name);
  const isInstalling = installingId === skill.githubUrl;

  // Adjust style to create gaps
  const cellStyle = {
    ...style,
    left: Number(style.left) + GUTTER_SIZE / 2,
    top: Number(style.top) + GUTTER_SIZE / 2,
    width: Number(style.width) - GUTTER_SIZE,
    height: Number(style.height) - GUTTER_SIZE,
  };

  return (
    <div style={cellStyle}>
      <Card className="flex flex-col h-full hover:border-primary/50 transition-colors overflow-hidden">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={skill.authorAvatar} alt={skill.author} className="h-6 w-6 rounded-full shrink-0" />
              <CardTitle className="text-lg leading-tight truncate" title={skill.name}>{skill.name}</CardTitle>
            </div>
            <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
              v{new Date(skill.updatedAt * 1000).toLocaleDateString()}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              by <span className="font-medium text-foreground">{skill.author}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-3 min-h-0 overflow-hidden">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3" title={skill.description}>
              {skill.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {skill.stars.toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                    <GitFork className="h-3 w-3" />
                    {skill.forks.toLocaleString()}
                </div>
            </div>
        </CardContent>
        <CardFooter className="pt-3 border-t border-border/50 shrink-0 bg-card">
          <div className="w-full flex flex-col gap-2">
              <Button
              className="w-full"
              size="sm"
              disabled={!!installingId || isInstalled}
              onClick={() => onInstall(skill)}
              variant={isInstalled ? "secondary" : "default"}
              >
              {isInstalling ? (
                  <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Installing…
                  </>
              ) : isInstalled ? (
                  <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Installed
                  </>
              ) : (
                  <>
                  <CloudDownload className="mr-2 h-4 w-4" /> Install to Hub
                  </>
              )}
              </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export function MarketplacePage() {
  const { skills: localSkills, refreshSkills } = useAppStore();
  const [skills, setSkills] = useState<MarketplaceSkill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<MarketplaceSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create a set of installed skill names for fast lookup
  const installedSkillNames = useMemo(() => {
    const names = new Set<string>();
    localSkills.forEach(s => {
        // Only count Hub skills as "Installed" in the marketplace context
        if (s.path.includes(".xskill/hub") || s.path.includes(".xskill/skills")) {
            names.add(s.name);
        }
    });
    return names;
  }, [localSkills]);

  const fetchMarketplace = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      try {
        const response = await fetch("/data/marketplace.json");
        if (!response.ok) throw new Error("Local data not found");
        data = await response.json();
      } catch {
        const response = await fetch("https://raw.githubusercontent.com/buzhangsan/skills-manager-client/master/public/data/marketplace.json");
        data = await response.json();
      }

      if (Array.isArray(data)) {
        setSkills(data);
        setFilteredSkills(data);
      } else {
        setError("Invalid data format received.");
      }
    } catch {
      setError("Failed to load marketplace data. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = skills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.author.toLowerCase().includes(query)
    );
    setFilteredSkills(filtered);
  }, [searchQuery, skills]);

  const handleInstall = async (skill: MarketplaceSkill) => {
    setInstallingId(skill.githubUrl);
    
    try {
      await invoke("install_skill_from_url", {
        repoUrl: skill.githubUrl,
      });
      refreshSkills(); // Refresh local skills to update "Installed" status
      alert(`✅ "${skill.name}" installed successfully! Go to Hub to view.`);
    } catch (err) {
      alert(`❌ Install failed: ${err}`);
    } finally {
      setInstallingId(null);
    }
  };

  const itemData = useMemo<CellData>(() => ({
    skills: filteredSkills,
    columnCount: 1, // Will be overridden by grid render
    installingId,
    onInstall: handleInstall,
    installedSkills: installedSkillNames
  }), [filteredSkills, installingId, installedSkillNames]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-semibold">Marketplace</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Discover open-source skills from the community.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end max-w-md">
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search skills..." 
                    className="pl-9 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" size="icon" onClick={fetchMarketplace} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading marketplace...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <AlertCircle className="h-4 w-4 text-destructive" />
          {error}
        </div>
      )}

      {!loading && !error && filteredSkills.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">
          <p>No skills found matching your search.</p>
        </div>
      )}

      {!loading && !error && filteredSkills.length > 0 && (
        <div className="flex-1 min-h-0">
            <AutoSizer>
                {({ height, width }: { height: number; width: number }) => {
                    const columnCount = Math.floor(width / 320) || 1;
                    const columnWidth = width / columnCount;
                    const rowCount = Math.ceil(filteredSkills.length / columnCount);
                    
                    // Update itemData with correct columnCount for index calculation
                    const currentItemData = { ...itemData, columnCount };

                    return (
                        <Grid
                            columnCount={columnCount}
                            columnWidth={columnWidth}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={ROW_HEIGHT}
                            width={width}
                            itemData={currentItemData}
                        >
                            {SkillCell}
                        </Grid>
                    );
                }}
            </AutoSizer>
        </div>
      )}
    </div>
  );
}
