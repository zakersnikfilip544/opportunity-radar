"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail";
import { CardSkeleton } from "@/components/ui/skeleton";
import type { Opportunity } from "@/types";
import toast from "react-hot-toast";

export default function OpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/opportunities/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setOpportunity(data);
      } catch {
        toast.error("Failed to load opportunity");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleSave() {
    setSaved(!saved);
    toast.success(saved ? "Removed from saved" : "Saved to your list!");
  }

  return (
    <div>
      <Header
        title={opportunity?.title || "Opportunity"}
        subtitle={opportunity?.type?.replace(/_/g, " ")}
      />
      <div className="px-8 py-8 max-w-5xl">
        {loading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : opportunity ? (
          <OpportunityDetail
            opportunity={opportunity}
            saved={saved}
            onSave={handleSave}
          />
        ) : (
          <p className="text-center text-zinc-500 py-20">Opportunity not found.</p>
        )}
      </div>
    </div>
  );
}
