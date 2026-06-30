"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { FilterPanel } from "@/components/opportunities/FilterPanel";
import { SearchBar } from "@/components/search/SearchBar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LayoutGrid, List, X, Star, Zap, AlertTriangle } from "lucide-react";
import type { Opportunity, OpportunityFilters, PaginatedResponse } from "@/types";
import { cn } from "@/lib/utils/helpers";
import toast from "react-hot-toast";

const QUICK_FILTERS: { label: string; icon: React.ReactNode; filters: Partial<OpportunityFilters> }[] = [
  { label: "Top Scored", icon: <Star className="h-3 w-3" />, filters: { sort_by: "opportunity_score", sort_order: "desc", min_score: 70 } },
  { label: "Critical", icon: <AlertTriangle className="h-3 w-3" />, filters: { urgency: ["critical"] } },
  { label: "High Urgency", icon: <Zap className="h-3 w-3" />, filters: { urgency: ["critical", "high"] } },
  { label: "Funding", icon: <span className="text-[11px]">💰</span>, filters: { type: ["funding"] } },
  { label: "Expansion", icon: <span className="text-[11px]">🌍</span>, filters: { type: ["expansion"] } },
  { label: "Hiring", icon: <span className="text-[11px]">👥</span>, filters: { type: ["hiring"] } },
  { label: "Tenders", icon: <span className="text-[11px]">📋</span>, filters: { type: ["government_tender"] } },
];

const SORT_OPTIONS = [
  { value: "published_at", label: "Latest" },
  { value: "opportunity_score", label: "Score" },
  { value: "urgency_score", label: "Urgency" },
  { value: "sales_potential", label: "Sales Potential" },
];

const DEFAULT_FILTERS: OpportunityFilters = { page: 1, per_page: 18, sort_by: "published_at", sort_order: "desc" };

function OpportunitiesContent() {
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<Opportunity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [activeQuick, setActiveQuick] = useState<number | null>(null);

  const [filters, setFilters] = useState<OpportunityFilters>(() => {
    const f: OpportunityFilters = { ...DEFAULT_FILTERS };
    if (searchParams.get("sort_by")) f.sort_by = searchParams.get("sort_by") as OpportunityFilters["sort_by"];
    if (searchParams.get("sort_order")) f.sort_order = searchParams.get("sort_order") as "asc" | "desc";
    if (searchParams.get("min_score")) f.min_score = Number(searchParams.get("min_score"));
    const urgencies = searchParams.getAll("urgency");
    if (urgencies.length) f.urgency = urgencies as OpportunityFilters["urgency"];
    return f;
  });

  const fetchOpportunities = useCallback(async (f: OpportunityFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.page) params.set("page", String(f.page));
      if (f.per_page) params.set("per_page", String(f.per_page));
      if (f.sort_by) params.set("sort_by", f.sort_by);
      if (f.sort_order) params.set("sort_order", f.sort_order);
      if (f.search) params.set("search", f.search);
      if (f.min_score) params.set("min_score", String(f.min_score));
      if (f.date_from) params.set("date_from", f.date_from);
      if (f.date_to) params.set("date_to", f.date_to);
      f.type?.forEach((t) => params.append("type", t));
      f.country?.forEach((c) => params.append("country", c));
      f.industry?.forEach((i) => params.append("industry", i));
      f.urgency?.forEach((u) => params.append("urgency", u));

      const res = await fetch(`/api/opportunities?${params}`);
      setData(await res.json());
    } catch {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOpportunities(filters); }, [filters, fetchOpportunities]);

  function handleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    toast.success(saved.has(id) ? "Removed from saved" : "Saved!");
  }

  function applyQuickFilter(idx: number) {
    if (activeQuick === idx) {
      setActiveQuick(null);
      setFilters({ ...DEFAULT_FILTERS });
    } else {
      setActiveQuick(idx);
      setFilters({ ...DEFAULT_FILTERS, ...QUICK_FILTERS[idx].filters });
    }
  }

  function clearFilter(key: keyof OpportunityFilters) {
    setActiveQuick(null);
    setFilters((f) => { const next = { ...f }; delete next[key]; next.page = 1; return next; });
  }

  // Active filter chips
  const chips: { label: string; key: keyof OpportunityFilters }[] = [];
  if (filters.search) chips.push({ label: `"${filters.search}"`, key: "search" });
  if (filters.urgency?.length) chips.push({ label: `Urgency: ${filters.urgency.join(", ")}`, key: "urgency" });
  if (filters.type?.length) chips.push({ label: `Type: ${filters.type.join(", ")}`, key: "type" });
  if (filters.min_score) chips.push({ label: `Score ≥ ${filters.min_score}`, key: "min_score" });
  if (filters.country?.length) chips.push({ label: `Country: ${filters.country.join(", ")}`, key: "country" });

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header
        title="Opportunities"
        subtitle={loading ? "Loading..." : `${data?.total ?? 0} opportunities`}
      />

      <div className="px-8 py-6 space-y-5 max-w-7xl">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-56">
            <SearchBar
              inline
              onSearch={(q) => setFilters((f) => ({ ...f, search: q, page: 1 }))}
              placeholder="Search opportunities..."
            />
          </div>
          <select
            value={filters.sort_by ?? "published_at"}
            onChange={(e) => setFilters((f) => ({ ...f, sort_by: e.target.value as OpportunityFilters["sort_by"], page: 1 }))}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <FilterPanel filters={filters} onChange={(f) => { setActiveQuick(null); setFilters({ ...f, page: 1 }); }} />
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={cn("p-2 transition-colors", view === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-2 transition-colors", view === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-zinc-600 uppercase tracking-wider mr-1">Quick:</span>
          {QUICK_FILTERS.map((qf, i) => (
            <button
              key={i}
              onClick={() => applyQuickFilter(i)}
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all",
                activeQuick === i
                  ? "bg-radar-500/15 text-radar-400 border-radar-500/30"
                  : "text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              {qf.icon}
              {qf.label}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-600">Filters:</span>
            {chips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => clearFilter(chip.key)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                {chip.label}
                <X className="h-2.5 w-2.5 text-zinc-500" />
              </button>
            ))}
            <button
              onClick={() => { setActiveQuick(null); setFilters(DEFAULT_FILTERS); }}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Result count */}
        {!loading && data && (
          <p className="text-xs text-zinc-600">
            Showing {data.data.length} of {data.total} results
            {data.total_pages > 1 && ` · page ${data.page} of ${data.total_pages}`}
          </p>
        )}

        {/* Results */}
        <div className={cn(
          view === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"
        )}>
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
            : data?.data.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  saved={saved.has(opp.id)}
                  onSave={handleSave}
                  compact={view === "list"}
                />
              ))
          }
        </div>

        {!loading && data?.data.length === 0 && (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <Zap className="h-7 w-7 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-3">No opportunities match your filters.</p>
            <Button variant="ghost" size="sm" onClick={() => { setActiveQuick(null); setFilters(DEFAULT_FILTERS); }}>
              Clear filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              Page {data.page} of {data.total_pages} · {data.total} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.total_pages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense>
      <OpportunitiesContent />
    </Suspense>
  );
}
