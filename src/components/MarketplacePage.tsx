import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudDownload, RefreshCw, AlertCircle } from "lucide-react";

interface RemoteSkill {
  name: string;
  description: string;
  repo_url: string;
  tags?: string[];
}

interface FeedEntry {
  id: string;
  label: string;
  url: string;
}

interface MarketplacePageProps {
  feeds: FeedEntry[];
}

import { Input } from "@/components/ui/input";

export function MarketplacePage({ feeds }: MarketplacePageProps) {
  const [skills, setSkills] = useState<RemoteSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [directUrl, setDirectUrl] = useState("");

  const fetchAllFeeds = async () => {
    setLoading(true);
    setError(null);
    const results: RemoteSkill[] = [];

    for (const feed of feeds) {
      try {
        const data = await invoke<{ skills: RemoteSkill[] }>("fetch_feed", {
          url: feed.url,
        });
        if (Array.isArray(data?.skills)) {
          results.push(...data.skills);
        }
      } catch {
        // ignore
      }
    }

    if (results.length === 0 && feeds.length > 0) {
      setError("No skills found. Your feed URLs may be unreachable or empty.");
    }

    setSkills(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllFeeds();
  }, [feeds]);

  const handleInstall = async (skill: RemoteSkill) => {
    const targetDir = await open({ directory: true, multiple: false, title: "Choose install directory" });
    if (!targetDir) return;

    setInstallingId(skill.repo_url);
    try {
      await invoke("clone_skill", {
        repoUrl: skill.repo_url,
        targetDir: `${targetDir}/${skill.name}`,
      });
      alert(`✅ "${skill.name}" installed successfully!`);
    } catch (err) {
      alert(`❌ Install failed: ${err}`);
    } finally {
      setInstallingId(null);
    }
  };

  const handleDirectInstall = async () => {
    if (!directUrl) return;
    
    const match = directUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      alert("Invalid GitHub URL. Must be like https://github.com/owner/repo");
      return;
    }
    
    setInstallingId(directUrl);
    try {
      const path = await invoke<string>("install_skill_from_url", {
        repoUrl: directUrl,
      });
      alert(`✅ Installed successfully to Hub!\nPath: ${path}`);
      setDirectUrl("");
    } catch (err) {
      alert(`❌ Install failed: ${err}`);
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Marketplace</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Discover and install skills from your configured feed sources.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllFeeds} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="mb-8 p-4 bg-muted/30">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <CloudDownload className="h-4 w-4" /> Install from GitHub
        </h3>
        <div className="flex gap-2">
          <Input 
            placeholder="https://github.com/owner/repo" 
            value={directUrl} 
            onChange={(e) => setDirectUrl(e.target.value)} 
            className="bg-background"
          />
          <Button onClick={handleDirectInstall} disabled={!directUrl || !!installingId}>
            {installingId === directUrl ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Install"}
          </Button>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Fetching feeds...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          {error}
        </div>
      )}

      {!loading && !error && skills.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">
          <CloudDownload className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p>No skills found. Add feed sources in Settings.</p>
        </div>
      )}

      {!loading && skills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <Card key={skill.repo_url} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight">{skill.name}</CardTitle>
                  {skill.tags?.slice(0, 1).map((tag) => (
                    <Badge key={tag} variant="secondary" className="shrink-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{skill.description}</p>
                <p className="text-xs text-muted-foreground/60 truncate mt-1">{skill.repo_url}</p>
              </CardHeader>
              <CardFooter className="mt-auto pt-4 border-t border-border/50">
                <Button
                  className="w-full"
                  size="sm"
                  disabled={installingId === skill.repo_url}
                  onClick={() => handleInstall(skill)}
                >
                  {installingId === skill.repo_url ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Installing…
                    </>
                  ) : (
                    <>
                      <CloudDownload className="mr-2 h-4 w-4" /> Install
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
