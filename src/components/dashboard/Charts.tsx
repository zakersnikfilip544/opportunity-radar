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
  PieChart,
  Pie,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types";
import { format, parseISO } from "date-fns";

const COLORS = ["#22c55e", "#8b5cf6", "#f59e0b", "#3b82f6", "#ef4444", "#06b6d4", "#f97316"];

interface ChartsProps {
  stats: DashboardStats | null;
}

export function TimelineChart({ stats }: ChartsProps) {
  const data = (stats?.timeline || []).map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-zinc-200">Opportunities Over Time</h3>
        <p className="text-xs text-zinc-600 mt-0.5">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#22c55e" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#radarGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TypeDistributionChart({ stats }: ChartsProps) {
  const data = (stats?.by_type || [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
    .map((d) => ({
      name: d.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count: d.count,
    }));

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-zinc-200">By Opportunity Type</h3>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px" }}
              itemStyle={{ color: "#22c55e" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CountryChart({ stats }: ChartsProps) {
  const data = (stats?.by_country || [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-zinc-200">Top Countries</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((d, i) => (
            <div key={d.country} className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 w-4">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-300">{d.country || "Unknown"}</span>
                  <span className="text-xs text-zinc-500">{d.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-radar-500 to-violet-500"
                    style={{ width: `${(d.count / data[0].count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
