import { cn } from "@/lib/utils/helpers";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className, hover, glow, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm",
        hover && "transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer",
        glow && "hover:shadow-lg hover:shadow-radar-500/5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("px-5 pt-5 pb-3", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("px-5 pb-5", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("px-5 py-3 border-t border-zinc-800 flex items-center", className)}
    >
      {children}
    </div>
  );
}
