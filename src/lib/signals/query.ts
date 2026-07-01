import type { Opportunity } from "@/types";

export interface OpportunityQueryFilters {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
  search?: string;
  min_score?: number;
  types?: string[];
  countries?: string[];
  industries?: string[];
  urgencies?: string[];
}

export interface OpportunityQueryResult {
  data: Opportunity[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Same filter/sort/paginate semantics as the mock data layer, applied to
 *  any in-memory Opportunity pool (used for the live signal feed). */
export function queryOpportunities(pool: Opportunity[], f: OpportunityQueryFilters = {}): OpportunityQueryResult {
  const {
    page = 1,
    per_page = 20,
    sort_by = "published_at",
    sort_order = "desc",
    search,
    min_score,
    types = [],
    countries = [],
    industries = [],
    urgencies = [],
  } = f;

  let opps = [...pool];

  if (types.length) opps = opps.filter((o) => types.includes(o.type));
  if (countries.length) opps = opps.filter((o) => o.country && countries.includes(o.country));
  if (industries.length) opps = opps.filter((o) => o.industry && industries.includes(o.industry));
  if (urgencies.length) opps = opps.filter((o) => urgencies.includes(o.urgency));
  if (min_score) opps = opps.filter((o) => (o.opportunity_score ?? 0) >= min_score);
  if (search) {
    const q = search.toLowerCase();
    opps = opps.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.summary.toLowerCase().includes(q) ||
        o.company?.name.toLowerCase().includes(q) ||
        o.source_name?.toLowerCase().includes(q) ||
        o.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  opps.sort((a, b) => {
    let va: number | string = 0;
    let vb: number | string = 0;
    if (sort_by === "opportunity_score") { va = a.opportunity_score ?? 0; vb = b.opportunity_score ?? 0; }
    else if (sort_by === "urgency_score") { va = a.urgency_score ?? 0; vb = b.urgency_score ?? 0; }
    else if (sort_by === "sales_potential") { va = a.sales_potential ?? 0; vb = b.sales_potential ?? 0; }
    else { va = a.published_at; vb = b.published_at; }
    if (sort_order === "asc") return va < vb ? -1 : va > vb ? 1 : 0;
    return va > vb ? -1 : va < vb ? 1 : 0;
  });

  const total = opps.length;
  const offset = (page - 1) * per_page;
  const data = opps.slice(offset, offset + per_page);

  return { data, total, page, per_page, total_pages: Math.ceil(total / per_page) };
}
