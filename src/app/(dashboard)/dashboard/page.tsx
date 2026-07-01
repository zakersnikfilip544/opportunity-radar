"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import {
  TimelineChart, TypeDistributionChart, CountryChart,
  UrgencyBreakdownChart, IndustryChart,
} from "@/components/dashboard/Charts";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { HeroOpportunity } from "@/components/dashboard/HeroOpportunity";
import { CardSkeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { ArrowRight, X, Zap, AlertTriangle, Database } from "lucide-react";
import type { DashboardStats, Opportunity } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topOpps, setTopOpps] = useState<Opportunity[]>([]);
  const [urgentOpps, setUrgentOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, topRes, urgentRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/opportunities?per_page=6&sort_by=opportunity_score&sort_order=desc"),
        fetch("/api/opportunities?per_page=6&urgency=critical&urgency=high&sort_by=urgency_score&sort_order=desc"),
      ]);
      setStats(await statsRes.json());
      const topData = await topRes.json();
      const urgentData = await urgentRes.json();
      setTopOpps(topData.data ?? []);
      setUrgentOpps(urgentData.data ?? []);
    } catch {
      toast.error("Nalaganje podatkov nadzorne plošče ni uspelo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header
        title="Nadzorna plošča"
        subtitle="Radar poslovnih priložnosti z umetno inteligenco"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 max-w-[1400px]">
        {/* Demo mode banner */}
        {showBanner && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
            <Database className="h-4 w-4 text-yellow-400 shrink-0" />
            <p className="text-sm text-zinc-300 flex-1 min-w-[200px]">
              <span className="font-medium text-yellow-400">Način predstavitve je aktiven</span>
              {" — "} prikazanih je 40 vzorčnih priložnosti. Povežite Supabase za omogočanje zajema podatkov v živo.
            </p>
            <Link href="/settings">
              <button className="text-xs text-yellow-400 hover:text-yellow-300 underline underline-offset-2 mr-2 transition-colors">
                Nastavi
              </button>
            </Link>
            <button
              onClick={() => setShowBanner(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Best Opportunity Today */}
        {!loading && topOpps[0] && <HeroOpportunity opportunity={topOpps[0]} />}
        {loading && <CardSkeleton />}

        {/* Search */}
        <div className="relative rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-950 p-4 sm:p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-radar-500/5 to-violet-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-radar-400" />
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">AI iskanje</span>
            </div>
            <SearchBar />
          </div>
        </div>

        {/* KPI Cards */}
        <StatsCards stats={stats} loading={loading} />

        {/* Row 2: Timeline + Urgency */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TimelineChart stats={stats} />
          </div>
          <UrgencyBreakdownChart stats={stats} />
        </div>

        {/* Row 3: Type dist + Country */}
        <div className="grid lg:grid-cols-2 gap-4">
          <TypeDistributionChart stats={stats} />
          <div className="grid gap-4">
            <CountryChart stats={stats} />
          </div>
        </div>

        {/* Row 4: Industry */}
        <IndustryChart stats={stats} />

        {/* Row 5: Top opportunities by score */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Najbolje ocenjene priložnosti</h2>
              <p className="text-xs text-zinc-600 mt-0.5">Najboljše priložnosti po AI oceni</p>
            </div>
            <Link href="/opportunities?sort_by=opportunity_score&sort_order=desc">
              <Button variant="ghost" size="sm">
                Prikaži vse <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : topOpps.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)
            }
          </div>
          {!loading && topOpps.length === 0 && (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
              <Zap className="h-7 w-7 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Trenutno ni priložnosti — nalaganje podatkov.</p>
            </div>
          )}
        </section>

        {/* Row 6: Most urgent */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Zahteva takojšnje ukrepanje</h2>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">Kritične in zelo nujne priložnosti</p>
            </div>
            <Link href="/opportunities?urgency=critical&urgency=high">
              <Button variant="ghost" size="sm">
                Prikaži vse <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : urgentOpps.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} compact />)
            }
          </div>
          {!loading && urgentOpps.length === 0 && (
            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-600">Trenutno ni zelo nujnih priložnosti.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
