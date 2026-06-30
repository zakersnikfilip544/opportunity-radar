"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radar,
  LayoutDashboard,
  Zap,
  Building2,
  BookmarkCheck,
  Search,
  Calendar,
  Settings,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils/helpers";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Zap },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/search", label: "Search", icon: Search },
  { href: "/digest", label: "Daily Digest", icon: Calendar },
  { href: "/saved", label: "Saved", icon: BookmarkCheck },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 border-r border-zinc-800 bg-zinc-950 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-radar-500/10 border border-radar-500/30">
          <Radar className="h-4 w-4 text-radar-400 animate-pulse-radar" />
        </div>
        <div>
          <span className="text-sm font-semibold text-white tracking-tight">
            Opportunity
          </span>
          <span className="block text-[10px] font-medium text-radar-400 tracking-widest uppercase">
            Radar
          </span>
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-5 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Activity className="h-3 w-3 text-radar-400" />
          <span>Scanning sources</span>
          <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-radar-400 animate-pulse" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-radar-500/10 text-radar-400 border border-radar-500/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-0.5">
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all"
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
        <div className="px-3 pt-3">
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-radar-400" />
              <span className="text-xs font-medium text-zinc-300">MVP Mode</span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Scanning 12 sources daily. Upgrade for unlimited access.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
