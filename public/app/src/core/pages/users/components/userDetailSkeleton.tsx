import { Container } from "@/core/custom/Container"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

export function UserDetailSkeleton() {
  return (
    <Container className="relative flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" disabled className="rounded-xl">
          <IconArrowLeft className="size-5" />
        </Button>
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="flex flex-col items-center space-y-4 rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
        <Skeleton className="size-24 rounded-full" />
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded-md" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded-md" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}
