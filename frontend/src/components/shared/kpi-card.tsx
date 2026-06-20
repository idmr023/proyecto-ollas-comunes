import { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  change: string
  trend: "up" | "down"
  color: string
  loading?: boolean
}

export function KpiCard({ label, value, icon: Icon, change, trend, color, loading }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", color)}>
          <Icon className="h-5 w-5 text-[#0F3821]" />
        </div>
      </div>
      <p className="mb-1 text-3xl font-bold text-foreground">{loading ? "..." : value}</p>
      <div className={cn("flex items-center gap-1 text-xs font-medium", trend === "up" ? "text-status-active" : "text-destructive")}>
        {trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {change} vs mes anterior
      </div>
    </div>
  )
}
