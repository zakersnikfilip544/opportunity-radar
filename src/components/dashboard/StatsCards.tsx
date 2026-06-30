"use client";

import { Zap, TrendingUp, AlertTriangle, BarChart2 } from "lucide-react";
import { StatSkeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types";
import { cn } from "@/lib/utils/helpers";

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  trend: string;
  trendUp?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgGlow: string;
  borderColor: string;
  iconBg: string;
}

function StatCard({ label, value, sub, trend, trendUp = true, icon: Icon, accentColor, bgGlow, borderColor, iconBg }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-5 overflow-hidden transition-all duration-200",
        "bg-zinc-900/60 backdrop-blur-sm",
        borderColor,
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      {/* Background glow */}
      <div className={cn("absolute inset-0 opacity-5 pointer-events-none", bgGlow)} />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest leading-none">
            {label}
          </span>
          <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", iconBg)}>
            <Icon className={cn("h-3.5 w-3.5", accentColor)} />
          </div>
        </div>

        {/* Value */}
        <div className={cn("text-4xl font-bold tracking-tight mb-1", accentColor)}>
          {value}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-600">{sub}</span>
          <span className={cn(
            "text-[11px] font-medium px-1.5 py-0.5 rounded",
            trendUp
              ? "text-green-400 bg-green-400/10"
              : "text-red-400 bg-red-400/10"
          )}>
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  const cards: StatCardProps[] = [
    {
      label: "Total Opportunities",
      value: (stats?.total_opportunities ?? 0).toLocaleString(),
      sub: `${stats?.today_opportunities ?? 0} discovered today`,
      trend: "↑ 18% this week",
      trendUp: true,
      icon: Zap,
      accentColor: "text-radar-400",
      bgGlow: "bg-gradient-to-br from-radar-500 to-transparent",
      borderColor: "border-radar-500/20 hover:border-radar-500/40",
      iconBg: "bg-radar-500/10",
    },
    {
      label: "New Today",
      value: stats?.today_opportunities ?? 0,
      sub: "since midnight UTC",
      trend: "↑ 5 vs yesterday",
      trendUp: true,
      icon: TrendingUp,
      accentColor: "text-violet-400",
      bgGlow: "bg-gradient-to-br from-violet-500 to-transparent",
      borderColor: "border-violet-500/20 hover:border-violet-500/40",
      iconBg: "bg-violet-500/10",
    },
    {
      label: "High Urgency",
      value: stats?.high_urgency ?? 0,
      sub: "require action now",
      trend: "↑ 3 critical today",
      trendUp: false,
      icon: AlertTriangle,
      accentColor: "text-orange-400",
      bgGlow: "bg-gradient-to-br from-orange-500 to-transparent",
      borderColor: "border-orange-500/20 hover:border-orange-500/40",
      iconBg: "bg-orange-500/10",
    },
    {
      label: "Avg. Score",
      value: stats?.avg_score ?? 0,
      sub: "opportunity quality / 100",
      trend: "↑ +4 pts this week",
      trendUp: true,
      icon: BarChart2,
      accentColor: "text-yellow-400",
      bgGlow: "bg-gradient-to-br from-yellow-500 to-transparent",
      borderColor: "border-yellow-500/20 hover:border-yellow-500/40",
      iconBg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => <StatCard key={card.label} {...card} />)}
    </div>
  );
}
