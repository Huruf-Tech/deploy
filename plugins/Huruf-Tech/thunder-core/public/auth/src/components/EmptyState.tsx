import type { LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <div className="relative mb-1">
        <div className="absolute inset-0 -z-1 scale-150 rounded-full bg-primary/10 blur-xl" />
        <div className="flex size-12 items-center justify-center rounded-xl border bg-card shadow-xs/5">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-balance text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
