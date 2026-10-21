import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { TablerIcon } from "@tabler/icons-react"

export interface ILoadingScreenProps {
  title: string
  icon?: TablerIcon
  description?: string
  children?: React.ReactNode
}

export function LoadingScreen({
  title,
  icon: Icon,
  description,
  children,
}: ILoadingScreenProps) {
  return (
    <Empty className="h-dvh">
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && (
        <EmptyContent className="flex-row justify-center gap-2">
          {children}
        </EmptyContent>
      )}
      {/* <Button variant="link" className="text-muted-foreground" size="sm">
        <a href="#">Having an issue?</a>
      </Button> */}
    </Empty>
  )
}
