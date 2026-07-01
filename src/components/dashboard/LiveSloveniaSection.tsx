"use client";

import { useEffect, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { CardSkeleton } from "@/components/ui/skeleton";
import type { Opportunity } from "@/types";

interface LiveSignalsResponse {
  data: Opportunity[];
  live: boolean;
  fetched_at: string;
}

export function LiveSloveniaSection() {
  const [result, setResult] = useState<LiveSignalsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals();
  }, []);

  async function fetchSignals() {
    setLoading(true);
    try {
      const res = await fetch("/api/signals/live");
      setResult(await res.json());
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const opportunities = result?.data ?? [];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-green-400" />
            <h2 className="text-sm font-semibold text-green-400">🟢 V ŽIVO – Slovenija</h2>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            {loading
              ? "Preverjanje slovenskih poslovnih virov ..."
              : result?.live
              ? "Zaznano iz slovenskih RSS virov v realnem času"
              : "Trenutno ni novih živih signalov — prikazani vzorčni podatki za Slovenijo"}
          </p>
        </div>
        <button
          onClick={fetchSignals}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
          Osveži
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          : opportunities.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)}
      </div>

      {!loading && opportunities.length === 0 && (
        <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
          <Radio className="h-7 w-7 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Trenutno ni zaznanih slovenskih signalov.</p>
        </div>
      )}
    </section>
  );
}
