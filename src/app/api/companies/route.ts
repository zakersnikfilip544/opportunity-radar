import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getMockCompanies } from "@/lib/mock";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const per_page = Math.min(parseInt(searchParams.get("per_page") || "20"), 100);

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      getMockCompanies({
        page,
        per_page,
        search: searchParams.get("search") ?? undefined,
        country: searchParams.get("country") ?? undefined,
        industry: searchParams.get("industry") ?? undefined,
      })
    );
  }

  const supabase = createAdminClient();
  const offset = (page - 1) * per_page;
  const search = searchParams.get("search");
  const country = searchParams.get("country");
  const industry = searchParams.get("industry");

  let query = supabase
    .from("companies")
    .select("*", { count: "exact" });

  if (search) query = query.ilike("name", `%${search}%`);
  if (country) query = query.eq("country", country);
  if (industry) query = query.eq("industry", industry);

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + per_page - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    per_page,
    total_pages: Math.ceil((count || 0) / per_page),
  });
}
