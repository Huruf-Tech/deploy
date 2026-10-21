import type React from "react";
import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (value: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context)
    throw new Error("useLoading must be used within LoadingProvider");
  return context;
}

/** Thin indeterminate progress bar pinned to the top of the viewport. */
export function ProgressBar({
  isLoading,
  className,
}: {
  isLoading: boolean;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-hidden={!isLoading}
      aria-busy={isLoading}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <div className="h-full w-full origin-left animate-progress bg-primary" />
    </div>
  );
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      <ProgressBar isLoading={isLoading} />
      {children}
    </LoadingContext.Provider>
  );
}
