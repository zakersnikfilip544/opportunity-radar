"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OPPORTUNITY_TYPE_CONFIG } from "@/types";
import type { OpportunityFilters, OpportunityType, UrgencyLevel } from "@/types";
import { cn } from "@/lib/utils/helpers";

interface FilterPanelProps {
  filters: OpportunityFilters;
  onChange: (filters: OpportunityFilters) => void;
}

const COUNTRIES = ["US", "Germany", "UK", "France", "Slovenia", "Croatia", "Austria", "Italy", "Poland", "Netherlands", "Sweden"];
const INDUSTRIES = ["Technology", "Finance", "Energy", "Construction", "Healthcare", "Manufacturing", "Retail", "Agriculture", "Real Estate", "Logistics"];
const URGENCIES: UrgencyLevel[] = ["critical", "high", "medium", "low"];

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  function toggleType(type: OpportunityType) {
    const current = filters.type || [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({ ...filters, type: next.length ? next : undefined });
  }

  function toggleUrgency(u: UrgencyLevel) {
    const current = filters.urgency || [];
    const next = current.includes(u) ? current.filter((x) => x !== u) : [...current, u];
    onChange({ ...filters, urgency: next.length ? next : undefined });
  }

  function toggleCountry(c: string) {
    const current = filters.country || [];
    const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c];
    onChange({ ...filters, country: next.length ? next : undefined });
  }

  function toggleIndustry(ind: string) {
    const current = filters.industry || [];
    const next = current.includes(ind) ? current.filter((x) => x !== ind) : [...current, ind];
    onChange({ ...filters, industry: next.length ? next : undefined });
  }

  const activeCount =
    (filters.type?.length || 0) +
    (filters.urgency?.length || 0) +
    (filters.country?.length || 0) +
    (filters.industry?.length || 0) +
    (filters.min_score ? 1 : 0);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className={cn(activeCount > 0 && "border-radar-500/50 text-radar-400")}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 h-4 w-4 rounded-full bg-radar-500 text-[10px] font-bold text-white flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl z-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-200">Filters</span>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                  onClick={() => onChange({})}
                >
                  Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Type */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Opportunity Type</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(OPPORTUNITY_TYPE_CONFIG) as OpportunityType[]).map((type) => {
                const conf = OPPORTUNITY_TYPE_CONFIG[type];
                const active = filters.type?.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "text-xs px-2 py-1 rounded-md border transition-all",
                      active ? conf.color : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                    )}
                  >
                    {conf.icon} {conf.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Urgency</p>
            <div className="flex gap-1.5">
              {URGENCIES.map((u) => (
                <button
                  key={u}
                  onClick={() => toggleUrgency(u)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md border capitalize transition-all",
                    filters.urgency?.includes(u)
                      ? "border-radar-500/50 bg-radar-500/10 text-radar-400"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Min Score */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Min Score: {filters.min_score || 0}
            </p>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.min_score || 0}
              onChange={(e) =>
                onChange({ ...filters, min_score: parseInt(e.target.value) || undefined })
              }
              className="w-full accent-radar-500"
            />
          </div>

          {/* Country */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Country</p>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCountry(c)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-md border transition-all",
                    filters.country?.includes(c)
                      ? "border-radar-500/50 bg-radar-500/10 text-radar-400"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Industry</p>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggleIndustry(ind)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-md border transition-all",
                    filters.industry?.includes(ind)
                      ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                  )}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
