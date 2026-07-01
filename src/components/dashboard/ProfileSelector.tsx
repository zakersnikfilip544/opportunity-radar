"use client";

import { Radar } from "lucide-react";
import { BUSINESS_PROFILES } from "@/lib/signals/profiles";
import { useRadarProfile } from "./RadarProfileContext";
import { cn } from "@/lib/utils/helpers";

export function ProfileSelector() {
  const { profile, setProfile } = useRadarProfile();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600 uppercase tracking-wider mr-1">
        <Radar className="h-3 w-3" />
        Radar profil:
      </span>
      {BUSINESS_PROFILES.map((p) => (
        <button
          key={p.id}
          onClick={() => setProfile(p.id)}
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-lg border transition-all",
            profile === p.id
              ? "bg-radar-500/15 text-radar-400 border-radar-500/30"
              : "text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
