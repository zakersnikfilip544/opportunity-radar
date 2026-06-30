import { cn } from "@/lib/utils/helpers";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "outline" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-zinc-800 text-zinc-300 border-zinc-700",
  outline: "bg-transparent text-zinc-400 border-zinc-700",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const sizes = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
