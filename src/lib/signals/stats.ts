import type { DashboardStats, Opportunity, OpportunityType } from "@/types";

/** Builds DashboardStats (KPI cards + charts) from the live opportunity pool. */
export function buildLiveStats(opportunities: Opportunity[]): DashboardStats {
  const today = new Date().toISOString().slice(0, 10);

  const todayOpps = opportunities.filter((o) => o.published_at.startsWith(today));
  const highUrgency = opportunities.filter((o) => o.urgency === "critical" || o.urgency === "high");
  const scores = opportunities.map((o) => o.opportunity_score ?? 0).filter(Boolean);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const typeMap: Record<string, number> = {};
  opportunities.forEach((o) => { typeMap[o.type] = (typeMap[o.type] ?? 0) + 1; });
  const by_type = Object.entries(typeMap)
    .map(([type, count]) => ({ type: type as OpportunityType, count }))
    .sort((a, b) => b.count - a.count);

  const countryMap: Record<string, number> = {};
  opportunities.forEach((o) => { if (o.country) countryMap[o.country] = (countryMap[o.country] ?? 0) + 1; });
  const by_country = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const dateMap: Record<string, number> = {};
  opportunities.forEach((o) => {
    const d = o.published_at.slice(0, 10);
    dateMap[d] = (dateMap[d] ?? 0) + 1;
  });
  const timeline = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: dateMap[key] ?? 0 };
  });

  const indMap: Record<string, number> = {};
  opportunities.forEach((o) => { if (o.industry) indMap[o.industry] = (indMap[o.industry] ?? 0) + 1; });
  const top_industries = Object.entries(indMap)
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total_opportunities: opportunities.length,
    today_opportunities: todayOpps.length,
    high_urgency: highUrgency.length,
    avg_score: avgScore,
    by_type,
    by_country,
    timeline,
    top_industries,
  };
}
