import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { parseNaturalLanguageSearch } from "@/lib/openai/analyzer";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Parse natural language into structured filters
  const filters = await parseNaturalLanguageSearch(query);

  let dbQuery = supabase
    .from("opportunities")
    .select(`*, company:companies(id, name, slug, logo_url)`)
    .limit(30);

  if (filters.types.length) {
    dbQuery = dbQuery.in("type", filters.types);
  }
  if (filters.countries.length) {
    dbQuery = dbQuery.in("country", filters.countries);
  }
  if (filters.industries.length) {
    dbQuery = dbQuery.in("industry", filters.industries);
  }
  if (filters.urgency) {
    dbQuery = dbQuery.eq("urgency", filters.urgency);
  }
  if (filters.min_score) {
    dbQuery = dbQuery.gte("opportunity_score", filters.min_score);
  }
  if (filters.keywords.length) {
    const searchTerm = filters.keywords.join(" | ");
    dbQuery = dbQuery.textSearch("search_vector", searchTerm, { type: "websearch" });
  }

  dbQuery = dbQuery.order("opportunity_score", { ascending: false });

  const { data, error } = await dbQuery;

  if (error) {
    // Fallback: simple text search
    const { data: fallback } = await supabase
      .from("opportunities")
      .select(`*, company:companies(id, name, slug, logo_url)`)
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
      .order("opportunity_score", { ascending: false })
      .limit(20);

    return NextResponse.json({ data: fallback || [], filters, query });
  }

  return NextResponse.json({ data: data || [], filters, query });
}
