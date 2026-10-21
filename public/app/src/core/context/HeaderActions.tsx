// HeaderActions.tsx
import React from "react"
import { createPortal } from "react-dom"

type HeaderActionsContextT = {
  target: HTMLElement | null
  setActive?: React.Dispatch<React.SetStateAction<boolean>>
}

const HeaderActionsContext = React.createContext<HeaderActionsContextT>({
  target: null,
})

export function HeaderActionsProvider({
  children,
}: {
  children: (element: React.JSX.Element | null) => React.ReactNode
}) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null)
  const [active, setActive] = React.useState(false)

  const targetElement = active ? (
    <div ref={setTarget} className="absolute z-20 h-full w-full" />
  ) : null

  return (
    <HeaderActionsContext.Provider value={{ target, setActive }}>
      {children(targetElement)}
    </HeaderActionsContext.Provider>
  )
}

export function HeaderActions({ children }: { children: React.ReactNode }) {
  const context = React.useContext(HeaderActionsContext)

  if (!context) {
    throw new Error("HeaderActions must be used inside HeaderActionsProvider")
  }

  const { target, setActive } = context

  React.useEffect(() => {
    setActive?.(true)

    return () => {
      setActive?.(false)
    }
  }, [setActive])

  return target ? createPortal(children, target) : null
}
