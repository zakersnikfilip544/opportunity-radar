"use client";

import { cn } from "@/lib/utils/helpers";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  children?: ReactNode;
  loading?: boolean;
}

const variants = {
  primary: "bg-radar-500 hover:bg-radar-600 text-white border-transparent shadow-lg shadow-radar-500/20",
  secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700",
  ghost: "bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border-transparent",
  danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20",
  outline: "bg-transparent hover:bg-zinc-800 text-zinc-300 border-zinc-700",
};

const sizes = {
  sm: "h-11 sm:h-7 px-3 text-xs gap-1.5",
  md: "h-11 sm:h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
  icon: "h-11 w-11 sm:h-9 sm:w-9",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radar-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        children
      )}
    </button>
  );
}
