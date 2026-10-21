/* eslint-disable react-refresh/only-export-components */
import type React from "react"
import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

interface LoadingContextType {
  isLoading: boolean
  setLoading: (value: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)

  if (!context)
    throw new Error("useLoading must be used within LoadingProvider")

  return context
}

export function LoadingProvider({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      <div
        className={cn(
          "fixed z-999999999999999 w-full",
          isLoading ? "visible" : "invisible"
        )}
      >
        <div className={`relative h-1.25 w-full overflow-hidden ${className}`}>
          <div className="absolute inset-0 animate-[slide_2s_ease-in-out_infinite_alternate] bg-primary" />
          <style>{`
            @keyframes slide {
              0% {
                transform: translateX(-80%);
              }
              100% {
                transform: translateX(80%);
              }
            }
          `}</style>
        </div>
      </div>
      {children}
    </LoadingContext.Provider>
  )
}
