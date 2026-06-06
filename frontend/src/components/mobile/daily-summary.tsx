"use client"

interface DailySummaryProps {
  planificadas: number
  entregadas: number
}

export function DailySummary({ planificadas, entregadas }: DailySummaryProps) {
  const pct = planificadas > 0 ? Math.round((entregadas / planificadas) * 100) : 0
  return (
    <div className="rounded-xl bg-status-active/10 p-4">
      <h3 className="mb-2 text-sm font-semibold text-status-active">Raciones del día</h3>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Planificadas</span>
        <span className="font-bold text-foreground">{planificadas}</span>
      </div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Entregadas</span>
        <span className="font-bold text-status-active">{entregadas}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-status-active/20">
        <div
          className="h-full rounded-full bg-status-active transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-muted-foreground">{pct}% de avance</p>
    </div>
  )
}
