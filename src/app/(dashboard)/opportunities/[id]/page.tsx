"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { OpportunityDetail } from "@/components/opportunities/OpportunityDetail";
import { CardSkeleton } from "@/components/ui/skeleton";
import { OPPORTUNITY_TYPE_CONFIG } from "@/types";
import type { Opportunity } from "@/types";
import toast from "react-hot-toast";

export default function OpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [related, setRelated] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/opportunities/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data: Opportunity = await res.json();
        setOpportunity(data);

        if (data.company?.slug) {
          try {
            const companyRes = await fetch(`/api/companies/${data.company.slug}`);
            if (companyRes.ok) {
              const companyData = await companyRes.json();
              const others = (companyData.opportunities || []).filter(
                (o: Opportunity) => o.id !== data.id
              );
              setRelated(others.slice(0, 4));
            }
          } catch {
            // related opportunities are a nice-to-have, ignore failures
          }
        }
      } catch {
        toast.error("Nalaganje priložnosti ni uspelo");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleSave() {
    setSaved(!saved);
    toast.success(saved ? "Odstranjeno iz shranjenih" : "Shranjeno na vaš seznam!");
  }

  return (
    <div>
      <Header
        title={opportunity?.title || "Priložnost"}
        subtitle={opportunity?.type ? OPPORTUNITY_TYPE_CONFIG[opportunity.type].label : undefined}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-5xl">
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
            relatedOpportunities={related}
          />
        ) : (
          <p className="text-center text-zinc-500 py-20">Priložnost ni najdena.</p>
        )}
      </div>
    </div>
  );
}
