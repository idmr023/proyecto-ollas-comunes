"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { QuickAccessGrid } from "@/components/mobile/quick-access-grid"
import { DailySummary } from "@/components/mobile/daily-summary"
import { ExpiryAlert } from "@/components/mobile/expiry-alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { toast } from "sonner"

interface DashboardData {
  olla: { id: string; name: string; code: string; address: string | null } | null
  summary: { planificadas: number; entregadas: number }
  expiring: { nombre: string; cantidad: string; venceEn: string }[]
}

export default function InicioPage() {
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

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">¡Hola,</p>
          <h1 className="text-xl font-bold text-foreground">{user?.fullName?.split(" ")[0] ?? "Usuario"}!</h1>
          <p className="text-xs text-muted-foreground">{nombreOlla}</p>
        </div>
        <div className="relative">
          <Bell className="h-6 w-6 text-muted-foreground" />
          {expiringCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {expiringCount}
            </span>
          )}
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
