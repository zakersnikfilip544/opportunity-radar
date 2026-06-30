import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = createAdminClient();

  // Support both UUID and slug
  const isUUID = /^[0-9a-f-]{36}$/.test(id);
  const query = supabase.from("companies").select("*");
  const { data: company, error } = isUUID
    ? await query.eq("id", id).single()
    : await query.eq("slug", id).single();

  if (error || !company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get company opportunities
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title, type, summary, opportunity_score, urgency, published_at, tags")
    .eq("company_id", company.id)
    .order("published_at", { ascending: false })
    .limit(20);

  // Get company timeline
  const { data: events } = await supabase
    .from("company_events")
    .select("*")
    .eq("company_id", company.id)
    .order("event_date", { ascending: false })
    .limit(20);

  return NextResponse.json({ company, opportunities: opportunities || [], events: events || [] });
}
