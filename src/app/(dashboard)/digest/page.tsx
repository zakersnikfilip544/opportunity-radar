"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProfileSelector } from "@/components/dashboard/ProfileSelector";
import { useRadarProfile } from "@/components/dashboard/RadarProfileContext";
import {
  TrendingUp, Zap, AlertTriangle,
  DollarSign, Target, RefreshCw,
} from "lucide-react";
import { OPPORTUNITY_TYPE_CONFIG } from "@/types";
import type { DailyDigest, Opportunity, OpportunityType } from "@/types";
import { formatDate, parseValueRange } from "@/lib/utils/helpers";
import toast from "react-hot-toast";

type DigestData = DailyDigest & { opportunities: Opportunity[] };

export default function DigestPage() {
  const { profile } = useRadarProfile();
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDigest(() => cancelled);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function fetchDigest(isCancelled: () => boolean = () => false) {
    setLoading(true);
    try {
      const res = await fetch(`/api/digest?profile=${profile}`);
      const json = res.ok ? await res.json() : null;
      if (isCancelled()) return; // a newer profile was selected while this was in flight
      if (json) setDigest(json);
    } catch { /* handled by empty state below */ }
    finally { if (!isCancelled()) setLoading(false); }
  }

  async function generateDigest() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/digest?profile=${profile}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "dev"}` },
      });
      if (res.ok) {
        toast.success("Pregled je posodobljen!");
        await fetchDigest();
      } else {
        const err = await res.json();
        toast.error(err.error || "Neuspešno");
      }
    } catch { toast.error("Posodabljanje pregleda ni uspelo"); }
    finally { setGenerating(false); }
  }

  const opps = digest?.opportunities || [];
  const critical = opps.filter((o) => o.urgency === "critical" || o.urgency === "high");
  const topTen = [...opps].sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0)).slice(0, 10);
  const highValue = [...opps]
    .filter((o) => o.estimated_value_min || o.estimated_value_max)
    .sort((a, b) => (b.estimated_value_max ?? b.estimated_value_min ?? 0) - (a.estimated_value_max ?? a.estimated_value_min ?? 0));
  const biggestDeal = highValue[0];

  const countryCounts: Record<string, number> = {};
  opps.forEach((o) => { if (o.country) countryCounts[o.country] = (countryCounts[o.country] ?? 0) + 1; });
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const industryCounts: Record<string, number> = {};
  opps.forEach((o) => { if (o.industry) industryCounts[o.industry] = (industryCounts[o.industry] ?? 0) + 1; });
  const topIndustries = Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header
        title="Dnevni pregled"
        subtitle={formatDate(new Date().toISOString(), "EEEE, d. MMMM yyyy")}
        actions={
          <Button variant="ghost" size="sm" onClick={generateDigest} loading={generating}>
            <RefreshCw className="h-3.5 w-3.5" />
            {digest ? "Ponovno ustvari" : "Ustvari"}
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-5xl space-y-8">
        <ProfileSelector />

        {loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        ) : !digest ? (
          <EmptyState hint="Osvežite pregled ali poskusite drug radar profil." />
        ) : (
          <>
            {/* Header summary card */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-4 sm:p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-radar-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-radar-400" />
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                    Vodstveno obveščevalno poročilo
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">{digest.title}</h1>
                {digest.summary && (
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">{digest.summary}</p>
                )}

                {/* KPIs */}
                {digest.stats && (
                  <div className="mt-6 pt-5 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                    <div>
                      <div className="text-xl sm:text-3xl font-bold text-radar-400 mb-1">
                        {digest.stats.total_opportunities}
                      </div>
                      <div className="text-[10px] sm:text-xs text-zinc-600 uppercase tracking-wider">Priložnosti</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-3xl font-bold text-yellow-400 mb-1">
                        {digest.stats.avg_opportunity_score}
                      </div>
                      <div className="text-[10px] sm:text-xs text-zinc-600 uppercase tracking-wider">Povp. ocena</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-3xl font-bold text-orange-400 mb-1">
                        {digest.stats.high_urgency_count ?? 0}
                      </div>
                      <div className="text-[10px] sm:text-xs text-zinc-600 uppercase tracking-wider">Visoka nujnost</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-3xl font-bold text-green-400 mb-1">
                        {biggestDeal
                          ? parseValueRange(biggestDeal.estimated_value_min, biggestDeal.estimated_value_max, biggestDeal.estimated_value_currency)
                          : "—"}
                      </div>
                      <div className="text-[10px] sm:text-xs text-zinc-600 uppercase tracking-wider">Največji posel</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {opps.length === 0 ? (
              <EmptyState hint="Osvežite pregled ali poskusite drug radar profil." />
            ) : (
              <>
                {/* Section 1: Highest urgency */}
                {critical.length > 0 && (
                  <section>
                    <SectionHeader
                      icon={<AlertTriangle className="h-4 w-4 text-orange-400" />}
                      title="Zahteva takojšnje ukrepanje"
                      subtitle="Kritično in zelo nujno — ukrepajte v 24–48 urah"
                      accent="text-orange-400"
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      {critical.slice(0, 4).map((opp) => (
                        <OpportunityCard key={opp.id} opportunity={opp} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 2: Top 10 */}
                <section>
                  <SectionHeader
                    icon={<TrendingUp className="h-4 w-4 text-radar-400" />}
                    title="10 najboljših priložnosti"
                    subtitle="Najbolje ocenjene priložnosti po AI relevantnosti in potencialu"
                    accent="text-radar-400"
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    {topTen.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} compact />
                    ))}
                  </div>
                </section>

                {/* Section 3: Money movement */}
                {highValue.length > 0 && (
                  <section>
                    <SectionHeader
                      icon={<DollarSign className="h-4 w-4 text-green-400" />}
                      title="Denar v gibanju"
                      subtitle="Priložnosti z znano ocenjeno vrednostjo posla, od največje naprej"
                      accent="text-green-400"
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                      {highValue.slice(0, 4).map((opp) => (
                        <OpportunityCard key={opp.id} opportunity={opp} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 4: Full briefing */}
                <section>
                  <SectionHeader
                    icon={<Target className="h-4 w-4 text-violet-400" />}
                    title="Celotno poročilo"
                    subtitle={`Vseh ${opps.length} priložnosti, odkritih danes`}
                    accent="text-violet-400"
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    {opps.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} compact />
                    ))}
                  </div>
                </section>

                {/* Type/country/industry breakdown */}
                {digest.stats && (
                  <div className="grid md:grid-cols-3 gap-4 pt-2">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Po vrsti</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(digest.stats.by_type ?? {}).filter(([, count]) => count > 0).map(([type, count]) => (
                          <span key={type} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {OPPORTUNITY_TYPE_CONFIG[type as OpportunityType]?.label ?? type} · {count}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Vodilne države</p>
                      <div className="flex flex-wrap gap-1.5">
                        {topCountries.map(([country, count]) => (
                          <span key={country} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {country || "Neznano"} · {count}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Vodilne panoge</p>
                      <div className="flex flex-wrap gap-1.5">
                        {topIndustries.map(([industry, count]) => (
                          <span key={industry} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {industry} · {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  icon, title, subtitle, accent,
}: { icon: React.ReactNode; title: string; subtitle: string; accent: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className={`text-sm font-semibold ${accent}`}>{title}</h2>
        <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
