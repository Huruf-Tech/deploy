import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { IconArrowBack } from "@tabler/icons-react"

type UndoToastOptions = {
  message: React.ReactNode
  duration?: number
  undoLabel?: string
  onComplete: () => void | Promise<void>
  onUndo?: () => void
}

export const undoToast = ({
  message,
  duration = 5000,
  undoLabel = "Undo",
  onComplete,
  onUndo,
}: UndoToastOptions) => {
  let timeout: ReturnType<typeof setTimeout>

  const id = toast.custom(
    (toastId) => (
      <div className="w-89 overflow-hidden rounded-4xl border bg-background shadow-lg">
        <style>
          {`@keyframes undo-toast-progress {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}`}
        </style>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-foreground p-1 text-white">
              <IconArrowBack className="size-5" />
            </div>
            <div className="text-lg font-medium">{message}</div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              clearTimeout(timeout)
              onUndo?.()
              toast.dismiss(toastId)
            }}
          >
            {undoLabel}
          </Button>
        </div>

        <div className="h-1 bg-muted">
          <div
            className="h-full origin-left bg-primary"
            style={{
              animation: `undo-toast-progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>
    ),
    {
      duration,
    }
  )

  timeout = setTimeout(async () => {
    try {
      await onComplete()
    } finally {
      toast.dismiss(id)
    }
  }, duration)

  return {
    id,
    cancel() {
      clearTimeout(timeout)
      toast.dismiss(id)
    },
  }
}
