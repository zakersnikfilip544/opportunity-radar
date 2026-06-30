"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

const EXAMPLE_QUERIES = [
  "Companies in Slovenia expanding production",
  "Manufacturers hiring engineers",
  "Solar energy investments in Europe",
  "Tech companies receiving funding",
  "Government tenders for construction",
  "Startups launching new products",
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
          placeholder={placeholder || "Ask anything... e.g. companies expanding in renewable energy"}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 pl-11 pr-24 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-radar-500 focus:border-transparent transition-all"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <span className="text-xs text-zinc-600 hidden sm:block">⏎</span>
          <button
            onClick={() => handleSubmit(query)}
            className="flex items-center gap-1.5 rounded-lg bg-radar-500 hover:bg-radar-600 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Search
          </button>
        </div>
      </div>

      {!inline && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-zinc-600">Try:</span>
          {EXAMPLE_QUERIES.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuery(q);
                handleSubmit(q);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 decoration-zinc-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
