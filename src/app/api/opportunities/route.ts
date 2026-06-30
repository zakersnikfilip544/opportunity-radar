import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { OpportunityFilters } from "@/types";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = req.nextUrl;

  const page = parseInt(searchParams.get("page") || "1");
  const per_page = Math.min(parseInt(searchParams.get("per_page") || "20"), 100);
  const offset = (page - 1) * per_page;

  const types = searchParams.getAll("type");
  const countries = searchParams.getAll("country");
  const industries = searchParams.getAll("industry");
  const urgencies = searchParams.getAll("urgency");
  const tags = searchParams.getAll("tag");
  const min_score = searchParams.get("min_score");
  const date_from = searchParams.get("date_from");
  const date_to = searchParams.get("date_to");
  const search = searchParams.get("search");
  const sort_by = searchParams.get("sort_by") || "published_at";
  const sort_order = searchParams.get("sort_order") || "desc";
  const featured = searchParams.get("featured");

  let query = supabase
    .from("opportunities")
    .select(
      `
      *,
      company:companies(id, name, slug, logo_url, industry, country)
    `,
      { count: "exact" }
    );

  if (types.length) query = query.in("type", types);
  if (countries.length) query = query.in("country", countries);
  if (industries.length) query = query.in("industry", industries);
  if (urgencies.length) query = query.in("urgency", urgencies);
  if (min_score) query = query.gte("opportunity_score", parseInt(min_score));
  if (date_from) query = query.gte("published_at", date_from);
  if (date_to) query = query.lte("published_at", date_to);
  if (featured === "true") query = query.eq("is_featured", true);

  if (tags.length) {
    query = query.overlaps("tags", tags);
  }

  if (search) {
    query = query.textSearch("search_vector", search, { type: "websearch" });
  }

  const ascending = sort_order === "asc";
  query = query
    .order(sort_by as "published_at", { ascending })
    .range(offset, offset + per_page - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    per_page,
    total_pages: Math.ceil((count || 0) / per_page),
  });
}
