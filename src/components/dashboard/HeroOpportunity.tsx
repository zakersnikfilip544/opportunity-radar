import Link from "next/link";
import { Flame, ArrowUpRight, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { OPPORTUNITY_TYPE_CONFIG, URGENCY_CONFIG } from "@/types";
import type { Opportunity } from "@/types";
import { cn, deriveSalesAngle, parseValueRange } from "@/lib/utils/helpers";

interface HeroOpportunityProps {
  opportunity: Opportunity;
}

export function HeroOpportunity({ opportunity: opp }: HeroOpportunityProps) {
  const typeConfig = OPPORTUNITY_TYPE_CONFIG[opp.type];
  const urgencyConfig = URGENCY_CONFIG[opp.urgency];
  const recommendedAction = opp.suggested_action || deriveSalesAngle(opp);

  return (
    <div className="relative rounded-2xl border border-radar-500/30 bg-gradient-to-br from-radar-500/10 via-zinc-900 to-zinc-950 p-4 sm:p-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-radar-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex items-center gap-4 shrink-0 mx-auto lg:mx-0">
          <ScoreRing score={opp.opportunity_score ?? 0} size="lg" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-3.5 w-3.5 text-radar-400" />
            <span className="text-[11px] font-semibold text-radar-400 uppercase tracking-widest">
              Best Opportunity Today
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border", typeConfig.color)}>
              {typeConfig.icon} {typeConfig.label}
            </span>
            <span className={cn("text-xs font-medium", urgencyConfig.color)}>
              ● {urgencyConfig.label} urgency
            </span>
            {opp.country && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="h-3 w-3" /> {opp.country}
              </span>
            )}
            {(opp.estimated_value_min || opp.estimated_value_max) && (
              <span className="flex items-center gap-1 text-xs text-radar-400 font-medium">
                <DollarSign className="h-3 w-3" />
                {parseValueRange(opp.estimated_value_min, opp.estimated_value_max, opp.estimated_value_currency)}
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-tight mb-1">{opp.title}</h2>
          {opp.company?.name && (
            <p className="text-xs text-zinc-500 mb-3">{opp.company.name}</p>
          )}

          {opp.why_it_matters && (
            <p className="text-sm text-zinc-400 leading-relaxed mb-2">
              <span className="text-zinc-300 font-medium">Why it matters: </span>
              {opp.why_it_matters}
            </p>
          )}
          <p className="text-sm text-zinc-400 leading-relaxed">
            <span className="text-zinc-300 font-medium">Recommended action: </span>
            {recommendedAction}
          </p>
        </div>

        <div className="shrink-0 mx-auto lg:mx-0">
          <Link href={`/opportunities/${opp.id}`}>
            <Button variant="primary" size="lg">
              View Strategy
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
