"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowDownLeft, ArrowUpRight, Users, CookingPot } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { KpiCard } from "@/components/shared/kpi-card"
import { ReportFilters } from "@/components/shared/report-filters"
import { ExportButtons } from "@/components/shared/export-buttons"
import { MovementsTable } from "@/components/shared/movements-table"

interface ReportSummary {
  ingresos: number; salidas: number; totalIngresado: number; totalEgresado: number
  ollas: number; beneficiarios: number; entregas: number
}
interface OllaSelect { id: string; name: string }
interface Movement {
  id: string; ollaName: string; supplyItemName: string; unit: string
  movementType: string; quantity: number; movementDate: string; notes: string | null
}

export default function ReportesPage() {
  const { get } = useApi()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [ollas, setOllas] = useState<OllaSelect[]>([])
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [ollaId, setOllaId] = useState("")

  const fetchReport = useCallback(async (f: string, t: string, o: string) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (f) params.from = f; if (t) params.to = t; if (o) params.ollaId = o
      const res = await get<{ ok: boolean; summary: ReportSummary; ollas: OllaSelect[]; movements: Movement[] }>(
        "/api/organizations/reports/summary", Object.keys(params).length > 0 ? params : undefined
      )
      setSummary(res.summary); setOllas(res.ollas); setMovements(res.movements)
    } catch { toast.error("Error al cargar el reporte") }
    finally { setLoading(false) }
  }, [get])

  useEffect(() => { fetchReport(from, to, ollaId) }, []) // eslint-disable-line

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
          <p className="text-sm text-muted-foreground">Historial de movimientos y operaciones</p>
        </div>
        <ExportButtons movements={movements} loading={loading} from={from} to={to} />
      </div>

      <ReportFilters from={from} to={to} ollaId={ollaId} ollas={ollas}
        onFromChange={setFrom} onToChange={setTo} onOllaChange={setOllaId}
        onFilter={() => fetchReport(from, to, ollaId)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ingresos de insumos" value={String(summary?.ingresos ?? 0)} icon={ArrowDownLeft} change="—" trend="up" color="from-green-500/20 to-transparent" loading={loading} />
        <KpiCard label="Salidas de insumos" value={String(summary?.salidas ?? 0)} icon={ArrowUpRight} change="—" trend="down" color="from-red-500/20 to-transparent" loading={loading} />
        <KpiCard label="Beneficiarios activos" value={String(summary?.beneficiarios ?? 0)} icon={Users} change="—" trend="up" color="from-blue-500/20 to-transparent" loading={loading} />
        <KpiCard label="Entregas de raciones" value={String(summary?.entregas ?? 0)} icon={CookingPot} change="—" trend="up" color="from-amber-500/20 to-transparent" loading={loading} />
      </div>

      <MovementsTable movements={movements} loading={loading} />
    </div>
  )
}
