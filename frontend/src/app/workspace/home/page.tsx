"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Building2,
  CookingPot,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  kpis: {
    tenants: number
    ollas: number
    beneficiaries: number
    supplyItems: number
  }
  activities: {
    id: string
    alertType: string
    message: string
    detectedAt: string
    ollaName: string
  }[]
  lowStock: {
    name: string
    ollaName: string
    stock: string
    isCritical: boolean
  }[]
}

const DonutChart = () => (
  <div className="flex items-center gap-6">
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.92 0.004 80)" strokeWidth="3" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.55 0.14 160)" strokeWidth="3" strokeDasharray="60 100" strokeDashoffset="0" strokeLinecap="round" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.78 0.14 75)" strokeWidth="3" strokeDasharray="25 100" strokeDashoffset="-60" strokeLinecap="round" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.52 0.16 27)" strokeWidth="3" strokeDasharray="15 100" strokeDashoffset="-85" strokeLinecap="round" />
      </svg>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-active" /><span>Stock adecuado</span><span className="ml-auto font-semibold">60%</span></div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-pending" /><span>Stock bajo</span><span className="ml-auto font-semibold">25%</span></div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive" /><span>Stock crítico</span><span className="ml-auto font-semibold">15%</span></div>
    </div>
  </div>
)

const LineChart = () => (
  <svg viewBox="0 0 300 120" className="h-28 w-full">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.55 0.14 160)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="oklch(0.55 0.14 160)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M0 100 Q25 90 50 95 Q75 80 100 70 Q125 50 150 55 Q175 35 200 40 Q225 20 250 30 Q275 15 300 20 L300 120 L0 120Z" fill="url(#grad)" />
    <path d="M0 100 Q25 90 50 95 Q75 80 100 70 Q125 50 150 55 Q175 35 200 40 Q225 20 250 30 Q275 15 300 20" fill="none" stroke="oklch(0.55 0.14 160)" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="280" cy="22" r="4" fill="oklch(0.55 0.14 160)" stroke="white" strokeWidth="2" />
  </svg>
)

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

export default function HomePage() {
  const { get } = useApi()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardStats | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await get<DashboardStats & { ok: boolean }>("/api/organizations/dashboard/stats")
      setData(res)
    } catch (err) {
      toast.error("Error al cargar las estadísticas del dashboard")
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const kpis = [
    { label: "Organizaciones", value: loading ? "..." : String(data?.kpis.tenants ?? 0), icon: Building2, change: "+12%", trend: "up", color: "from-[#0F3821]/20 to-transparent" },
    { label: "Ollas comunes", value: loading ? "..." : String(data?.kpis.ollas ?? 0), icon: CookingPot, change: "+8%", trend: "up", color: "from-emerald-500/20 to-transparent" },
    { label: "Beneficiarios", value: loading ? "..." : (data?.kpis.beneficiaries ?? 0).toLocaleString("es-PE"), icon: Users, change: "+23%", trend: "up", color: "from-blue-500/20 to-transparent" },
    { label: "Insumos", value: loading ? "..." : String(data?.kpis.supplyItems ?? 0), icon: Package, change: "-5%", trend: "down", color: "from-amber-500/20 to-transparent" },
  ]

  const getActivityConfig = (type: string) => {
    switch (type) {
      case "new_beneficiary":
        return { icon: UserPlus, color: "text-blue-500" }
      case "low_stock":
        return { icon: AlertTriangle, color: "text-red-500" }
      case "sync_conflict":
        return { icon: AlertTriangle, color: "text-amber-500" }
      default:
        return { icon: Clock, color: "text-purple-500" }
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">¡Bienvenido!</h1>
          <p className="text-sm text-muted-foreground">Resumen general del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Últimos 30 días</span>
          </div>
          <Button className="h-9 gap-2 bg-[#0F3821] text-white hover:bg-[#0F3821]/90">
            <Download className="h-4 w-4" />
            Exportar reporte
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", k.color)}>
                <k.icon className="h-5 w-5 text-[#0F3821]" />
              </div>
            </div>
            <p className="mb-1 text-3xl font-bold text-foreground">{k.value}</p>
            <div className={`flex items-center gap-1 text-xs font-medium ${k.trend === "up" ? "text-status-active" : "text-destructive"}`}>
              {k.trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {k.change} vs mes anterior
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Donut - Resumen de inventario */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Resumen de inventario</h3>
          <DonutChart />
        </div>

        {/* Line - Evolución de beneficiarios */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Evolución de beneficiarios</h3>
            <span className="text-xs text-muted-foreground">Mensual</span>
          </div>
          <LineChart />
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Insumos a vencer */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Insumos críticos y bajo stock</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : !data?.lowStock || data.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay insumos críticos.</p>
            ) : (
              data.lowStock.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                    {item.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.ollaName}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-semibold", item.isCritical ? "text-destructive" : "text-amber-500")}>
                      {item.isCritical ? "⚠ Sin stock" : "Bajo stock"}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.stock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actividades recientes */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Actividades recientes</h3>
          <div className="space-y-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : !data?.activities || data.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay actividades recientes.</p>
            ) : (
              data.activities.map((act, i) => {
                const config = getActivityConfig(act.alertType)
                return (
                  <div key={act.id || i} className="flex gap-3 border-l-2 border-border pb-4 pl-4 last:pb-0">
                    <div className={`-ml-[21px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-card`}>
                      <config.icon className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{act.message}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
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
      </div>
    </div>
  )
}
