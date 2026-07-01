import { NextRequest, NextResponse } from "next/server";
import { getLiveSignalsForProfile } from "@/lib/signals/engine";
import { isDevFallbackEnabled } from "@/lib/signals/dev-fallback";
import { getMockOpportunities } from "@/lib/mock";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const profile = searchParams.get("profile") ?? undefined;
  const force = searchParams.get("force") === "1";

  try {
    const { opportunities, fetchedAt, cached } = await getLiveSignalsForProfile(profile, { force });

    if (opportunities.length > 0 || !isDevFallbackEnabled()) {
      return NextResponse.json({
        data: opportunities,
        live: true,
        cached,
        fetched_at: fetchedAt,
      });
    }

    // Developer-only fallback: opt in locally with RADAR_DEV_FALLBACK=1.
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
    return NextResponse.json({
      data: [],
      live: true,
      cached: false,
      fetched_at: new Date().toISOString(),
    });
  }
}
