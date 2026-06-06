"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, Clock, WifiOff, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface Alerta {
  id: string
  tipo: "vencimiento" | "bajo_stock" | "sincronizacion" | "general"
  titulo: string
  descripcion: string
  fecha: string
}

export default function AlertasPage() {
  const { get } = useApi()
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<Alerta[]>([])

  const fetchAlertas = useCallback(async () => {
    try {
      const data = await get<{ ok: boolean; items: Alerta[] }>("/api/mobile/alerts")
      setAlertas(data.items ?? [])
    } catch (err) {
      toast.error("Error al cargar alertas")
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => {
    fetchAlertas()
  }, [fetchAlertas])

  const icono = (tipo: Alerta["tipo"]) => {
    switch (tipo) {
      case "vencimiento": return Clock
      case "bajo_stock": return Package
      case "sincronizacion": return WifiOff
      default: return AlertTriangle
    }
  }

  const color = (tipo: Alerta["tipo"]) => {
    switch (tipo) {
      case "vencimiento": return "border-highlight bg-highlight/10"
      case "bajo_stock": return "border-destructive bg-destructive/10"
      case "sincronizacion": return "border-status-pending/30 bg-status-pending/10"
      default: return "border-border bg-muted"
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground">{alertas.length} notificaciones</p>
        </div>
        <AlertTriangle className="h-6 w-6 text-highlight-foreground" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
        </div>
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertTriangle className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No hay alertas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((a) => {
            const Icon = icono(a.tipo)
            return (
              <Link
                key={a.id}
                href="/mobile/inventario"
                className={cn("flex items-start gap-3 rounded-xl border p-4 transition active:scale-[0.98]", color(a.tipo))}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">{a.descripcion}</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium uppercase text-muted-foreground">{a.fecha}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
