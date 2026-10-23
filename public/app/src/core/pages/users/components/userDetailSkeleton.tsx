import { Container } from '@/core/custom/Container'
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';

export function UserDetailSkeleton() {
  return (
    <Container className="relative flex w-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" disabled className="rounded-xl">
          <IconArrowLeft className="size-5" />
        </Button>
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-8 flex flex-col items-center text-center space-y-4 border border-border/50">
        <Skeleton className="size-24 rounded-full" />
        <div className="space-y-2 flex flex-col items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded-md" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
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
  );
}
