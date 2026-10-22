import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater"
import { Card, CardContent } from "@/components/ui/card"
export default function UserCardSkeleton() {
  return (
    <SkeletonRepeater
      count={12}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6"
    >
      <Card className="flex cursor-pointer flex-col gap-2 rounded-lg p-0">
        {/* Image skeleton */}
        <Skeleton className="aspect-square h-32 w-full rounded-none" />

        {/* Content skeleton */}
        <CardContent className="flex flex-col gap-2 px-3 py-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
          <div className="mt-1 flex items-center gap-1 border-t pt-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    </SkeletonRepeater>
  )
}
