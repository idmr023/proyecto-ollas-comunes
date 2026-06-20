import { cn } from "@/lib/utils"

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "outline"

const variants: Record<BadgeVariant, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  outline: "bg-transparent text-muted-foreground border-border",
}

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = "neutral", className, children }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  )
}
