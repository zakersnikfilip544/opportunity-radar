"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookmarkCheck, X } from "lucide-react";
import { SAVED_STAGE_CONFIG, SAVED_STAGE_ORDER } from "@/types";
import type { Opportunity, SavedOpportunity, SavedStage } from "@/types";
import { cn } from "@/lib/utils/helpers";
import toast from "react-hot-toast";

const DEMO_USER_ID = "demo-user-001";

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  async function fetchSaved() {
    setLoading(true);
    try {
      const res = await fetch(`/api/saved?user_id=${DEMO_USER_ID}`);
      const data = await res.json();
      setSaved(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Nalaganje shranjenih priložnosti ni uspelo");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsave(opportunityId: string) {
    const prev = saved;
    setSaved((p) => p.filter((s) => s.opportunity_id !== opportunityId));
    try {
      await fetch(`/api/saved?user_id=${DEMO_USER_ID}&opportunity_id=${opportunityId}`, {
        method: "DELETE",
      });
      toast.success("Odstranjeno iz cevovoda");
    } catch {
      setSaved(prev);
      toast.error("Odstranjevanje ni uspelo");
    }
  }

  async function handleStageChange(opportunityId: string, stage: SavedStage) {
    const prev = saved;
    setSaved((p) => p.map((s) => (s.opportunity_id === opportunityId ? { ...s, stage } : s)));
    try {
      const res = await fetch("/api/saved", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunityId, stage }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Premaknjeno v: ${SAVED_STAGE_CONFIG[stage].label}`);
    } catch {
      setSaved(prev);
      toast.error("Posodobitev faze ni uspela");
    }
  }

  const byStage = (stage: SavedStage) =>
    saved.filter((s) => (s.stage ?? "saved") === stage && s.opportunity);

  return (
    <div>
      <Header
        title="Shranjeno"
        subtitle={`${saved.length} v cevovodu`}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1600px] space-y-6">
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
            <BookmarkCheck className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-zinc-300 mb-2">Še nič shranjenega</h3>
            <p className="text-sm text-zinc-500">
              Shranite priložnosti iz seznama, da jih boste lahko spremljali skozi svoj cevovod.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SAVED_STAGE_ORDER.map((stage) => {
              const items = byStage(stage);
              const config = SAVED_STAGE_CONFIG[stage];
              return (
                <div key={stage} className="flex flex-col gap-3 min-w-0">
                  <div className="flex items-center justify-between px-1">
                    <Badge className={cn("border", config.color)} size="sm">
                      {config.label}
                    </Badge>
                    <span className="text-xs text-zinc-600">{items.length}</span>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-2 min-h-[120px]">
                    {items.length === 0 ? (
                      <p className="text-xs text-zinc-700 text-center py-6">Tu še ni priložnosti.</p>
                    ) : (
                      items.map((s) => (
                        <PipelineCard
                          key={s.id}
                          entry={s}
                          onStageChange={handleStageChange}
                          onRemove={handleUnsave}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineCard({
  entry,
  onStageChange,
  onRemove,
}: {
  entry: SavedOpportunity;
  onStageChange: (opportunityId: string, stage: SavedStage) => void;
  onRemove: (opportunityId: string) => void;
}) {
  const opp = entry.opportunity as Opportunity;
  const stage = entry.stage ?? "saved";

  return (
    <div className="space-y-1.5">
      <OpportunityCard opportunity={opp} compact />
      {entry.notes && (
        <p className="text-[11px] text-zinc-500 italic px-1 leading-relaxed">{entry.notes}</p>
      )}
      <div className="flex items-center gap-1.5 px-1">
        <select
          value={stage}
          onChange={(e) => onStageChange(entry.opportunity_id, e.target.value as SavedStage)}
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-600"
        >
          {SAVED_STAGE_ORDER.map((s) => (
            <option key={s} value={s}>{SAVED_STAGE_CONFIG[s].label}</option>
          ))}
        </select>
        <button
          onClick={() => onRemove(entry.opportunity_id)}
          className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          title="Odstrani iz cevovoda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
