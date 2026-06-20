"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Download, Calendar } from "lucide-react"
import { Building2, CookingPot, Users, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { KpiCard } from "@/components/shared/kpi-card"
import { DonutChart } from "@/components/shared/donut-chart"
import { LineChart } from "@/components/shared/line-chart"
import { ActivityTimeline } from "@/components/shared/activity-timeline"
import { LowStockTable } from "@/components/shared/low-stock-table"

interface DashboardData {
  kpis: { tenants: number; ollas: number; beneficiaries: number; supplyItems: number }
  charts: {
    stockDistribution: { adequate: number; low: number; critical: number }
    beneficiaryEvolution: { month: string; count: number }[]
  }
  activities: { id: string; alertType: string; message: string; detectedAt: string; ollaName: string }[]
  lowStock: { name: string; ollaName: string; stock: string; isCritical: boolean }[]
}

const STOCK_COLORS = {
  adequate: "oklch(0.55 0.14 160)",
  low: "oklch(0.78 0.14 75)",
  critical: "oklch(0.52 0.16 27)",
}

export default function HomePage() {
  const router = useRouter()
  const { get } = useApi()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await get<DashboardData & { ok: boolean }>("/api/organizations/dashboard/stats")
      setData(res)
    } catch {
      toast.error("Error al cargar las estadísticas del dashboard")
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => { fetchStats() }, [fetchStats])

  const stockData = [
    { name: "Stock adecuado", value: data?.charts?.stockDistribution?.adequate ?? 0, color: STOCK_COLORS.adequate },
    { name: "Stock bajo", value: data?.charts?.stockDistribution?.low ?? 0, color: STOCK_COLORS.low },
    { name: "Stock crítico", value: data?.charts?.stockDistribution?.critical ?? 0, color: STOCK_COLORS.critical },
  ]

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
          <Button className="h-9 gap-2 bg-[#0F3821] text-white hover:bg-[#0F3821]/90" onClick={() => router.push("/workspace/reportes")}>
            <Download className="h-4 w-4" />
            Exportar reporte
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Organizaciones" value={String(data?.kpis.tenants ?? 0)} icon={Building2} change="+12%" trend="up" color="from-[#0F3821]/20 to-transparent" loading={loading} />
        <KpiCard label="Ollas comunes" value={String(data?.kpis.ollas ?? 0)} icon={CookingPot} change="+8%" trend="up" color="from-emerald-500/20 to-transparent" loading={loading} />
        <KpiCard label="Beneficiarios" value={(data?.kpis.beneficiaries ?? 0).toLocaleString("es-PE")} icon={Users} change="+23%" trend="up" color="from-blue-500/20 to-transparent" loading={loading} />
        <KpiCard label="Insumos" value={String(data?.kpis.supplyItems ?? 0)} icon={Package} change="-5%" trend="down" color="from-amber-500/20 to-transparent" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <DonutChart data={stockData} title="Resumen de inventario" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <LineChart data={data?.charts?.beneficiaryEvolution ?? []} title="Evolución de beneficiarios" />
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-6 xl:grid-cols-2">
        <LowStockTable items={data?.lowStock ?? []} loading={loading} />
        <ActivityTimeline activities={data?.activities ?? []} loading={loading} />
      </div>
    </div>
  )
}
