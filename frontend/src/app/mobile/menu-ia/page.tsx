"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AiMenuCard } from "@/components/mobile/ai-menu-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"

interface Suggestion {
  id: string
  nombre: string
  puntaje: number
  ingredientes: string[]
}

export default function MenuIaPage() {
  const router = useRouter()
  const { get, request } = useApi()
  const [loading, setLoading] = useState(false)
  const [sugerencia, setSugerencia] = useState<Suggestion | null>(null)

  const fetchSuggestion = useCallback(async () => {
    setLoading(true)
    try {
      const data = await get<{ ok: boolean; items: Suggestion[] }>("/api/mobile/suggestions")
      if (data.items && data.items.length > 0) {
        setSugerencia(data.items[0])
      } else {
        toast.error("No hay suficientes insumos para sugerir un menú")
      }
    } catch (err) {
      toast.error("Error al generar sugerencia")
    } finally {
      setLoading(false)
    }
  }, [get])

  const usarMenu = async () => {
    if (!sugerencia) return
    setLoading(true)
    try {
      await request("/api/mobile/menu-plans/execute", {
        method: "POST",
        body: JSON.stringify({
          recipeId: undefined,
          dishName: sugerencia.nombre,
          servings: 100,
        }),
      })
      toast.success(`Menú "${sugerencia.nombre}" aplicado y stock descontado.`)
      setSugerencia(null)
      router.push("/mobile/inventario")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aplicar el menú")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Menú IA</h1>
          <p className="text-sm text-muted-foreground">Optimiza tus menús usando insumos próximos a vencer</p>
        </div>
        <Sparkles className="h-6 w-6 text-primary" />
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : sugerencia ? (
        <AiMenuCard
          nombre={sugerencia.nombre}
          puntaje={sugerencia.puntaje}
          ingredientes={sugerencia.ingredientes}
          onUsar={usarMenu}
        />
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <Sparkles className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Presiona &quot;Nueva sugerencia&quot; para generar un menú inteligente</p>
        </div>
      )}

      <Button
        variant="outline"
        className="flex h-12 w-full items-center gap-2"
        onClick={fetchSuggestion}
        disabled={loading}
      >
        <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        Nueva sugerencia
      </Button>

      <div className="rounded-xl border border-border bg-muted p-4">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">¿Cómo funciona?</h3>
        <p className="text-sm leading-relaxed text-foreground/80">
          El motor IA analiza los insumos próximos a vencer en tu inventario y sugiere recetas
          con alto puntaje nutricional para reducir el desperdicio.
        </p>
      </div>
    </div>
  )
}
