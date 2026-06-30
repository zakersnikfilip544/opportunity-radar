"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Calendar, TrendingUp, Zap, AlertTriangle,
  DollarSign, Target, RefreshCw, ChevronRight,
} from "lucide-react";
import type { DailyDigest, Opportunity } from "@/types";
import { formatDate } from "@/lib/utils/helpers";
import toast from "react-hot-toast";
import { format } from "date-fns";

type DigestData = DailyDigest & { opportunities: Opportunity[] };

export default function DigestPage() {
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchDigest(); }, []);

  async function fetchDigest() {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(`/api/digest?date=${today}`);
      if (res.ok) setDigest(await res.json());
    } catch { /* no digest yet */ }
    finally { setLoading(false); }
  }

  async function generateDigest() {
    setGenerating(true);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "dev"}` },
      });
      if (res.ok) {
        toast.success("Digest generated!");
        await fetchDigest();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } catch { toast.error("Failed to generate digest"); }
    finally { setGenerating(false); }
  }

  const opps = digest?.opportunities || [];
  const critical = opps.filter((o) => o.urgency === "critical" || o.urgency === "high");
  const topScore = [...opps].sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0)).slice(0, 4);
  const highValue = opps.filter((o) => o.estimated_value_min || o.estimated_value_max).slice(0, 4);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header
        title="Daily Intelligence Briefing"
        subtitle={formatDate(new Date().toISOString(), "EEEE, MMMM d, yyyy")}
        actions={
          <Button variant="ghost" size="sm" onClick={generateDigest} loading={generating}>
            <RefreshCw className="h-3.5 w-3.5" />
            {digest ? "Regenerate" : "Generate"}
          </Button>
        }
      />

      <div className="px-8 py-6 max-w-5xl space-y-8">
        {loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        ) : !digest ? (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl">
            <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-zinc-600" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300 mb-2">No Briefing Yet</h3>
            <p className="text-sm text-zinc-600 mb-6 max-w-xs mx-auto">
              Generate today's executive intelligence briefing — curated opportunities, analyzed by AI.
            </p>
            <Button variant="primary" onClick={generateDigest} loading={generating}>
              <Zap className="h-4 w-4" />
              Generate Today's Briefing
            </Button>
          </div>
        ) : (
          <>
            {/* Header summary card */}
            <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-radar-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-radar-400" />
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                    Executive Intelligence Briefing
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-3 leading-tight">{digest.title}</h1>
                {digest.summary && (
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">{digest.summary}</p>
                )}

                {/* KPIs */}
                {digest.stats && (
                  <div className="mt-6 pt-5 border-t border-zinc-800/60 grid grid-cols-3 gap-6">
                    <div>
                      <div className="text-3xl font-bold text-radar-400 mb-1">
                        {digest.stats.total_opportunities}
                      </div>
                      <div className="text-xs text-zinc-600 uppercase tracking-wider">Opportunities</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {digest.stats.avg_opportunity_score}
                      </div>
                      <div className="text-xs text-zinc-600 uppercase tracking-wider">Avg Score</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-orange-400 mb-1">
                        {digest.stats.high_urgency_count ?? 0}
                      </div>
                      <div className="text-xs text-zinc-600 uppercase tracking-wider">High Urgency</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 1: Highest urgency */}
            {critical.length > 0 && (
              <section>
                <SectionHeader
                  icon={<AlertTriangle className="h-4 w-4 text-orange-400" />}
                  title="Requires Immediate Action"
                  subtitle="Critical and high-urgency — act within 24-48 hours"
                  accent="text-orange-400"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  {critical.slice(0, 4).map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: Best AI scores */}
            <section>
              <SectionHeader
                icon={<TrendingUp className="h-4 w-4 text-radar-400" />}
                title="Best Sales Angles"
                subtitle="Highest-scored opportunities by AI relevance and potential"
                accent="text-radar-400"
              />
              <div className="grid md:grid-cols-2 gap-4">
                {topScore.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            </section>

            {/* Section 3: Money movement */}
            {highValue.length > 0 && (
              <section>
                <SectionHeader
                  icon={<DollarSign className="h-4 w-4 text-green-400" />}
                  title="Money in Motion"
                  subtitle="Opportunities with known estimated contract or deal value"
                  accent="text-green-400"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  {highValue.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
              </section>
            )}

            {/* Section 4: Full briefing */}
            <section>
              <SectionHeader
                icon={<Target className="h-4 w-4 text-violet-400" />}
                title="Full Briefing"
                subtitle={`All ${opps.length} opportunities discovered today`}
                accent="text-violet-400"
              />
              <div className="grid md:grid-cols-2 gap-4">
                {opps.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} compact />
                ))}
              </div>
            </section>

            {/* Type/country breakdown */}
            {digest.stats && (
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">By Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(digest.stats.by_type ?? {}).map(([type, count]) => (
                      <span key={type} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {type.replace(/_/g, " ")} · {count}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">By Country</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(digest.stats.by_country ?? {}).slice(0, 8).map(([country, count]) => (
                      <span key={country} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {country || "Unknown"} · {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
