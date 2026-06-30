import type { DailyDigest } from "@/types";

export const MOCK_DIGEST: DailyDigest = {
  id: "d1000000-0001-4000-a000-000000000001",
  digest_date: "2026-06-30",
  title: "Monday Intelligence Brief — 12 High-Priority Signals Detected",
  summary:
    "Today's radar sweep identified 40 actionable opportunities across 9 signal categories. Energy infrastructure and public tenders dominate this cycle, with three critical-urgency deals requiring same-day outreach. Central Europe remains the hottest region, with €847M in combined estimated contract value now in motion. AI analysis flags NovaTech and SolDrive Europe as this week's highest-leverage targets.",
  opportunity_ids: [], // populated at runtime by getMockDigest()
  stats: {
    total_opportunities: 40,
    avg_opportunity_score: 73,
    high_urgency_count: 12,
    estimated_total_value: 847000000,
    by_type: {
      funding: 6,
      hiring: 5,
      expansion: 5,
      construction: 4,
      government_tender: 5,
      acquisition: 0,
      investment: 4,
      factory_expansion: 3,
      new_product: 0,
      technology_adoption: 4,
      energy_project: 4,
      digital_transformation: 0,
      partnership: 0,
      ipo: 0,
      other: 0,
    },
    by_country: {
      Germany: 7,
      Slovenia: 5,
      Netherlands: 5,
      France: 4,
      Poland: 4,
      Austria: 3,
      Sweden: 3,
      Croatia: 3,
      Norway: 2,
      Slovakia: 2,
      UK: 1,
      USA: 1,
    },
  },
  generated_at: "2026-06-30T06:00:00Z",
  created_at: "2026-06-30T06:00:00Z",
};
