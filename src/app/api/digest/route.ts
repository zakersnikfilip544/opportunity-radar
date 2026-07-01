import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateDigestSummary } from "@/lib/openai/analyzer";
import { getMockDigest } from "@/lib/mock";
import { getLiveSignalsForProfile } from "@/lib/signals/engine";
import { buildLiveDigest } from "@/lib/signals/digest";
import { isDevFallbackEnabled } from "@/lib/signals/dev-fallback";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    const { opportunities } = await getLiveSignalsForProfile(req.nextUrl.searchParams.get("profile") ?? undefined);
    if (opportunities.length > 0 || !isDevFallbackEnabled()) {
      return NextResponse.json(buildLiveDigest(opportunities));
    }
    // Developer-only fallback: opt in locally with RADAR_DEV_FALLBACK=1.
    return NextResponse.json(getMockDigest());
  }
  const supabase = createAdminClient();
  const { searchParams } = req.nextUrl;
  const dateParam = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const { data: digest, error } = await supabase
    .from("daily_digests")
    .select("*")
    .eq("digest_date", dateParam)
    .single();

  if (error || !digest) {
    return NextResponse.json({ error: "Pregled ni najden" }, { status: 404 });
  }

  // Fetch opportunities
  if (digest.opportunity_ids?.length) {
    const { data: opportunities } = await supabase
      .from("opportunities")
      .select(`*, company:companies(id, name, slug, logo_url)`)
      .in("id", digest.opportunity_ids);

    return NextResponse.json({ ...digest, opportunities: opportunities || [] });
  }

  return NextResponse.json({ ...digest, opportunities: [] });
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    // "Regenerate": bypass the cache and re-pull the live Slovenian feeds.
    const { opportunities } = await getLiveSignalsForProfile(
      req.nextUrl.searchParams.get("profile") ?? undefined,
      { force: true }
    );
    if (opportunities.length > 0 || !isDevFallbackEnabled()) {
      return NextResponse.json(buildLiveDigest(opportunities));
    }
    return NextResponse.json(getMockDigest());
  }

  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nepooblaščen dostop" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Check if digest exists already
  const { data: existing } = await supabase
    .from("daily_digests")
    .select("id")
    .eq("digest_date", today)
    .single();

  if (existing) {
    return NextResponse.json({ message: "Pregled že obstaja", id: existing.id });
  }

  // Get top 20 opportunities from today
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title, summary, type, opportunity_score, country, industry")
    .gte("published_at", since.toISOString())
    .order("opportunity_score", { ascending: false })
    .limit(20);

  if (!opportunities?.length) {
    // Fall back to last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: recent } = await supabase
      .from("opportunities")
      .select("id, title, summary, type, opportunity_score, country, industry")
      .gte("published_at", yesterday.toISOString())
      .order("opportunity_score", { ascending: false })
      .limit(20);

    if (!recent?.length) {
      return NextResponse.json({ error: "Ni najdenih priložnosti" }, { status: 404 });
    }
    opportunities?.push(...(recent || []));
  }

  const { title, summary } = await generateDigestSummary(
    opportunities!.map((o: { title: string; summary: string; type: string }) => ({
      title: o.title,
      summary: o.summary,
      type: o.type,
    }))
  );

  type DigestOpp = { id: string; title: string; summary: string; type: string; opportunity_score?: number; country?: string };

  // Compute stats
  const stats = {
    total_opportunities: opportunities!.length,
    by_type: opportunities!.reduce((acc: Record<string, number>, o: DigestOpp) => {
      acc[o.type] = (acc[o.type] || 0) + 1;
      return acc;
    }, {}),
    by_country: opportunities!.reduce((acc: Record<string, number>, o: DigestOpp) => {
      if (o.country) acc[o.country] = (acc[o.country] || 0) + 1;
      return acc;
    }, {}),
    avg_opportunity_score: Math.round(
      opportunities!.reduce((sum: number, o: DigestOpp) => sum + (o.opportunity_score || 0), 0) /
        opportunities!.length
    ),
    high_urgency_count: 0,
  };

  const { data: digest, error } = await supabase
    .from("daily_digests")
    .insert({
      digest_date: today,
      title,
      summary,
      opportunity_ids: opportunities!.map((o: DigestOpp) => o.id),
      stats,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(digest);
}
