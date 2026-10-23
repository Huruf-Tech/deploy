import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonRepeaterProps extends React.ComponentPropsWithoutRef<"div"> {
  count?: number;
}

export const SkeletonRepeater: React.FC<SkeletonRepeaterProps> = ({
  count = 3,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("flex flex-col gap-1 w-full", className)} {...props}>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{children}</React.Fragment>
      ))}
    </div>
  );
};
