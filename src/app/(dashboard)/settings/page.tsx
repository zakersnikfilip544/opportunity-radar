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
      <Header title="Nastavitve" subtitle="Konfigurirajte Opportunity Radar" />

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-4xl space-y-6">
        {/* API Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-radar-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Konfiguracija API</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">OpenAI API ključ</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <Button variant="secondary" size="md" onClick={() => toast.success("Shranjeno v okolje")}>
                  Shrani
                </Button>
              </div>
              <p className="text-xs text-zinc-600 mt-1">Uporablja se za AI analizo člankov. Nastavite v datoteki .env.</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Cron skrivnost</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    type="password"
                    placeholder="vasa-skrivnost"
                    value={cronSecret}
                    onChange={(e) => setCronSecret(e.target.value)}
                  />
                </div>
                <Button variant="secondary" size="md" onClick={() => toast.success("Shranjeno")}>
                  Shrani
                </Button>
              </div>
              <p className="text-xs text-zinc-600 mt-1">Zavaruje končni točki /api/scrape in /api/digest.</p>
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Viri podatkov</h3>
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
                      <><CheckCircle className="h-3 w-3 mr-1" />Aktiven</>
                    ) : (
                      "Neaktiven"
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
              <h3 className="text-sm font-semibold text-zinc-200">Urnik zajemanja podatkov</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4">
              <p className="text-xs text-zinc-400 font-medium mb-2">Priporočena nastavitev cron (dodajte v crontab ali Vercel Cron):</p>
              <code className="block text-xs text-radar-400 font-mono whitespace-pre-wrap break-all">
                0 */2 * * * curl -X POST https://your-domain/api/scrape -H "Authorization: Bearer $CRON_SECRET"
              </code>
              <p className="text-xs text-zinc-600 mt-2">Zajame podatke iz vseh virov vsaki 2 uri.</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4">
              <p className="text-xs text-zinc-400 font-medium mb-2">Dnevni pregled (zažene se ob 7. uri zjutraj):</p>
              <code className="block text-xs text-yellow-400 font-mono whitespace-pre-wrap break-all">
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
              <h3 className="text-sm font-semibold text-zinc-200">Nastavitev podatkovne baze</h3>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400 mb-3">
              Zaženite migracijsko datoteko za nastavitev podatkovne baze Supabase:
            </p>
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4 space-y-2">
              <p className="text-xs text-zinc-500">1. Ustvarite nov projekt Supabase</p>
              <p className="text-xs text-zinc-500">2. Pojdite v SQL Editor → New Query</p>
              <p className="text-xs text-zinc-500">3. Prilepite vsebino datoteke <code className="text-blue-400">supabase/migrations/001_initial.sql</code></p>
              <p className="text-xs text-zinc-500">4. Zaženite poizvedbo</p>
              <p className="text-xs text-zinc-500">5. Dodajte svoj Supabase URL in ključe v <code className="text-blue-400">.env.local</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
