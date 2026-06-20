import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  count?: number
  height?: string
  className?: string
}

export function LoadingSkeleton({ count = 3, height = "h-10", className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("w-full animate-pulse rounded-lg bg-muted", height)} />
      ))}
    </div>
  )
}
