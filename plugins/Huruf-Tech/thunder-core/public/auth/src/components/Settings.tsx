import type React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Title + description at the top of an account section. */
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** A group of related settings rendered as a card. */
export function SettingsCard({
  title,
  description,
  action,
  footer,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs/5",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-1 sm:px-6">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children && <div className="px-2 py-2 sm:px-3">{children}</div>}
      {footer && (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3 text-sm text-muted-foreground sm:px-6">
          {footer}
        </footer>
      )}
    </section>
  );
}

/** One row inside a SettingsCard: icon, label, value and trailing action. */
export function SettingsRow({
  icon: Icon,
  media,
  title,
  description,
  action,
  onClick,
  stackOnMobile,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  media?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  /** Move the action under the text on narrow screens (for wide controls). */
  stackOnMobile?: boolean;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-start sm:px-3.5",
        onClick &&
          "cursor-pointer transition-colors outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring",
        stackOnMobile && "max-sm:flex-wrap",
        className,
      )}
    >
      {media ??
        (Icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
            <Icon className="size-4" />
          </div>
        ))}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {description}
          </div>
        )}
      </div>
      {action && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2",
            // 2.25rem icon + 0.875rem gap: line the action up with the text.
            stackOnMobile && "max-sm:basis-full max-sm:ps-[3.125rem]",
          )}
        >
          {action}
        </div>
      )}
    </Comp>
  );
}

export function SettingsRowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 px-3 py-3 sm:px-3.5">
      <Skeleton className="size-9 rounded-lg" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3.5 w-52" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

/** Coloured pill used for statuses (enabled, verified, expired, ...). */
export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "primary";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset [&_svg]:size-3",
        tone === "neutral" && "bg-muted text-muted-foreground ring-border",
        tone === "success" &&
          "bg-success/10 text-success-foreground ring-success/20",
        tone === "warning" &&
          "bg-warning/10 text-warning-foreground ring-warning/25",
        tone === "danger" &&
          "bg-destructive/8 text-destructive-foreground ring-destructive/20",
        tone === "info" && "bg-info/10 text-info-foreground ring-info/20",
        tone === "primary" && "bg-primary/10 text-primary ring-primary/20",
        className,
      )}
    >
      {children}
    </span>
  );
}
