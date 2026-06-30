"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Zap, Globe, RefreshCw } from "lucide-react";
import type { DailyDigest, Opportunity } from "@/types";
import { formatDate } from "@/lib/utils/helpers";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function DigestPage() {
  const [digest, setDigest] = useState<DailyDigest & { opportunities: Opportunity[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDigest();
  }, []);

  async function fetchDigest() {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(`/api/digest?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setDigest(data);
      }
    } catch {
      // no digest yet
    } finally {
      setLoading(false);
    }
  }

  async function generateDigest() {
    setGenerating(true);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "dev"}` },
      });
      if (res.ok) {
        toast.success("Daily digest generated!");
        await fetchDigest();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate digest");
      }
    } catch {
      toast.error("Failed to generate digest");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <Header
        title="Daily Digest"
        subtitle={`Your top opportunities for ${formatDate(new Date().toISOString(), "MMMM d, yyyy")}`}
      />

      <div className="px-8 py-6 max-w-5xl space-y-6">
        {loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        ) : digest ? (
          <>
            {/* Digest header */}
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-radar-400" />
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">
                      Daily Intelligence Briefing
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-white mb-3">{digest.title}</h1>
                  {digest.summary && (
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">{digest.summary}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {digest.stats && (
                <div className="mt-5 pt-5 border-t border-zinc-800 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-radar-400">{digest.stats.total_opportunities}</div>
                    <div className="text-xs text-zinc-600">Opportunities</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{digest.stats.avg_opportunity_score}</div>
                    <div className="text-xs text-zinc-600">Avg Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-400">{digest.stats.high_urgency_count || 0}</div>
                    <div className="text-xs text-zinc-600">High Urgency</div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats breakdown */}
            {digest.stats?.by_type && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-radar-400" />
                      <h3 className="text-sm font-semibold text-zinc-200">By Type</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(digest.stats.by_type).map(([type, count]) => (
                        <Badge key={type} variant="default" size="sm">
                          {type.replace(/_/g, " ")} · {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-violet-400" />
                      <h3 className="text-sm font-semibold text-zinc-200">By Country</h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(digest.stats.by_country).slice(0, 8).map(([country, count]) => (
                        <Badge key={country} variant="info" size="sm">
                          {country || "Unknown"} · {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Opportunities */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-200">
                  Top {digest.opportunities?.length || 0} Opportunities
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {(digest.opportunities || []).map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <Calendar className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-zinc-300 mb-2">No Digest Yet</h3>
            <p className="text-sm text-zinc-500 mb-6">Generate today's intelligence briefing.</p>
            <Button variant="primary" onClick={generateDigest} loading={generating}>
              <Zap className="h-4 w-4" />
              Generate Today's Digest
            </Button>
          </div>
        )}

        {!loading && digest && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={generateDigest} loading={generating}>
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
