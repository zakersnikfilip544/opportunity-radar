import { Radio } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/helpers";

interface EmptyStateProps {
  icon?: ReactNode;
  message?: string;
  hint?: string;
  compact?: boolean;
  action?: ReactNode;
}

export const NO_LIVE_OPPORTUNITIES_MESSAGE = "Trenutno ni najdenih relevantnih priložnosti.";

export function EmptyState({ icon, message = NO_LIVE_OPPORTUNITIES_MESSAGE, hint, compact, action }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center border border-dashed border-zinc-800 rounded-xl",
        compact ? "py-8" : "py-20"
      )}
    >
      {icon ?? <Radio className="h-7 w-7 text-zinc-700 mx-auto mb-3" />}
      <p className="text-sm text-zinc-500">{message}</p>
      {hint && <p className="text-xs text-zinc-600 mt-1">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
