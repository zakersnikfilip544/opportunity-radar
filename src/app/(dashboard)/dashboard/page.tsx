"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TimelineChart, TypeDistributionChart, CountryChart } from "@/components/dashboard/Charts";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { CardSkeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, RefreshCw } from "lucide-react";
import type { DashboardStats, Opportunity } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, oppsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/opportunities?per_page=6&sort_by=published_at&sort_order=desc"),
      ]);
      const statsData = await statsRes.json();
      const oppsData = await oppsRes.json();
      setStats(statsData);
      setOpportunities(oppsData.data || []);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function triggerScrape() {
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ""}`,
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success("Scraping started! Check back in a few minutes.");
      } else {
        toast.error("Failed to trigger scrape");
      }
    } catch {
      toast.error("Failed to trigger scrape");
    } finally {
      setScraping(false);
    }
  }

  return (
    <div>
      <Header
        title="Opportunity Radar"
        subtitle="AI-powered business intelligence — where money is moving today"
      />

      <div className="px-8 py-8 space-y-8 max-w-7xl">
        {/* Search */}
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-900/50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-radar-400" />
            <span className="text-sm font-semibold text-zinc-200">Natural Language Search</span>
          </div>
          <SearchBar />
        </div>

        {/* Stats */}
        <StatsCards stats={stats} loading={loading} />

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TimelineChart stats={stats} />
          </div>
          <CountryChart stats={stats} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <TypeDistributionChart stats={stats} />

          {/* Top industries */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">Top Industries</h3>
            <div className="space-y-3">
              {(stats?.top_industries || []).slice(0, 6).map((ind, i) => (
                <div key={ind.industry} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-zinc-300">{ind.industry || "Other"}</span>
                      <span className="text-xs text-zinc-500">{ind.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                        style={{ width: `${(ind.count / ((stats?.top_industries?.[0]?.count) || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {!stats?.top_industries?.length && (
                <p className="text-xs text-zinc-600 text-center py-4">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Latest Opportunities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-200">Latest Opportunities</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={triggerScrape}
                loading={scraping}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Scan Now
              </Button>
              <Link href="/opportunities">
                <Button variant="outline" size="sm">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : opportunities.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} compact />
                ))}
          </div>

          {!loading && opportunities.length === 0 && (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
              <Zap className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No opportunities yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Click "Scan Now" to start scanning sources.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
