"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { InventoryStepper, type InsumoSeleccionado } from "@/components/mobile/inventory-stepper"
import { Button } from "@/components/ui/button"
import { Package, CheckCircle2, Plus, Minus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"

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
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {mostrarStepper ? (isSalida ? "Registrar Salida" : "Registrar Entrada") : "Inventario"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mostrarStepper ? (isSalida ? "Retirar insumos del almacén" : "Agregar insumos al almacén") : "Gestiona tus insumos"}
          </p>
        </div>
        <Package className="h-6 w-6 text-muted-foreground" />
      </div>

      {mostrarStepper ? (
        <InventoryStepper
          onComplete={handleComplete}
          onCancel={() => setMostrarStepper(false)}
          supplyItems={supplyItems}
          isSalida={isSalida}
        />
      ) : (
        <>
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
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">Stock actual</h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-status-active" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.cantidad} {item.unidad}
                        {item.esPerecedero && " · Perecible"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aún no hay insumos registrados hoy</p>
            </div>
          )}

          <div className="fixed bottom-20 left-1/2 z-40 flex gap-3 w-[calc(100%-2rem)] max-w-[calc(448px-2rem)] -translate-x-1/2">
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
        </>
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
