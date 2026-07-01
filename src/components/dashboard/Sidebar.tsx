"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Radar, LayoutDashboard, Zap, Building2,
  BookmarkCheck, Search, Calendar, Settings, Activity, X,
} from "lucide-react";
import { cn, formatRelativeDate } from "@/lib/utils/helpers";
import { useSidebar } from "./SidebarContext";
import { SLOVENIAN_RSS_SOURCES } from "@/lib/signals/sources";

export function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebar();
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/signals/live?profile=splosno")
      .then((r) => r.json())
      .then((d) => {
        setLiveCount(Array.isArray(d.data) ? d.data.length : 0);
        setLastFetched(d.fetched_at ?? null);
      })
      .catch(() => { /* sidebar stats are non-critical */ });
  }, []);

  const navItems = [
    { href: "/dashboard",      label: "Nadzorna plošča", icon: LayoutDashboard, shortcut: "⌘1", stat: "Pregled" },
    { href: "/opportunities",  label: "Priložnosti",     icon: Zap,             shortcut: "⌘2", stat: liveCount === null ? "..." : `${liveCount} v živo` },
    { href: "/companies",      label: "Podjetja",        icon: Building2,       shortcut: "⌘3", stat: "15 spremljanih" },
    { href: "/search",         label: "Iskanje",         icon: Search,          shortcut: "⌘4", stat: "Z umetno inteligenco" },
    { href: "/digest",         label: "Dnevni pregled",  icon: Calendar,        shortcut: "⌘5", stat: "Živi podatki" },
    { href: "/saved",          label: "Shranjeno",       icon: BookmarkCheck,   shortcut: "⌘6", stat: "V cevovodu" },
  ];

  return (
    <>
      {/* Mobile/tablet backdrop */}
      {open && (
        <div
          onClick={close}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-60 border-r border-zinc-800/80 bg-zinc-950 flex flex-col z-40",
          "transition-transform duration-200 ease-out",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-zinc-800/80">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-radar-500/10 border border-radar-500/25">
          <Radar className="h-4 w-4 text-radar-400" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-radar-500 border-2 border-zinc-950" />
        </div>
        <div className="flex-1">
          <span className="text-[13px] font-semibold text-white tracking-tight leading-none">Opportunity</span>
          <span className="block text-[9px] font-semibold text-radar-500 tracking-[0.2em] uppercase mt-0.5">Radar</span>
        </div>
        <button
          onClick={close}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          aria-label="Zapri meni"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Live scanning indicator */}
      <div className="mx-3 mt-3 mb-1 rounded-lg bg-radar-500/5 border border-radar-500/15 px-3 py-2">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3 text-radar-400 shrink-0" />
          <span className="text-[11px] text-zinc-400 font-medium">Pregledovanje {SLOVENIAN_RSS_SOURCES.length} virov</span>
          <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-radar-400 animate-pulse shrink-0" />
        </div>
        <p className="text-[10px] text-zinc-600 mt-1 pl-5">
          Zadnji pregled: {lastFetched ? formatRelativeDate(lastFetched) : "..."}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, shortcut, stat }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/")) || (href === "/dashboard" && pathname === "/dashboard");
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "group flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-radar-500/10 text-radar-400 shadow-sm shadow-radar-500/10 ring-1 ring-radar-500/20"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-radar-400" : "text-zinc-600 group-hover:text-zinc-300")} />
              <span className="flex-1">{label}</span>
              {active ? (
                <span className="text-[10px] text-zinc-600">{stat}</span>
              ) : (
                <span className="text-[10px] text-zinc-700 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{shortcut}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-zinc-800/80 px-3 py-3 space-y-0.5">
        <Link
          href="/settings"
          onClick={close}
          className="flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
        >
          <Settings className="h-4 w-4 text-zinc-600" />
          Nastavitve
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-radar-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">Demo uporabnik</p>
            <p className="text-[10px] text-zinc-600 truncate">živi podatki iz Slovenije</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-radar-500 shrink-0" title="Povezano" />
        </div>
      </div>
      </aside>
    </>
  );
}
