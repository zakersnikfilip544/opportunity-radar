"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { FilterPanel } from "@/components/opportunities/FilterPanel";
import { SearchBar } from "@/components/search/SearchBar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import type { Opportunity, OpportunityFilters, PaginatedResponse } from "@/types";
import { cn } from "@/lib/utils/helpers";
import toast from "react-hot-toast";

function OpportunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PaginatedResponse<Opportunity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<OpportunityFilters>({
    page: 1,
    per_page: 18,
    sort_by: "published_at",
    sort_order: "desc",
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
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities(filters);
  }, [filters, fetchOpportunities]);

  function handleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    toast.success(saved.has(id) ? "Removed from saved" : "Saved!");
  }

  const sortOptions = [
    { value: "published_at", label: "Latest" },
    { value: "opportunity_score", label: "Score" },
    { value: "urgency_score", label: "Urgency" },
    { value: "sales_potential", label: "Sales Potential" },
  ];

  return (
    <div>
      <Header
        title="Opportunities"
        subtitle={`${data?.total || 0} opportunities found`}
      />

      <div className="px-8 py-6 space-y-6 max-w-7xl">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-64">
            <SearchBar
              inline
              onSearch={(q) => setFilters((f) => ({ ...f, search: q, page: 1 }))}
              placeholder="Search opportunities..."
            />
          </div>

          {/* Sort */}
          <select
            value={filters.sort_by}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sort_by: e.target.value as OpportunityFilters["sort_by"], page: 1 }))
            }
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 focus:outline-none"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <FilterPanel
            filters={filters}
            onChange={(f) => setFilters({ ...f, page: 1 })}
          />

          {/* View toggle */}
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

        {/* Results */}
        <div className={cn(
          view === "grid"
            ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "space-y-3"
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
              ))}
        </div>

        {!loading && data?.data.length === 0 && (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-500">No opportunities match your filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setFilters({ page: 1, per_page: 18 })}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              Page {data.page} of {data.total_pages} ({data.total} total)
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
