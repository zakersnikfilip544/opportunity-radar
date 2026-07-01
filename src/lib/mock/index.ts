import type { Opportunity, Company, DashboardStats, OpportunityType, SavedOpportunity, SavedStage } from "@/types";
import { MOCK_OPPORTUNITIES } from "./opportunities";
import { MOCK_COMPANIES } from "./companies";
import { MOCK_DIGEST } from "./digest";
import { buildMockSaved, DEMO_USER_ID } from "./saved";

// Attach company objects to opportunities
const companiesById = Object.fromEntries(MOCK_COMPANIES.map((c) => [c.id, c]));

export const MOCK_OPPS_WITH_COMPANY: (Opportunity & { company?: Company })[] =
  MOCK_OPPORTUNITIES.map((o) => ({
    ...o,
    company: o.company_id ? companiesById[o.company_id] : undefined,
  }));

// ── Stats ──────────────────────────────────────────────────────────────────

export function getMockStats(): DashboardStats {
  const opps = MOCK_OPPS_WITH_COMPANY;
  const today = new Date().toISOString().slice(0, 10);

  const todayOpps = opps.filter((o) => o.published_at.startsWith(today));
  const highUrgency = opps.filter((o) => o.urgency === "critical" || o.urgency === "high");
  const scores = opps.map((o) => o.opportunity_score ?? 0).filter(Boolean);
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  // by_type
  const typeMap: Record<string, number> = {};
  opps.forEach((o) => { typeMap[o.type] = (typeMap[o.type] ?? 0) + 1; });
  const by_type = Object.entries(typeMap)
    .map(([type, count]) => ({ type: type as OpportunityType, count }))
    .sort((a, b) => b.count - a.count);

  // by_country
  const countryMap: Record<string, number> = {};
  opps.forEach((o) => { if (o.country) countryMap[o.country] = (countryMap[o.country] ?? 0) + 1; });
  const by_country = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  // timeline — last 14 days
  const dateMap: Record<string, number> = {};
  opps.forEach((o) => {
    const d = o.published_at.slice(0, 10);
    dateMap[d] = (dateMap[d] ?? 0) + 1;
  });
  const timeline = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: dateMap[key] ?? 0 };
  });

  // top_industries
  const indMap: Record<string, number> = {};
  opps.forEach((o) => { if (o.industry) indMap[o.industry] = (indMap[o.industry] ?? 0) + 1; });
  const top_industries = Object.entries(indMap)
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total_opportunities: opps.length,
    today_opportunities: todayOpps.length,
    high_urgency: highUrgency.length,
    avg_score: avgScore,
    by_type,
    by_country,
    timeline,
    top_industries,
  };
}

// ── Opportunities ──────────────────────────────────────────────────────────

type OppFilters = {
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
  featured?: boolean;
};

export function getMockOpportunities(f: OppFilters = {}) {
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
    featured,
  } = f;

  let opps = [...MOCK_OPPS_WITH_COMPANY];

  if (types.length) opps = opps.filter((o) => types.includes(o.type));
  if (countries.length) opps = opps.filter((o) => o.country && countries.includes(o.country));
  if (industries.length) opps = opps.filter((o) => o.industry && industries.includes(o.industry));
  if (urgencies.length) opps = opps.filter((o) => urgencies.includes(o.urgency));
  if (min_score) opps = opps.filter((o) => (o.opportunity_score ?? 0) >= min_score);
  if (featured) opps = opps.filter((o) => o.is_featured);
  if (search) {
    const q = search.toLowerCase();
    opps = opps.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.summary.toLowerCase().includes(q) ||
        o.company?.name.toLowerCase().includes(q)
    );
  }

  // Sort
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

export function getMockOpportunity(id: string) {
  return MOCK_OPPS_WITH_COMPANY.find((o) => o.id === id) ?? null;
}

// ── Companies ──────────────────────────────────────────────────────────────

type CompanyFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  country?: string;
  industry?: string;
};

export function getMockCompanies(f: CompanyFilters = {}) {
  const { page = 1, per_page = 20, search, country, industry } = f;

  let companies = [...MOCK_COMPANIES];
  if (search) companies = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  if (country) companies = companies.filter((c) => c.country === country);
  if (industry) companies = companies.filter((c) => c.industry === industry);

  const total = companies.length;
  const offset = (page - 1) * per_page;
  const data = companies.slice(offset, offset + per_page);
  return { data, total, page, per_page, total_pages: Math.ceil(total / per_page) };
}

export function getMockCompany(id: string) {
  const isUUID = /^[0-9a-f-]{36}$/.test(id);
  const company = isUUID
    ? MOCK_COMPANIES.find((c) => c.id === id)
    : MOCK_COMPANIES.find((c) => c.slug === id);
  if (!company) return null;

  const opportunities = MOCK_OPPORTUNITIES.filter((o) => o.company_id === company.id).slice(0, 20);
  return { company, opportunities, events: [] };
}

// ── Digest ─────────────────────────────────────────────────────────────────

export function getMockDigest() {
  const opps = MOCK_OPPS_WITH_COMPANY.slice(0, 20);
  return {
    ...MOCK_DIGEST,
    opportunity_ids: opps.map((o) => o.id),
    opportunities: opps,
  };
}

// ── Saved pipeline ─────────────────────────────────────────────────────────

let mockSavedStore: SavedOpportunity[] | null = null;

function savedStore(): SavedOpportunity[] {
  if (!mockSavedStore) mockSavedStore = buildMockSaved();
  return mockSavedStore;
}

export function getMockSaved(): (SavedOpportunity & { opportunity?: Opportunity })[] {
  return [...savedStore()]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((s) => ({ ...s, opportunity: getMockOpportunity(s.opportunity_id) ?? undefined }));
}

export function addMockSaved(opportunityId: string): SavedOpportunity {
  const store = savedStore();
  const existing = store.find((s) => s.opportunity_id === opportunityId);
  if (existing) return existing;
  const entry: SavedOpportunity = {
    id: `sv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: DEMO_USER_ID,
    opportunity_id: opportunityId,
    stage: "saved",
    tags: [],
    created_at: new Date().toISOString(),
  };
  store.unshift(entry);
  return entry;
}

export function updateMockSavedStage(opportunityId: string, stage: SavedStage): SavedOpportunity | null {
  const entry = savedStore().find((s) => s.opportunity_id === opportunityId);
  if (!entry) return null;
  entry.stage = stage;
  return entry;
}

export function removeMockSaved(opportunityId: string): void {
  const store = savedStore();
  const idx = store.findIndex((s) => s.opportunity_id === opportunityId);
  if (idx >= 0) store.splice(idx, 1);
}

// ── Search ─────────────────────────────────────────────────────────────────

export function searchMockOpportunities(query: string) {
  const q = query.toLowerCase();
  return MOCK_OPPS_WITH_COMPANY.filter(
    (o) =>
      o.title.toLowerCase().includes(q) ||
      o.summary.toLowerCase().includes(q) ||
      o.type.includes(q) ||
      o.country?.toLowerCase().includes(q) ||
      o.industry?.toLowerCase().includes(q) ||
      o.company?.name.toLowerCase().includes(q)
  )
    .sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0))
    .slice(0, 20);
}
