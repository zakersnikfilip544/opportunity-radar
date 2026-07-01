import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { addMockSaved, getMockSaved, removeMockSaved, updateMockSavedStage } from "@/lib/mock";
import type { SavedStage } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  if (!isSupabaseConfigured()) return NextResponse.json(getMockSaved());

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("saved_opportunities")
    .select(`*, opportunity:opportunities(*, company:companies(id, name, slug, logo_url))`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const { user_id, opportunity_id, notes, tags } = await req.json();

  if (!user_id || !opportunity_id) {
    return NextResponse.json({ error: "user_id and opportunity_id required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) return NextResponse.json(addMockSaved(opportunity_id));

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("saved_opportunities")
    .upsert({ user_id, opportunity_id, notes, tags: tags || [] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { opportunity_id, stage } = await req.json();

  if (!opportunity_id || !stage) {
    return NextResponse.json({ error: "opportunity_id and stage required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const updated = updateMockSavedStage(opportunity_id, stage as SavedStage);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("saved_opportunities")
    .update({ stage })
    .eq("opportunity_id", opportunity_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("user_id");
  const opportunityId = searchParams.get("opportunity_id");

  if (!userId || !opportunityId) {
    return NextResponse.json({ error: "user_id and opportunity_id required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    removeMockSaved(opportunityId);
    return NextResponse.json({ success: true });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("saved_opportunities")
    .delete()
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
