import Link from "next/link";
import { formatDate } from "@/lib/utils/helpers";
import { OPPORTUNITY_TYPE_CONFIG } from "@/types";
import type { CompanyEvent, Opportunity } from "@/types";
import { cn } from "@/lib/utils/helpers";

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  type?: string;
  opportunityId?: string;
}

interface CompanyTimelineProps {
  events?: CompanyEvent[];
  opportunities?: Pick<Opportunity, "id" | "title" | "type" | "published_at">[];
}

export function CompanyTimeline({ events = [], opportunities = [] }: CompanyTimelineProps) {
  const items: TimelineItem[] = [
    ...events.map((e) => ({
      id: e.id,
      date: e.event_date,
      title: e.title,
      type: e.event_type,
      opportunityId: e.opportunity_id,
    })),
    ...opportunities.map((o) => ({
      id: o.id,
      date: o.published_at,
      title: o.title,
      type: o.type,
      opportunityId: o.id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!items.length) {
    return (
      <div className="text-center py-8 text-sm text-zinc-600">
        No timeline events yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />
      <div className="space-y-4">
        {items.map((item, i) => {
          const typeConf = item.type && item.type in OPPORTUNITY_TYPE_CONFIG
            ? OPPORTUNITY_TYPE_CONFIG[item.type as keyof typeof OPPORTUNITY_TYPE_CONFIG]
            : null;

          return (
            <div key={item.id} className="relative flex gap-4 pl-10">
              {/* Dot */}
              <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-zinc-800 bg-zinc-950 flex items-center justify-center">
                <div className={cn("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-radar-400" : "bg-zinc-600")} />
              </div>

              <div className="flex-1 min-w-0">
                {item.opportunityId ? (
                  <Link href={`/opportunities/${item.opportunityId}`}>
                    <p className="text-sm text-zinc-200 hover:text-radar-400 transition-colors leading-snug cursor-pointer">
                      {item.title}
                    </p>
                  </Link>
                ) : (
                  <p className="text-sm text-zinc-200 leading-snug">{item.title}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {typeConf && (
                    <span className="text-[10px] text-zinc-600">
                      {typeConf.icon} {typeConf.label}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-600">{formatDate(item.date, "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
