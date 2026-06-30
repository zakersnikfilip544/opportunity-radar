"use client";

import { Zap, TrendingUp, AlertTriangle, Star } from "lucide-react";
import { StatSkeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Opportunities",
      value: stats?.total_opportunities?.toLocaleString() || "0",
      sub: `${stats?.today_opportunities || 0} new today`,
      icon: Zap,
      color: "text-radar-400",
      bg: "bg-radar-500/10",
      border: "border-radar-500/20",
    },
    {
      label: "Avg. Opportunity Score",
      value: stats?.avg_score || 0,
      sub: "out of 100",
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      label: "High Urgency",
      value: stats?.high_urgency || 0,
      sub: "need immediate action",
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      label: "New Today",
      value: stats?.today_opportunities || 0,
      sub: "opportunities found",
      icon: TrendingUp,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border ${card.border} ${card.bg} p-5 backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {card.label}
            </span>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <div className={`text-3xl font-bold ${card.color} mb-1`}>
            {card.value}
          </div>
          <div className="text-xs text-zinc-600">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
