import { Capacitor } from "@capacitor/core"
import React from "react"
import PullToRefresh from "react-simple-pull-to-refresh"
import { Spinner } from "./ui/spinner"

interface RefresherProps {
  onRefresh?: () => Promise<any>
  children: React.ReactNode
  pullDownThreshold?: number
}

export const Refresher: React.FC<RefresherProps> = ({
  onRefresh,
  children,
  pullDownThreshold = 80,
}) => {
  return (
    <PullToRefresh
      isPullable={
        Capacitor.getPlatform() !== "web" && typeof onRefresh === "function"
      }
      refreshingContent={
        <div className="flex w-full items-center justify-center pt-3">
          <Spinner />
        </div>
      }
      pullingContent={<></>}
      pullDownThreshold={pullDownThreshold}
      maxPullDownDistance={120}
      onRefresh={async () => await onRefresh?.()}
    >
      <React.Fragment>{children}</React.Fragment>
    </PullToRefresh>
  )
}
