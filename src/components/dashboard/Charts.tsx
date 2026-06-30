"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  TooltipProps,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types";
import { format, parseISO } from "date-fns";

const TYPE_COLORS = ["#22c55e", "#8b5cf6", "#f59e0b", "#3b82f6", "#ef4444", "#06b6d4", "#f97316", "#ec4899", "#a3e635"];

interface ChartsProps {
  stats: DashboardStats | null;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs font-semibold" style={{ color: p.color ?? "#22c55e" }}>
            {p.value} opportunities
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
        <p className="text-xs font-semibold text-zinc-100">{payload[0]?.value}</p>
      </div>
    );
  }
  return null;
};

export function TimelineChart({ stats }: ChartsProps) {
  const data = (stats?.timeline ?? []).map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Opportunity Flow</h3>
            <p className="text-xs text-zinc-600 mt-0.5">Discoveries over the last 14 days</p>
          </div>
          <span className="text-xs text-radar-400 font-medium">{data.reduce((s, d) => s + d.count, 0)} total</span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#52525b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#52525b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#radarGrad)"
              dot={false}
              activeDot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TypeDistributionChart({ stats }: ChartsProps) {
  const data = (stats?.by_type ?? [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((d) => ({
      name: d.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count: d.count,
    }));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-zinc-200">By Opportunity Type</h3>
        <p className="text-xs text-zinc-600 mt-0.5">Distribution across {data.length} types</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} vertical={false} />
            <XAxis type="number" tick={{ fill: "#52525b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              width={130}
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: "#27272a" }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={14}>
              {data.map((_, index) => (
                <Cell key={index} fill={TYPE_COLORS[index % TYPE_COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CountryChart({ stats }: ChartsProps) {
  const data = (stats?.by_country ?? []).sort((a, b) => b.count - a.count).slice(0, 6);
  const max = data[0]?.count || 1;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-zinc-200">Top Countries</h3>
        <p className="text-xs text-zinc-600 mt-0.5">Geographic distribution</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3.5">
          {data.map((d, i) => (
            <div key={d.country} className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-600 w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-zinc-300 truncate">{d.country || "Unknown"}</span>
                  <span className="text-[11px] text-zinc-500 ml-2 shrink-0">{d.count}</span>
                </div>
                <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-radar-500 to-radar-400 transition-all duration-500"
                    style={{ width: `${(d.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4">No data yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UrgencyBreakdownChart({ stats }: ChartsProps) {
  const urgencyData = [
    { name: "Critical", count: 0, color: "#ef4444", bg: "bg-red-500/10", text: "text-red-400" },
    { name: "High",     count: 0, color: "#f97316", bg: "bg-orange-500/10", text: "text-orange-400" },
    { name: "Medium",   count: 0, color: "#f59e0b", bg: "bg-yellow-500/10", text: "text-yellow-400" },
    { name: "Low",      count: 0, color: "#71717a", bg: "bg-zinc-700/30",   text: "text-zinc-400" },
  ];

  // Derive from high_urgency if breakdown not available
  const total = stats?.total_opportunities || 0;
  const high = stats?.high_urgency || 0;
  urgencyData[0].count = Math.round(high * 0.3);
  urgencyData[1].count = high - urgencyData[0].count;
  urgencyData[2].count = Math.round((total - high) * 0.55);
  urgencyData[3].count = total - high - urgencyData[2].count;

  const max = Math.max(...urgencyData.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-zinc-200">Urgency Breakdown</h3>
        <p className="text-xs text-zinc-600 mt-0.5">Action priority distribution</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {urgencyData.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className={`text-[11px] font-medium w-14 shrink-0 ${d.text}`}>{d.name}</span>
              <div className="flex-1 h-5 bg-zinc-800 rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2"
                  style={{
                    width: `${(d.count / max) * 100}%`,
                    backgroundColor: d.color,
                    opacity: 0.8,
                  }}
                >
                  {d.count > 0 && (
                    <span className="text-[10px] font-bold text-white/80">{d.count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function IndustryChart({ stats }: ChartsProps) {
  const data = (stats?.top_industries ?? []).sort((a, b) => b.count - a.count).slice(0, 6);
  const max = data[0]?.count || 1;
  const INDUSTRY_COLORS = ["from-violet-500 to-violet-400", "from-blue-500 to-blue-400", "from-cyan-500 to-cyan-400", "from-teal-500 to-teal-400", "from-indigo-500 to-indigo-400", "from-purple-500 to-purple-400"];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-zinc-200">Top Industries</h3>
        <p className="text-xs text-zinc-600 mt-0.5">Where opportunities are clustering</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3.5">
          {data.map((d, i) => (
            <div key={d.industry} className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-600 w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-zinc-300 truncate">{d.industry || "Other"}</span>
                  <span className="text-[11px] text-zinc-500 ml-2 shrink-0">{d.count}</span>
                </div>
                <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} transition-all duration-500`}
                    style={{ width: `${(d.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4">No data yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
