"use client";

import { Bell, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const today = formatDate(new Date().toISOString(), "EEEE, MMMM d, yyyy");

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle || today}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <span className="text-xs text-zinc-600">{today}</span>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-radar-400" />
        </Button>
        <button className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-600 transition-colors">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-radar-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
            U
          </div>
          <span>User</span>
          <ChevronDown className="h-3 w-3 text-zinc-600" />
        </button>
      </div>
    </header>
  );
}
