"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { SearchBar } from "@/components/search/SearchBar";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ProfileSelector } from "@/components/dashboard/ProfileSelector";
import { useRadarProfile } from "@/components/dashboard/RadarProfileContext";
import { Sparkles, Search } from "lucide-react";
import type { Opportunity } from "@/types";
import type { SearchFilters } from "@/lib/openai/analyzer";
import toast from "react-hot-toast";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const { profile } = useRadarProfile();

  const [results, setResults] = useState<Opportunity[]>([]);
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (query) {
      doSearch(query, () => cancelled);
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, profile]);

  async function doSearch(q: string, isCancelled: () => boolean = () => false) {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&profile=${profile}`);
      const data = await res.json();
      if (isCancelled()) return; // a newer query/profile was applied while this was in flight
      setResults(data.data || []);
      setFilters(data.filters || null);
    } catch {
      if (!isCancelled()) toast.error("Iskanje ni uspelo");
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }

  function handleSearch(q: string) {
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div>
      <Header
        title="AI iskanje"
        subtitle="Iskanje poslovnih priložnosti v naravnem jeziku"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-5xl space-y-8">
        <ProfileSelector />

        {/* Hero search */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-radar-400" />
            <span className="text-sm text-zinc-400">
              Opišite, kaj iščete, v preprostem jeziku
            </span>
          </div>
          <SearchBar defaultValue={query} onSearch={handleSearch} />
        </div>

        {/* AI interpreted filters */}
        {filters && query && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-3.5 w-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-zinc-400 mb-2">
                  <span className="text-violet-400 font-medium">AI je razumela:</span>{" "}
                  {filters.intent}
                </p>
                <div className="flex flex-wrap gap-2">
                  {filters.types?.map((t) => (
                    <Badge key={t} className="bg-violet-500/10 text-violet-300 border-violet-500/20" size="sm">
                      {t}
                    </Badge>
                  ))}
                  {filters.countries?.map((c) => (
                    <Badge key={c} variant="info" size="sm">{c}</Badge>
                  ))}
                  {filters.industries?.map((i) => (
                    <Badge key={i} variant="success" size="sm">{i}</Badge>
                  ))}
                  {filters.keywords?.map((k) => (
                    <Badge key={k} variant="outline" size="sm">#{k}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : hasSearched ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">
                {results.length} rezultatov za <span className="text-white font-medium">"{query}"</span>
              </span>
            </div>

            {results.length === 0 ? (
              <EmptyState
                icon={<Search className="h-8 w-8 text-zinc-700 mx-auto mb-3" />}
                hint="Poskusite z drugimi ključnimi besedami, širšimi izrazi ali drugim radar profilom."
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {results.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-4">
              <Sparkles className="h-8 w-8 text-radar-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-200 mb-2">Iskanje z umetno inteligenco</h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Vprašajte v preprostem jeziku. Naša umetna inteligenca razume kontekst in poišče najbolj relevantne poslovne priložnosti.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
