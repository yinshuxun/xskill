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
import { motion } from "framer-motion";

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

  const cellStyle = {
    ...style,
    left: Number(style.left) + GUTTER_SIZE / 2,
    top: Number(style.top) + GUTTER_SIZE / 2,
    width: Number(style.width) - GUTTER_SIZE,
    height: Number(style.height) - GUTTER_SIZE,
  };

  return (
    <div style={cellStyle}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
        className="h-full"
      >
        <Card className="flex flex-col h-full bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-3xl border-border/50 overflow-hidden">
          <CardHeader className="pb-3 px-6 pt-6 shrink-0 space-y-2">
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <img src={skill.authorAvatar} alt={skill.author} className="h-7 w-7 rounded-full shrink-0 border border-border/50 shadow-sm" />
                <CardTitle className="text-lg font-semibold leading-tight truncate tracking-tight text-foreground/90" title={skill.name}>{skill.name}</CardTitle>
              </div>
              <Badge variant="secondary" className="shrink-0 font-mono text-[10px] px-2 h-5 bg-secondary/50 border border-border/50 text-muted-foreground">
                v{new Date(skill.updatedAt * 1000).toLocaleDateString()}
              </Badge>
            </div>
            <div className="text-xs font-medium text-muted-foreground/80 mt-1 flex items-center gap-1">
                by <span className="text-foreground/80">{skill.author}</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 px-6 pb-3 min-h-0 overflow-hidden">
              <p className="text-sm text-muted-foreground/80 line-clamp-3 mb-5 leading-relaxed" title={skill.description}>
                {skill.description}
              </p>
              <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md border border-border/30 shadow-sm">
                      <Star className="h-3.5 w-3.5 text-yellow-500" />
                      {skill.stars.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md border border-border/30 shadow-sm">
                      <GitFork className="h-3.5 w-3.5" />
                      {skill.forks.toLocaleString()}
                  </div>
              </div>
          </CardContent>
          <CardFooter className="px-6 py-4 border-t border-border/30 shrink-0 bg-muted/5 rounded-b-3xl">
            <div className="w-full flex flex-col gap-2">
                <Button
                className={`w-full shadow-sm hover:shadow-md font-medium transition-all rounded-xl active:scale-[0.98] ${
                    isInstalled ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
                size="default"
                disabled={!!installingId || isInstalled}
                onClick={() => onInstall(skill)}
                variant="default"
                >
                {isInstalling ? (
                    <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Installing…
                    </>
                ) : isInstalled ? (
                    <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Installed
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
      </motion.div>
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

  const installedSkillNames = useMemo(() => {
    const names = new Set<string>();
    localSkills.forEach(s => {
        if (s.path.includes(".xskill/hub") || s.path.includes(".xskill/skills")) {
            names.add(s.name);
        }
    });
    return names;
  }, [localSkills]);

  const fetchMarketplace = async (isManualEvent?: React.MouseEvent) => {
    const isManual = !!isManualEvent;
    
    // Try to load from cache first if not manual refresh
    let cachedData = null;
    if (!isManual) {
        const cached = localStorage.getItem("marketplace_cache");
        if (cached) {
            try {
                cachedData = JSON.parse(cached);
                if (Array.isArray(cachedData)) {
                    setSkills(cachedData);
                    setFilteredSkills(cachedData);
                }
            } catch (e) {
                console.error("Failed to parse marketplace cache", e);
            }
        }
    }
 
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
        localStorage.setItem("marketplace_cache", JSON.stringify(data));
      } else {
        if (skills.length === 0) {
            setError("Invalid data format received.");
        }
      }
    } catch {
      if (skills.length === 0) {
        setError("Failed to load marketplace data. Please check your internet connection.");
      }
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
      refreshSkills(); 
      alert(`✅ "${skill.name}" installed successfully! Go to Hub to view.`);
    } catch (err) {
      alert(`❌ Install failed: ${err}`);
    } finally {
      setInstallingId(null);
    }
  };

  const itemData = useMemo<CellData>(() => ({
    skills: filteredSkills,
    columnCount: 1, 
    installingId,
    onInstall: handleInstall,
    installedSkills: installedSkillNames
  }), [filteredSkills, installingId, installedSkillNames]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0 sticky top-0 z-50 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md px-10 py-6 border-b border-border/5 shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-muted-foreground text-sm mt-1.5 font-medium">
            Discover open-source intelligence from the community.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:max-w-md">
            <div className="relative w-full group">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search skills..." 
                    className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" size="icon" onClick={fetchMarketplace} disabled={loading} className="h-10 w-10 rounded-xl border-border/50 shadow-sm active:scale-95 transition-transform">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
        </div>
      </div>

      <div className="px-10 flex-1 min-h-0 relative z-0">
      {loading && skills.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mb-4 text-primary" />
          <p className="text-sm font-medium tracking-wide">Syncing marketplace...</p>
        </div>
      )}

      {!loading && error && skills.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-destructive bg-destructive/5 rounded-3xl border border-destructive/20">
          <AlertCircle className="h-8 w-8 mb-3" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {!error && skills.length > 0 && filteredSkills.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 text-center text-muted-foreground/60 border border-dashed border-border/50 rounded-3xl bg-background/30"
        >
          <div className="h-16 w-16 mx-auto bg-muted/50 rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <CloudDownload className="h-8 w-8 opacity-50" />
          </div>
          <p className="text-base font-medium text-foreground/80">No skills found matching search.</p>
        </motion.div>
      )}

      {!error && filteredSkills.length > 0 && (
        <div className="h-full">
            <AutoSizer>
                {({ height, width }: { height: number; width: number }) => {
                    const columnCount = Math.floor(width / 320) || 1;
                    const columnWidth = width / columnCount;
                    const rowCount = Math.ceil(filteredSkills.length / columnCount);
                    
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
                            className="overflow-x-hidden"
                        >
                            {SkillCell}
                        </Grid>
                    );
                }}
            </AutoSizer>
        </div>
      )}
      </div>
    </div>
  );
}
