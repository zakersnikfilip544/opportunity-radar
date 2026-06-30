import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getMockOpportunity } from "@/lib/mock";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const opp = getMockOpportunity(id);
    if (!opp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(opp);
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select(`*, company:companies(*)`)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase
    .from("opportunities")
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq("id", id);

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await req.json();

  const allowedFields = ["is_featured", "is_verified", "tags"];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("opportunities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
