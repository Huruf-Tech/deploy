import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import type React from "react";

/** Centered icon + title + description, used for terminal states of a flow. */
export function StatusMessage({
  tone,
  title,
  description,
  action,
}: {
  tone: "success" | "error";
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const Icon = tone === "success" ? CircleCheckIcon : CircleAlertIcon;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className={
          tone === "success"
            ? "flex size-12 items-center justify-center rounded-2xl bg-success/12 text-success"
            : "flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
        }
      >
        <Icon className="size-6" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      {action && <div className="mt-2 flex w-full flex-col">{action}</div>}
    </div>
  );
}
