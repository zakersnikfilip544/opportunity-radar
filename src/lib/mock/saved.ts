import type { SavedOpportunity, SavedStage } from "@/types";
import { MOCK_OPPORTUNITIES } from "./opportunities";

export const DEMO_USER_ID = "demo-user-001";

const SEED: { opportunityIndex: number; stage: SavedStage; notes?: string }[] = [
  { opportunityIndex: 0, stage: "saved", notes: "Series B just closed — reach out this week." },
  { opportunityIndex: 20, stage: "saved" },
  { opportunityIndex: 6, stage: "contacted", notes: "Sent cold email 2 days ago, awaiting reply." },
  { opportunityIndex: 13, stage: "contacted" },
  { opportunityIndex: 17, stage: "meeting", notes: "Discovery call booked for next week." },
  { opportunityIndex: 11, stage: "won", notes: "Signed a 3-month pilot engagement." },
  { opportunityIndex: 25, stage: "lost", notes: "Went with an incumbent vendor." },
];

export function buildMockSaved(): SavedOpportunity[] {
  return SEED.filter((s) => MOCK_OPPORTUNITIES[s.opportunityIndex]).map((s, i) => {
    const opp = MOCK_OPPORTUNITIES[s.opportunityIndex];
    return {
      id: `sv-seed-${String(i + 1).padStart(3, "0")}`,
      user_id: DEMO_USER_ID,
      opportunity_id: opp.id,
      stage: s.stage,
      notes: s.notes,
      tags: [],
      created_at: opp.created_at,
    };
  });
}
