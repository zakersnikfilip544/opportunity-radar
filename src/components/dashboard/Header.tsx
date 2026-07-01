"use client";

import { Bell, ChevronDown, Menu } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./SidebarContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const today = formatDate(new Date().toISOString(), "EEEE, MMMM d, yyyy");
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggle}
          className="lg:hidden flex h-11 w-11 -ml-2 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          aria-label="Odpri meni"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5 truncate">{subtitle || today}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {actions}
        <span className="hidden md:inline text-xs text-zinc-600">{today}</span>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-radar-400" />
        </Button>
        <button className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 sm:px-3 py-3 sm:py-1.5 text-sm text-zinc-300 hover:border-zinc-600 transition-colors">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-radar-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            U
          </div>
          <span className="hidden sm:inline">Uporabnik</span>
          <ChevronDown className="h-3 w-3 text-zinc-600 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
