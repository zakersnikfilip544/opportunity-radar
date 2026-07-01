import type { DailyDigest, DigestStats, Opportunity, OpportunityType } from "@/types";
import { format } from "date-fns";
import { sl } from "date-fns/locale";

const EMPTY_BY_TYPE: Record<OpportunityType, number> = {
  funding: 0,
  hiring: 0,
  expansion: 0,
  construction: 0,
  government_tender: 0,
  acquisition: 0,
  investment: 0,
  factory_expansion: 0,
  new_product: 0,
  technology_adoption: 0,
  energy_project: 0,
  digital_transformation: 0,
  partnership: 0,
  ipo: 0,
  other: 0,
};

/** Builds a DailyDigest-shaped object from the live opportunity pool —
 *  deterministic, no AI summary generation. */
export function buildLiveDigest(opportunities: Opportunity[]): DailyDigest & { opportunities: Opportunity[] } {
  const now = new Date();
  const dateLabel = format(now, "EEEE, d. MMMM yyyy", { locale: sl });

  const by_type = { ...EMPTY_BY_TYPE };
  const by_country: Record<string, number> = {};
  let scoreSum = 0;
  let highUrgency = 0;

  for (const o of opportunities) {
    by_type[o.type] = (by_type[o.type] ?? 0) + 1;
    if (o.country) by_country[o.country] = (by_country[o.country] ?? 0) + 1;
    scoreSum += o.opportunity_score ?? 0;
    if (o.urgency === "critical" || o.urgency === "high") highUrgency++;
  }

  const stats: DigestStats = {
    total_opportunities: opportunities.length,
    by_type,
    by_country,
    avg_opportunity_score: opportunities.length ? Math.round(scoreSum / opportunities.length) : 0,
    high_urgency_count: highUrgency,
  };

  const title = opportunities.length
    ? `Dnevni pregled – ${opportunities.length} zaznanih poslovnih signalov`
    : "Dnevni pregled";

  const summary = opportunities.length
    ? `Danes, ${dateLabel}, je bilo iz slovenskih javnih virov zaznanih ${opportunities.length} poslovnih signalov, od tega ${highUrgency} z visoko ali kritično nujnostjo.`
    : "Trenutno ni najdenih relevantnih priložnosti.";

  return {
    id: "live-digest",
    digest_date: format(now, "yyyy-MM-dd"),
    title,
    summary,
    opportunity_ids: opportunities.map((o) => o.id),
    opportunities,
    stats,
    generated_at: now.toISOString(),
    created_at: now.toISOString(),
  };
}
