"use client";

import { cn } from "@/lib/utils/helpers";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizes = {
  sm: { radius: 20, stroke: 3, viewBox: 50, text: "text-xs" },
  md: { radius: 30, stroke: 4, viewBox: 70, text: "text-sm" },
  lg: { radius: 40, stroke: 5, viewBox: 90, text: "text-base" },
};

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

export function ScoreRing({ score, size = "md", label, className }: ScoreRingProps) {
  const { radius, stroke, viewBox, text } = sizes[size];
  const center = viewBox / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg
        width={viewBox}
        height={viewBox}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        className="-rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#27272a"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className={cn("rotate-90 font-bold fill-white", text)}
          style={{ transform: `rotate(90deg) translate(0, 0)`, transformOrigin: `${center}px ${center}px` }}
        >
          {score}
        </text>
      </svg>
      {label && <span className="text-xs text-zinc-500 text-center">{label}</span>}
    </div>
  );
}
