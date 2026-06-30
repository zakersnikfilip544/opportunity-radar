"use client";

import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  MapPin,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn, formatRelativeDate, truncate } from "@/lib/utils/helpers";
import { OPPORTUNITY_TYPE_CONFIG, URGENCY_CONFIG } from "@/types";
import type { Opportunity } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OpportunityCardProps {
  opportunity: Opportunity;
  saved?: boolean;
  onSave?: (id: string) => void;
  compact?: boolean;
}

export function OpportunityCard({
  opportunity: opp,
  saved,
  onSave,
  compact,
}: OpportunityCardProps) {
  const typeConfig = OPPORTUNITY_TYPE_CONFIG[opp.type];
  const urgencyConfig = URGENCY_CONFIG[opp.urgency];

  return (
    <div
      className={cn(
        "group rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all duration-200",
        "hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {/* Card top */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border",
                typeConfig.color
              )}
            >
              <span>{typeConfig.icon}</span>
              {typeConfig.label}
            </span>
            {opp.urgency !== "low" && (
              <span className={cn("text-xs font-medium", urgencyConfig.color)}>
                ● {urgencyConfig.label} urgency
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {opp.opportunity_score !== undefined && (
              <div className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1">
                <TrendingUp className="h-3 w-3 text-radar-400" />
                <span className="text-xs font-bold text-radar-400">{opp.opportunity_score}</span>
              </div>
            )}
            {onSave && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  onSave(opp.id);
                }}
              >
                {saved ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-radar-400" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        <Link href={`/opportunities/${opp.id}`}>
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug mb-2 hover:text-radar-400 transition-colors cursor-pointer line-clamp-2">
            {opp.title}
          </h3>
        </Link>

        {!compact && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
            {opp.summary}
          </p>
        )}

        {/* Company */}
        {opp.company && (
          <Link
            href={`/companies/${opp.company.slug}`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <div className="h-4 w-4 rounded bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400">
              {opp.company.name[0]}
            </div>
            {opp.company.name}
          </Link>
        )}
      </div>

      {/* Card footer */}
      <div className="px-5 py-3 border-t border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {opp.country && (
            <span className="flex items-center gap-1 text-xs text-zinc-600">
              <MapPin className="h-3 w-3" />
              {opp.country}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-zinc-600">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(opp.published_at)}
          </span>
        </div>
        {opp.source_url && (
          <a
            href={opp.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
