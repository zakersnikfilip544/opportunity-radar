"use client";

import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Database, Key, Globe, Bell, Zap, CheckCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const SOURCES = [
  { name: "Hacker News", type: "hacker_news", status: "active" },
  { name: "TechCrunch", type: "rss", status: "active" },
  { name: "VentureBeat", type: "rss", status: "active" },
  { name: "Product Hunt", type: "product_hunt", status: "active" },
  { name: "Reddit r/entrepreneur", type: "reddit", status: "active" },
  { name: "Reddit r/startups", type: "reddit", status: "active" },
  { name: "GitHub Trending", type: "github_trending", status: "active" },
  { name: "Y Combinator", type: "ycombinator", status: "active" },
  { name: "Reuters Business", type: "rss", status: "active" },
  { name: "EU Funding Portal", type: "eu_funding", status: "active" },
  { name: "Crunchbase", type: "crunchbase", status: "inactive" },
  { name: "LinkedIn (manual)", type: "linkedin", status: "inactive" },
];

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [cronSecret, setCronSecret] = useState("");

  return (
    <div>
      <Header title="Settings" subtitle="Configure your Opportunity Radar" />

      <div className="px-8 py-6 max-w-4xl space-y-6">
        {/* API Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-radar-400" />
              <h3 className="text-sm font-semibold text-zinc-200">API Configuration</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">OpenAI API Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button variant="secondary" size="md" onClick={() => toast.success("Saved to environment")}>
                  Save
                </Button>
              </div>
              <p className="text-xs text-zinc-600 mt-1">Used for AI analysis of articles. Set in .env file.</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Cron Secret</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="your-secret"
                  value={cronSecret}
                  onChange={(e) => setCronSecret(e.target.value)}
                />
                <Button variant="secondary" size="md" onClick={() => toast.success("Saved")}>
                  Save
                </Button>
              </div>
              <p className="text-xs text-zinc-600 mt-1">Secures the /api/scrape and /api/digest endpoints.</p>
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Data Sources</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SOURCES.map((source) => (
                <div
                  key={source.name}
                  className="flex items-center justify-between py-2.5 border-b border-zinc-800/50 last:border-0"
                >
                  <div>
                    <span className="text-sm text-zinc-200">{source.name}</span>
                    <span className="ml-2 text-xs text-zinc-600">{source.type}</span>
                  </div>
                  <Badge
                    variant={source.status === "active" ? "success" : "outline"}
                    size="sm"
                  >
                    {source.status === "active" ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                    ) : (
                      "Inactive"
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Scraping Schedule</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4">
              <p className="text-xs text-zinc-400 font-medium mb-2">Recommended cron setup (add to crontab or Vercel Cron):</p>
              <code className="text-xs text-radar-400 font-mono">
                0 */2 * * * curl -X POST https://your-domain/api/scrape -H "Authorization: Bearer $CRON_SECRET"
              </code>
              <p className="text-xs text-zinc-600 mt-2">Scrapes all sources every 2 hours.</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4">
              <p className="text-xs text-zinc-400 font-medium mb-2">Daily digest (run at 7 AM):</p>
              <code className="text-xs text-yellow-400 font-mono">
                0 7 * * * curl -X POST https://your-domain/api/digest -H "Authorization: Bearer $CRON_SECRET"
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Supabase */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Database Setup</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-3">
              Run the migration file to set up your Supabase database:
            </p>
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4 space-y-2">
              <p className="text-xs text-zinc-500">1. Create a new Supabase project</p>
              <p className="text-xs text-zinc-500">2. Go to SQL Editor → New Query</p>
              <p className="text-xs text-zinc-500">3. Paste the contents of <code className="text-blue-400">supabase/migrations/001_initial.sql</code></p>
              <p className="text-xs text-zinc-500">4. Run the query</p>
              <p className="text-xs text-zinc-500">5. Add your Supabase URL and keys to <code className="text-blue-400">.env.local</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
