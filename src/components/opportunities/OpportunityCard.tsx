"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, ExternalLink, Clock, TrendingUp } from "lucide-react";
import { cn, formatRelativeDate, parseValueRange } from "@/lib/utils/helpers";
import { OPPORTUNITY_TYPE_CONFIG } from "@/types";
import type { Opportunity } from "@/types";

interface OpportunityCardProps {
  opportunity: Opportunity;
  saved?: boolean;
  onSave?: (id: string) => void;
  compact?: boolean;
}

const TYPE_BORDER: Record<string, string> = {
  funding:               "border-l-violet-500",
  hiring:                "border-l-blue-500",
  expansion:             "border-l-green-500",
  construction:          "border-l-orange-500",
  government_tender:     "border-l-red-500",
  acquisition:           "border-l-pink-500",
  investment:            "border-l-yellow-500",
  factory_expansion:     "border-l-amber-500",
  new_product:           "border-l-cyan-500",
  technology_adoption:   "border-l-teal-500",
  energy_project:        "border-l-lime-500",
  digital_transformation:"border-l-indigo-500",
  partnership:           "border-l-sky-500",
  ipo:                   "border-l-rose-500",
  other:                 "border-l-zinc-500",
};

const TYPE_GLOW: Record<string, string> = {
  funding:               "hover:shadow-violet-500/10",
  hiring:                "hover:shadow-blue-500/10",
  expansion:             "hover:shadow-green-500/10",
  construction:          "hover:shadow-orange-500/10",
  government_tender:     "hover:shadow-red-500/10",
  acquisition:           "hover:shadow-pink-500/10",
  investment:            "hover:shadow-yellow-500/10",
  factory_expansion:     "hover:shadow-amber-500/10",
  new_product:           "hover:shadow-cyan-500/10",
  technology_adoption:   "hover:shadow-teal-500/10",
  energy_project:        "hover:shadow-lime-500/10",
  digital_transformation:"hover:shadow-indigo-500/10",
  partnership:           "hover:shadow-sky-500/10",
  ipo:                   "hover:shadow-rose-500/10",
  other:                 "hover:shadow-zinc-500/10",
};

const URGENCY_DOT: Record<string, string> = {
  critical: "bg-red-500 animate-pulse",
  high:     "bg-orange-500",
  medium:   "bg-yellow-500",
  low:      "bg-zinc-600",
};

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500/15 text-green-400 ring-green-500/20" :
    score >= 60 ? "bg-yellow-500/15 text-yellow-400 ring-yellow-500/20" :
    score >= 40 ? "bg-orange-500/15 text-orange-400 ring-orange-500/20" :
                  "bg-red-500/15 text-red-400 ring-red-500/20";
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ring-1", color)}>
      <TrendingUp className="h-2.5 w-2.5" />
      {score}
    </span>
  );
}

const COUNTRY_FLAGS: Record<string, string> = {
  "Germany": "🇩🇪", "Slovenia": "🇸🇮", "Croatia": "🇭🇷", "France": "🇫🇷",
  "Netherlands": "🇳🇱", "Poland": "🇵🇱", "Austria": "🇦🇹", "Sweden": "🇸🇪",
  "United States": "🇺🇸", "USA": "🇺🇸", "Norway": "🇳🇴", "Slovakia": "🇸🇰",
  "United Kingdom": "🇬🇧", "UK": "🇬🇧", "Italy": "🇮🇹", "Spain": "🇪🇸",
};

export function OpportunityCard({ opportunity: opp, saved, onSave, compact }: OpportunityCardProps) {
  const typeConfig = OPPORTUNITY_TYPE_CONFIG[opp.type];
  const borderClass = TYPE_BORDER[opp.type] ?? "border-l-zinc-500";
  const glowClass = TYPE_GLOW[opp.type] ?? "";
  const dotClass = URGENCY_DOT[opp.urgency] ?? "bg-zinc-600";
  const flag = opp.country ? (COUNTRY_FLAGS[opp.country] ?? "🌐") : null;
  const hasValue = opp.estimated_value_min || opp.estimated_value_max;

  return (
    <div
      className={cn(
        "group relative rounded-xl border-l-[3px] border border-zinc-800 bg-zinc-900/50",
        "transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900",
        "hover:shadow-lg hover:-translate-y-0.5",
        borderClass,
        glowClass
      )}
    >
      <div className="p-4">
        {/* Row 1: type badge + urgency + score + bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0",
              typeConfig.color
            )}>
              <span className="text-[11px]">{typeConfig.icon}</span>
              {typeConfig.label}
            </span>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotClass)} title={`${opp.urgency} urgency`} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {opp.opportunity_score != null && <ScorePill score={opp.opportunity_score} />}
            {onSave && (
              <button
                onClick={(e) => { e.preventDefault(); onSave(opp.id); }}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 -m-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              >
                {saved
                  ? <BookmarkCheck className="h-3.5 w-3.5 text-radar-400" />
                  : <Bookmark className="h-3.5 w-3.5" />
                }
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <Link href={`/opportunities/${opp.id}`}>
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 mb-2 hover:text-radar-400 transition-colors cursor-pointer">
            {opp.title}
          </h3>
        </Link>

        {/* Summary */}
        {!compact && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-3">
            {opp.summary}
          </p>
        )}

        {/* Company */}
        {opp.company && (
          <Link
            href={`/companies/${opp.company.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-1"
          >
            <span className="h-4 w-4 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 shrink-0">
              {opp.company.name[0]}
            </span>
            <span className="truncate">{opp.company.name}</span>
          </Link>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-zinc-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {flag && opp.country && (
            <span className="text-[11px] text-zinc-500 flex items-center gap-1 shrink-0">
              {flag} <span className="truncate">{opp.country}</span>
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-zinc-600 shrink-0">
            <Clock className="h-2.5 w-2.5" />
            {formatRelativeDate(opp.published_at)}
          </span>
          {hasValue && (
            <span className="text-[11px] font-medium text-radar-400 truncate">
              {parseValueRange(opp.estimated_value_min, opp.estimated_value_max, opp.estimated_value_currency)}
            </span>
          )}
        </div>
        {opp.source_url && (
          <a
            href={opp.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
