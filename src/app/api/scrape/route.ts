import { NextRequest, NextResponse } from "next/server";
import { scrapeAllSources, scrapeSource } from "@/lib/scrapers";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Source } from "@/types";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const sourceId = body?.source_id;

  const supabase = createAdminClient();

  // Log start
  const { data: log } = await supabase
    .from("scrape_logs")
    .insert({
      source_id: sourceId || null,
      started_at: new Date().toISOString(),
      status: "running",
    })
    .select()
    .single();

  try {
    let results;
    if (sourceId) {
      const { data: source } = await supabase
        .from("sources")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
      results = [await scrapeSource(source as Source)];
    } else {
      results = await scrapeAllSources();
    }

    const totals = results.reduce(
      (acc, r) => ({
        articles_found: acc.articles_found + r.articles_found,
        articles_new: acc.articles_new + r.articles_new,
        opportunities_created: acc.opportunities_created + r.opportunities_created,
      }),
      { articles_found: 0, articles_new: 0, opportunities_created: 0 }
    );

    if (log) {
      await supabase
        .from("scrape_logs")
        .update({
          ...totals,
          completed_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", log.id);
    }

    return NextResponse.json({ success: true, results, totals });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (log) {
      await supabase
        .from("scrape_logs")
        .update({ error: msg, completed_at: new Date().toISOString(), status: "failed" })
        .eq("id", log.id);
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: logs } = await supabase
    .from("scrape_logs")
    .select("*, source:sources(name)")
    .order("started_at", { ascending: false })
    .limit(20);

  return NextResponse.json(logs || []);
}
