"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { InventoryStepper, type InsumoSeleccionado } from "@/components/mobile/inventory-stepper"
import { Button } from "@/components/ui/button"
import { Package, CheckCircle2, Plus, Minus, ChevronLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"
import { cn } from "@/lib/utils"

interface InventoryItem {
  id: string
  nombre: string
  cantidad: number
  unidad: string
  esPerecedero: boolean
}

interface SupplyItem {
  id: string
  name: string
  unit: string
}

interface CategoryItem {
  id: number
  name: string
  items: SupplyItem[]
}

const INSUMO_EMOJIS: Record<string, string> = {
  arroz: "🍚",
  fideo: "🍝",
  aceite: "🛢️",
  lenteja: "🍲",
  frijol: "🫘",
  frejol: "🫘",
  leche: "🥛",
  azucar: "🍯",
  sal: "🧂",
  harina: "🍞",
  conserva: "🐟",
  atun: "🐟",
  pollo: "🍗",
  carne: "🥩",
  verdura: "🥦",
  papa: "🥔",
  cebolla: "🧅",
  agua: "💧",
  gas: "🔥",
}

function getEmoji(nombre: string): string {
  const norm = nombre.toLowerCase()
  for (const [key, val] of Object.entries(INSUMO_EMOJIS)) {
    if (norm.includes(key)) return val
  }
  return "📦"
}

function InventarioContent() {
  const { get, request } = useApi()
  const searchParams = useSearchParams()
  const accion = searchParams.get("accion")

  const [isSalida, setIsSalida] = useState(accion === "salida")
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([])
  const [mostrarStepper, setMostrarStepper] = useState(false)

  useEffect(() => {
    if (accion === "ingreso" || accion === "salida") {
      setIsSalida(accion === "salida")
      setMostrarStepper(true)
    }
  }, [accion])

  const fetchInventory = useCallback(async () => {
    try {
      const data = await get<{ ok: boolean; items: InventoryItem[]; categories: CategoryItem[] }>("/api/mobile/inventory")
      setItems(data.items ?? [])
      const all = (data.categories ?? []).flatMap((c) => c.items)
      setSupplyItems(all)
    } catch {
      toast.error("Error al cargar inventario")
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => {
    fetchInventory()

    const handleSync = () => {
      console.log('[Inventario Mobile] Sincronización completada. Refrescando inventario...')
      fetchInventory()
    }
    window.addEventListener('pwa-sync-completed', handleSync)
    return () => {
      window.removeEventListener('pwa-sync-completed', handleSync)
    }
  }, [fetchInventory])

  const handleComplete = async (insumo: InsumoSeleccionado) => {
    const match = supplyItems.find(
      (s) => s.name.toLowerCase() === insumo.nombre.toLowerCase(),
    )

    if (!match) {
      toast.error(`Insumo "${insumo.nombre}" no encontrado en el catálogo`)
      return
    }

    try {
      await request("/api/mobile/inventory/movements", {
        method: "POST",
        body: JSON.stringify({
          supplyItemId: match.id,
          movementType: isSalida ? "out" : "in",
          quantity: insumo.kgEquivalente ?? insumo.cantidad,
          notes: insumo.fechaVencimiento ? `Vence: ${insumo.fechaVencimiento}` : (isSalida ? "Salida registrada desde mobile" : undefined),
        }),
      })
      toast.success(`${insumo.nombre} registrado correctamente`)
      setMostrarStepper(false)
      setLoading(true)
      fetchInventory()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-x-0 mx-auto max-w-md top-0 bottom-[56px] z-40 overflow-hidden flex flex-col bg-background p-4 pb-0">
      {/* HEADER: Fijo en la parte superior */}
      <div className="flex-shrink-0 pb-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mostrarStepper && (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground active:scale-95 transition-all cursor-pointer shadow-sm animate-fade-in"
              onClick={() => setMostrarStepper(false)}
            >
              <ChevronLeft className="h-6 w-6 stroke-[3]" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-foreground">
              {mostrarStepper ? (isSalida ? "Registrar Salida" : "Registrar Entrada") : "Inventario"}
            </h1>
            <p className="text-sm text-muted-foreground font-semibold leading-tight mt-0.5">
              {mostrarStepper ? (isSalida ? "Retirar insumos del almacén" : "Agregar insumos al almacén") : "Gestiona tus insumos"}
            </p>
          </div>
        </div>
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>

      {mostrarStepper ? (
        <div className="flex-1 overflow-hidden">
          <InventoryStepper
            onComplete={handleComplete}
            onCancel={() => setMostrarStepper(false)}
            supplyItems={supplyItems}
            isSalida={isSalida}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {/* BODY: Con scroll independiente y padding bottom para evitar que los botones tapen los items */}
          <div className="flex-1 overflow-y-auto py-4 pb-28 space-y-4 pr-1 -mr-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                    <Skeleton className="h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-1 h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 pl-1">👇 Stock actual en almacén:</h2>
                <ul className="space-y-2.5">
                  {items.map((item) => {
                    const emoji = getEmoji(item.nombre)
                    return (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-4.5 shadow-sm active:scale-[0.98] transition-all duration-200"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Large icon/emoji badge on the left */}
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/60 text-2xl shadow-inner border border-border/40">
                            {emoji}
                          </div>
                          {/* Name and labels in the middle */}
                          <div className="min-w-0">
                            <p className="text-base font-black text-foreground tracking-tight truncate leading-tight">
                              {item.nombre}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {item.esPerecedero ? (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200 uppercase tracking-wider">
                                  ⚠️ Perecible
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-700 border border-slate-200 uppercase tracking-wider">
                                  📦 Almacenable
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity display pill on the right */}
                        <div className="shrink-0 flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-2.5 shadow-sm min-w-[85px]">
                          <span className="text-base font-black tracking-tight leading-none text-right">
                            {item.cantidad} <span className="text-[10px] font-black uppercase text-emerald-700/80">{item.unidad}</span>
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Aún no hay insumos registrados hoy</p>
              </div>
            )}
          </div>

          {/* Botones Flotantes: Fijos sobre la lista con un sutil gradiente */}
          <div className="absolute bottom-4 left-0 right-0 z-40 flex gap-3 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-2">
            <Button
              className="flex-1 h-14 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg hover:opacity-90 transition-all duration-200 active:scale-95 gap-1.5 cursor-pointer"
              onClick={() => {
                setIsSalida(false)
                setMostrarStepper(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Registrar Entrada
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-xl border-border bg-card hover:bg-muted text-sm font-bold shadow-lg transition-all duration-200 active:scale-95 text-foreground gap-1.5 cursor-pointer"
              onClick={() => {
                setIsSalida(true)
                setMostrarStepper(true)
              }}
            >
              <Minus className="h-4 w-4" />
              Registrar Salida
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InventarioPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando inventario...</div>}>
      <InventarioContent />
    </Suspense>
  )
}
