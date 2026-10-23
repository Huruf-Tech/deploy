import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater";
import { Card, CardContent } from "@/components/ui/card";
export default function UserCardSkeleton() {
    return (
        <SkeletonRepeater count={12} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <Card className="flex flex-col gap-2 p-0 rounded-lg cursor-pointer">
                {/* Image skeleton */}
                <Skeleton className="aspect-square h-32 w-full rounded-none" />

                {/* Content skeleton */}
                <CardContent className="flex flex-col gap-2 py-2 px-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="border-t pt-2 mt-1 flex items-center gap-1">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </CardContent>
            </Card>
        </SkeletonRepeater>
    )
}
