"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { Input } from "@/components/ui/input";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Company, PaginatedResponse } from "@/types";
import toast from "react-hot-toast";

export default function CompaniesPage() {
  const [data, setData] = useState<PaginatedResponse<Company> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => fetchCompanies(), 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  async function fetchCompanies() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "24" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/companies?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header
        title="Companies"
        subtitle={`${data?.total || 0} companies tracked`}
      />

      <div className="px-8 py-6 space-y-6 max-w-7xl">
        <div className="max-w-md">
          <Input
            icon={<Search className="h-4 w-4" />}
            placeholder="Search companies..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
            : data?.data.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
        </div>

        {!loading && data?.data.length === 0 && (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-sm text-zinc-500">No companies found.</p>
          </div>
        )}

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              Page {data.page} of {data.total_pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
