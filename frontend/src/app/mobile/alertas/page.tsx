"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, Clock, WifiOff, Package, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"
import { getFailedMutations, deleteFailedMutation } from "@/lib/indexed-db"

interface Alerta {
  id: string
  tipo: "vencimiento" | "bajo_stock" | "sincronizacion" | "general"
  titulo: string
  descripcion: string
  fecha: string
  isLocalConflict?: boolean
  localId?: number
  originalPath?: string
}

export default function AlertasPage() {
  const { get } = useApi()
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<Alerta[]>([])

  const fetchAlertas = useCallback(async () => {
    try {
      let serverAlertas: Alerta[] = []
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine

      if (!isOffline) {
        const data = await get<{ ok: boolean; items: any[] }>("/api/mobile/alerts")
        serverAlertas = (data.items ?? []).map((a) => ({
          id: a.id,
          tipo: a.tipo,
          titulo: a.titulo,
          descripcion: a.descripcion,
          fecha: a.fecha,
        }))
      }

      // Obtener las mutaciones fallidas locales de IndexedDB
      const localFailed = await getFailedMutations()
      const mappedLocal: Alerta[] = localFailed.map((fm) => {
        const isBeneficiary = fm.path.startsWith("/api/beneficiaries")
        const isDelivery = fm.path.startsWith("/api/mobile/deliveries")
        const isMenu = fm.path.startsWith("/api/mobile/menu-plans")
        const isInventory = fm.path.startsWith("/api/mobile/inventory")

        let label = "Operación fallida"
        let details = ""
        if (isBeneficiary && fm.body) {
          label = `Error al registrar beneficiario: ${fm.body.firstName || ""} ${fm.body.lastName || ""}`.trim()
          details = `Beneficiario (DNI: ${fm.body.dni})`
        } else if (isDelivery && fm.body) {
          label = `Error al registrar ración: ${fm.body.dishName || "Almuerzo"}`
          details = `Entrega (${fm.body.beneficiaryIds?.length || 0} personas)`
        } else if (isMenu && fm.body) {
          label = `Error al planificar menú: ${fm.body.dishName || ""}`
          details = `Menú (${fm.body.servings || 0} raciones)`
        } else if (isInventory && fm.body) {
          label = `Error en movimiento de almacén`
          details = `Insumo ID: ${fm.body.supplyItemId || ""}`
        }

        return {
          id: `local-failed-${fm.id}`,
          tipo: "sincronizacion" as const,
          titulo: label,
          descripcion: `${details ? details + " — " : ""}Conflicto de sincronización: ${fm.errorMessage}`,
          fecha: "Error local",
          isLocalConflict: true,
          localId: fm.id,
          originalPath: fm.path,
        }
      })

      setAlertas([...mappedLocal, ...serverAlertas])
    } catch (err) {
      // Si estamos offline y falla, mostramos al menos las fallas locales
      const localFailed = await getFailedMutations()
      const mappedLocal: Alerta[] = localFailed.map((fm) => ({
        id: `local-failed-${fm.id}`,
        tipo: "sincronizacion" as const,
        titulo: "Conflicto local de sincronización",
        descripcion: fm.errorMessage,
        fecha: "Error local",
        isLocalConflict: true,
        localId: fm.id,
        originalPath: fm.path,
      }))
      setAlertas(mappedLocal)

      if (typeof navigator !== "undefined" && navigator.onLine) {
        toast.error("Error al cargar alertas")
      }
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => {
    fetchAlertas()

    window.addEventListener("online", fetchAlertas)
    window.addEventListener("offline", fetchAlertas)
    window.addEventListener("pwa-sync-completed", fetchAlertas)
    window.addEventListener("offline-failed-mutations-updated", fetchAlertas)

    return () => {
      window.removeEventListener("online", fetchAlertas)
      window.removeEventListener("offline", fetchAlertas)
      window.removeEventListener("pwa-sync-completed", fetchAlertas)
      window.removeEventListener("offline-failed-mutations-updated", fetchAlertas)
    }
  }, [fetchAlertas])

  const icono = (tipo: Alerta["tipo"]) => {
    switch (tipo) {
      case "vencimiento":
        return Clock
      case "bajo_stock":
        return Package
      case "sincronizacion":
        return WifiOff
      default:
        return AlertTriangle
    }
  }

  const color = (tipo: Alerta["tipo"]) => {
    switch (tipo) {
      case "vencimiento":
        return "border-highlight bg-highlight/10 text-highlight-foreground"
      case "bajo_stock":
        return "border-destructive bg-destructive/10 text-destructive"
      case "sincronizacion":
        return "border-status-pending/30 bg-status-pending/10 text-status-pending"
      default:
        return "border-border bg-muted text-muted-foreground"
    }
  }

  const getAlertHref = (a: Alerta) => {
    if (a.isLocalConflict && a.originalPath) {
      if (a.originalPath.startsWith("/api/beneficiaries")) {
        return "/mobile/padron"
      }
      if (a.originalPath.startsWith("/api/mobile/inventory")) {
        return "/mobile/inventario"
      }
    }
    const normMsg = (a.descripcion + " " + a.titulo).toLowerCase()
    if (
      a.tipo === "sincronizacion" ||
      normMsg.includes("beneficiario") ||
      normMsg.includes("padrón") ||
      normMsg.includes("dni")
    ) {
      return "/mobile/padron"
    }
    return "/mobile/inventario"
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground">
            {alertas.length} {alertas.length === 1 ? "notificación" : "notificaciones"}
            {typeof navigator !== "undefined" && !navigator.onLine && " (Modo offline)"}
          </p>
        </div>
        <AlertTriangle className="h-6 w-6 text-highlight-foreground" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
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
              <div
                key={a.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl border p-4 transition active:scale-[0.99]",
                  color(a.tipo)
                )}
              >
                <Link href={getAlertHref(a)} className="flex flex-1 items-start gap-3 min-w-0">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground tracking-tight leading-tight">{a.titulo}</p>
                      {a.isLocalConflict && (
                        <span className="inline-flex items-center rounded-full bg-destructive/25 px-2 py-0.5 text-[9px] font-bold text-destructive-foreground uppercase tracking-wide">
                          Conflict local
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{a.descripcion}</p>
                  </div>
                </Link>

                <div className="flex flex-col items-end justify-between self-stretch shrink-0 min-h-[40px] pl-1">
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">{a.fecha}</span>
                  {a.isLocalConflict && a.localId !== undefined && (
                    <button
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        await deleteFailedMutation(a.localId!)
                        toast.success("Conflicto descartado")
                        fetchAlertas()
                      }}
                      className="text-muted-foreground hover:text-destructive active:scale-90 transition-transform p-1 cursor-pointer"
                      title="Descartar conflicto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
