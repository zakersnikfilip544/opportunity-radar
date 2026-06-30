"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { CardSkeleton } from "@/components/ui/skeleton";
import { BookmarkCheck } from "lucide-react";
import type { Opportunity, SavedOpportunity } from "@/types";
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
      toast.error("Failed to load saved opportunities");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsave(opportunityId: string) {
    try {
      await fetch(`/api/saved?user_id=${DEMO_USER_ID}&opportunity_id=${opportunityId}`, {
        method: "DELETE",
      });
      setSaved((prev) => prev.filter((s) => s.opportunity_id !== opportunityId));
      toast.success("Removed from saved");
    } catch {
      toast.error("Failed to remove");
    }
  }

  const opportunities = saved.map((s) => s.opportunity).filter(Boolean) as Opportunity[];

  return (
    <div>
      <Header
        title="Saved"
        subtitle={`${saved.length} saved opportunities`}
      />

      <div className="px-8 py-6 max-w-7xl space-y-6">
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
            <BookmarkCheck className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-zinc-300 mb-2">Nothing saved yet</h3>
            <p className="text-sm text-zinc-500">
              Save opportunities from the feed to track them here.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                saved
                onSave={() => handleUnsave(opp.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
