"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { QuickAccessGrid } from "@/components/mobile/quick-access-grid"
import { DailySummary } from "@/components/mobile/daily-summary"
import { ExpiryAlert } from "@/components/mobile/expiry-alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface DashboardData {
  olla: { id: string; name: string; code: string; address: string | null } | null
  summary: {
    planificadas: number
    entregadas: number
    menu: {
      id: string
      dishName: string
      status: string
      maxServingsRemaining?: number
      recipe: {
        name: string
        ingredients: string[]
      } | null
    } | null
  }
  expiring: { nombre: string; cantidad: string; venceEn: string }[]
}

export default function InicioPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { get } = useApi()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await get<DashboardData & { ok: boolean }>("/api/mobile/dashboard")
      setData(result)
    } catch (err) {
      toast.error("Error al cargar el panel")
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const nombreOlla = data?.olla?.name ?? "Olla común"
  const expiringCount = data?.expiring?.length ?? 0
  const planificadas = data?.summary?.planificadas ?? 0
  const entregadas = data?.summary?.entregadas ?? 0
  const pendientes = Math.max(0, planificadas - entregadas)
  const maxServingsRemaining = data?.summary?.menu?.maxServingsRemaining ?? 0
  const stockInsuficiente = maxServingsRemaining < pendientes

  return (
    <div className="space-y-5 p-4 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">¡Hola,</p>
          <h1 className="text-xl font-bold text-foreground">{user?.fullName?.split(" ")[0] ?? "Usuario"}!</h1>
          <p className="text-xs text-muted-foreground">{nombreOlla}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <QuickAccessGrid />
      )}

      {/* Menú de Hoy */}
      {loading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <span>Menú de Hoy 🍲</span>
            </h3>
            {data?.summary?.menu?.status === "executed" ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Ejecutado (Entregas en curso)
              </span>
            ) : data?.summary?.menu?.status === "approved" ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-600/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Menú Activo (Aprobado)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Pendiente
              </span>
            )}
          </div>

          {data?.summary?.menu ? (
            <div className="space-y-3">
              <div>
                <h4 className="text-base font-bold text-foreground">
                  {data.summary.menu.dishName}
                </h4>
                {data.summary.menu.recipe && data.summary.menu.recipe.ingredients.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground/80">Insumos:</span>{" "}
                    {data.summary.menu.recipe.ingredients.join(", ")}
                  </p>
                )}
              </div>

              {/* Raciones disponibles/capacidad */}
              <div className="rounded-lg bg-muted p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Stock de cocina:</span>
                  {stockInsuficiente ? (
                    <span className="font-bold text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded animate-pulse">
                      Stock Insuficiente ⚠️
                    </span>
                  ) : (
                    <span className="font-bold text-xs bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded">
                      Suficiente
                    </span>
                  )}
                </div>
                {stockInsuficiente ? (
                  <p className="text-[11px] text-destructive leading-snug font-medium">
                    ⚠️ ¡Atención! Solo hay insumos para preparar{" "}
                    <span className="font-bold">{maxServingsRemaining}</span> raciones,
                    pero faltan entregar <span className="font-bold">{pendientes}</span> raciones para cubrir el padrón de hoy.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Faltan entregar <span className="font-bold text-foreground">{pendientes}</span> raciones hoy.
                    El almacén cuenta con stock de respaldo (alcanza para hasta <span className="font-semibold text-foreground">{maxServingsRemaining} raciones</span>).
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                ⚠️ Aún no se ha planificado el menú de hoy del almacén.
              </p>
              <Button
                onClick={() => router.push("/mobile/menu-ia")}
                className="w-full bg-status-active text-white hover:bg-status-active/90 flex items-center justify-center gap-1.5 text-sm py-2 font-semibold"
              >
                👉 Planificar Menú de Hoy con IA
              </Button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : (
        <DailySummary
          planificadas={data?.summary?.planificadas ?? 0}
          entregadas={data?.summary?.entregadas ?? 0}
        />
      )}

      {!loading && data?.expiring && data.expiring.length > 0 && (
        <ExpiryAlert items={data.expiring} />
      )}
    </div>
  )
}
