import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getMockStats } from "@/lib/mock";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json(getMockStats());

  const supabase = createAdminClient();

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    { count: total },
    { count: todayCount },
    { data: byType },
    { data: byCountry },
    { data: timeline },
    { data: topIndustries },
    { data: highUrgency },
    { data: avgScoreData },
  ] = await Promise.all([
    supabase.from("opportunities").select("*", { count: "exact", head: true }),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .gte("published_at", today.toISOString()),
    supabase.rpc("count_by_type"),
    supabase.rpc("count_by_country"),
    supabase.rpc("opportunities_timeline", { days: 30 }),
    supabase.rpc("count_by_industry"),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .in("urgency", ["high", "critical"]),
    supabase.from("opportunities").select("opportunity_score").gte("published_at", last30.toISOString()),
  ]);

  const scores = (avgScoreData || []).map((r: { opportunity_score: number }) => r.opportunity_score).filter(Boolean);
  const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

  return NextResponse.json({
    total_opportunities: total || 0,
    today_opportunities: todayCount || 0,
    high_urgency: highUrgency || 0,
    avg_score: avgScore,
    by_type: byType || [],
    by_country: byCountry || [],
    timeline: timeline || [],
    top_industries: topIndustries || [],
  });
}
