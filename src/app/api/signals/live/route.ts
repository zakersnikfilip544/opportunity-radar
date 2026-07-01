import { NextResponse } from "next/server";
import { getLiveSlovenianSignals } from "@/lib/signals/engine";
import { getMockOpportunities } from "@/lib/mock";

export async function GET() {
  try {
    const { opportunities, fetchedAt, cached } = await getLiveSlovenianSignals();

    if (opportunities.length > 0) {
      return NextResponse.json({
        data: opportunities,
        live: true,
        cached,
        fetched_at: fetchedAt,
      });
    }

    // Fallback: RSS returned nothing new right now — show mock Slovenian data
    // so the section is never empty.
    const fallback = getMockOpportunities({
      countries: ["Slovenia"],
      sort_by: "opportunity_score",
      sort_order: "desc",
      per_page: 6,
    });

    return NextResponse.json({
      data: fallback.data,
      live: false,
      cached: false,
      fetched_at: fetchedAt,
    });
  } catch (error) {
    console.error("[api/signals/live] Unexpected error:", error);
    const fallback = getMockOpportunities({
      countries: ["Slovenia"],
      sort_by: "opportunity_score",
      sort_order: "desc",
      per_page: 6,
    });

    return NextResponse.json({
      data: fallback.data,
      live: false,
      cached: false,
      fetched_at: new Date().toISOString(),
    });
  }
}
