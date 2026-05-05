import * as React from "react";
import { cn } from "@/lib/utils";

export default function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-xl bg-gray-200/80 dark:bg-dark-200/80",
        className
      )}
      {...props}
    />
  );
}