import { cn } from "@/lib/utils/helpers";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  suffix?: ReactNode;
}

export function Input({ className, icon, suffix, ...props }: InputProps) {
  if (icon || suffix) {
    return (
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-zinc-500 pointer-events-none">{icon}</div>
        )}
        <input
          {...props}
          className={cn(
            "w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100",
            "placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-radar-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors",
            icon && "pl-9",
            suffix && "pr-9",
            className
          )}
        />
        {suffix && (
          <div className="absolute right-3 text-zinc-500 pointer-events-none">{suffix}</div>
        )}
      </div>
    );
  }

  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100",
        "placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-radar-500 focus:border-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        className
      )}
    />
  );
}
