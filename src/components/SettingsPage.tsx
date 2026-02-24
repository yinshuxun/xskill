import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Trash2, RefreshCw } from "lucide-react";

interface FeedEntry {
  id: string;
  label: string;
  url: string;
}

interface SettingsPageProps {
  feeds: FeedEntry[];
  setFeeds: (feeds: FeedEntry[]) => void | Promise<void>;
}

export function SettingsPage({ feeds, setFeeds }: SettingsPageProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addFeed = () => {
    const trimmedUrl = newUrl.trim();
    const trimmedLabel = newLabel.trim();
    if (!trimmedUrl || !trimmedLabel) {
      setError("Both label and URL are required.");
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }
    setFeeds([...feeds, { id: crypto.randomUUID(), label: trimmedLabel, url: trimmedUrl }]);
    setNewLabel("");
    setNewUrl("");
    setError(null);
  };

  const removeFeed = (id: string) => {
    setFeeds(feeds.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your internal skill feed sources. Each feed URL should point to a{" "}
          <code className="text-xs bg-muted px-1 rounded">registry.json</code> file.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Feed Sources</CardTitle>
          <CardDescription>
            Add Git-hosted registries to discover internal company skills.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border"
            >
              <div className="min-w-0 mr-4">
                <p className="font-medium text-sm truncate">{feed.label}</p>
                <p className="text-xs text-muted-foreground truncate">{feed.url}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFeed(feed.id)}
                disabled={feed.id === "default-opencode"}
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-sm font-medium">Add New Feed</p>
            <Input
              placeholder="Label (e.g. Acme Internal Skills)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Input
              placeholder="URL (e.g. https://git.acme.com/skills/registry.json)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFeed()}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={addFeed} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Feed
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">IDE Paths</CardTitle>
          <CardDescription>
            Auto-detected config file locations on this machine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cursor</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              ~/.cursor/mcp.json
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">OpenCode</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              ~/.config/opencode/mcp.json
            </code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Windsurf</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              ~/.windsurf/mcp.json
            </code>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        Feed data is refreshed on app launch and when you navigate to Marketplace.
      </div>
    </div>
  );
}
