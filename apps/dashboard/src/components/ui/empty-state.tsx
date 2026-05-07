import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  message: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon: Icon,
  message,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 py-8 text-muted-foreground lg:py-12",
        className,
      )}
    >
      <Icon className="size-8 opacity-40" />
      <p className="text-sm">{message}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
