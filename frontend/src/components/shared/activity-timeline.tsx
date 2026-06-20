import { UserPlus, AlertTriangle, Clock } from "lucide-react"

interface Activity {
  id: string
  alertType: string
  message: string
  detectedAt: string
  ollaName: string
}

interface ActivityTimelineProps {
  activities: Activity[]
  loading?: boolean
}

function formatTime(isoStr: string) {
  const date = new Date(isoStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / (1000 * 60))
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Ayer"
  return `Hace ${days} días`
}

function getActivityConfig(type: string) {
  switch (type) {
    case "new_beneficiary": return { icon: UserPlus, color: "text-blue-500" }
    case "low_stock": return { icon: AlertTriangle, color: "text-red-500" }
    case "sync_conflict": return { icon: AlertTriangle, color: "text-amber-500" }
    default: return { icon: Clock, color: "text-purple-500" }
  }
}

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Actividades recientes</h3>
      <div className="space-y-0">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No hay actividades recientes.</p>
        ) : (
          activities.map((act, i) => {
            const config = getActivityConfig(act.alertType)
            const Icon = config.icon
            return (
              <div key={act.id || i} className="flex gap-3 border-l-2 border-border pb-4 pl-4 last:pb-0">
                <div className="-ml-[21px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-card">
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{act.message}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold">{act.ollaName}</span>
                    <span>•</span>
                    <span>{formatTime(act.detectedAt)}</span>
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
