"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

// `query` is the term actually submitted (matched against English demo data);
// `label` is the Slovenian text shown to the user.
const EXAMPLE_QUERIES: { label: string; query: string }[] = [
  { label: "Podjetja v Sloveniji, ki širijo proizvodnjo", query: "Companies in Slovenia expanding production" },
  { label: "Proizvajalci, ki zaposlujejo inženirje", query: "Manufacturers hiring engineers" },
  { label: "Naložbe v sončno energijo v Evropi", query: "Solar energy investments in Europe" },
  { label: "Tehnološka podjetja, ki prejemajo financiranje", query: "Tech companies receiving funding" },
  { label: "Javni razpisi za gradbeništvo", query: "Government tenders for construction" },
  { label: "Zagonska podjetja, ki lansirajo nove izdelke", query: "Startups launching new products" },
];

interface SearchBarProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  inline?: boolean;
}

export function SearchBar({ defaultValue = "", onSearch, placeholder, inline }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(q: string) {
    if (!q.trim()) return;
    if (onSearch) {
      onSearch(q.trim());
    } else {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-4 w-4 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(query)}
          placeholder={placeholder || "Vprašaj karkoli ... npr. podjetja, ki širijo poslovanje na področju obnovljive energije"}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 pl-11 pr-24 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-radar-500 focus:border-transparent transition-all"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <span className="text-xs text-zinc-600 hidden sm:block">⏎</span>
          <button
            onClick={() => handleSubmit(query)}
            className="flex items-center gap-1.5 rounded-lg bg-radar-500 hover:bg-radar-600 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Išči
          </button>
        </div>
      </div>

      {!inline && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-zinc-600">Poskusi:</span>
          {EXAMPLE_QUERIES.slice(0, 3).map((q) => (
            <button
              key={q.query}
              onClick={() => {
                setQuery(q.query);
                handleSubmit(q.query);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 decoration-zinc-700 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
