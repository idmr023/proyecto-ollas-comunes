"use client"

import { useState } from "react"
import { Search, Minus, Plus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const UNIDADES_MTZ: Record<string, { label: string; aKg: number }> = {
  kilo: { label: "Kilogramo (kg)", aKg: 1 },
  saco_50: { label: "Saco (50 kg)", aKg: 50 },
  saco_25: { label: "Saco (25 kg)", aKg: 25 },
  bolsa_10: { label: "Bolsa (10 kg)", aKg: 10 },
  unidad: { label: "Unidad", aKg: 0 },
  litro: { label: "Litro (L)", aKg: 0 },
}

function convertirAKg(cantidad: number, unidad: string): number | null {
  const u = UNIDADES_MTZ[unidad]
  if (!u || u.aKg === 0) return null
  return cantidad * u.aKg
}

export interface InsumoSeleccionado {
  nombre: string
  cantidad: number
  unidad: string
  kgEquivalente: number | null
  fechaVencimiento: string
}

interface Props {
  onComplete: (insumo: InsumoSeleccionado) => void
  onCancel?: () => void
  supplyItems?: { id: string; name: string; unit: string }[]
}

const SUGERENCIAS = [
  "Arroz", "Fideos", "Aceite vegetal", "Lentejas", "Frijoles",
  "Leche en polvo", "Azúcar", "Sal", "Harina", "Conserva de pescado",
]

export function InventoryStepper({ onComplete, onCancel, supplyItems }: Props) {
  const [paso, setPaso] = useState(1)
  const [busqueda, setBusqueda] = useState("")
  const [seleccion, setSeleccion] = useState("")
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<string[]>([])
  const [cantidad, setCantidad] = useState(0)
  const [unidad, setUnidad] = useState("kilo")
  const [fechaVenc, setFechaVenc] = useState("")

  const sugerencias = supplyItems ? supplyItems.map((s) => s.name) : SUGERENCIAS

  const handleBusqueda = (v: string) => {
    setBusqueda(v)
    const q = v.toLowerCase()
    setSugerenciasFiltradas(q ? sugerencias.filter((s) => s.toLowerCase().includes(q)) : [])
  }

  const seleccionar = (v: string) => {
    setSeleccion(v)
    setBusqueda(v)
    setSugerenciasFiltradas([])
  }

  const ajustarCantidad = (delta: number) => {
    setCantidad((c) => Math.max(0, c + delta))
  }

  const kgEq = convertirAKg(cantidad, unidad)

  return (
    <div className="space-y-5">
      {onCancel && (
        <button
          type="button"
          className="text-sm text-muted-foreground underline"
          onClick={onCancel}
        >
          Cancelar
        </button>
      )}

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((p) => (
          <div key={p} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition",
                paso === p && "bg-primary text-primary-foreground",
                paso > p && "bg-status-active/20 text-status-active",
                paso < p && "bg-muted text-muted-foreground",
              )}
            >
              {paso > p ? <Check className="h-4 w-4" /> : p}
            </div>
            {p < 3 && <div className={cn("h-0.5 flex-1", paso > p ? "bg-status-active" : "bg-border")} />}
          </div>
        ))}
      </div>

      {paso === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">¿Qué insumo registras?</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 pl-10 text-base"
              placeholder="Buscar insumo…"
              value={busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              autoFocus
            />
          </div>
          {sugerenciasFiltradas.length > 0 && (
            <ul className="rounded-xl border border-border bg-card shadow-sm">
              {sugerenciasFiltradas.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm transition hover:bg-primary/5 active:bg-primary/10"
                    onClick={() => seleccionar(s)}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {seleccion && (
            <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
              <span className="font-semibold text-primary">{seleccion}</span>
              <Button size="sm" className="h-9 bg-primary text-primary-foreground hover:opacity-90" onClick={() => { setPaso(2); setCantidad(1) }}>
                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">¿Cuánto {seleccion.toLowerCase()}?</h2>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border text-muted-foreground transition active:scale-90"
              onClick={() => ajustarCantidad(-1)}
            >
              <Minus className="h-6 w-6" />
            </button>
            <span className="min-w-[80px] text-center text-4xl font-bold text-foreground">{cantidad}</span>
            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary text-primary transition active:scale-90"
              onClick={() => ajustarCantidad(1)}
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(UNIDADES_MTZ).map(([key, val]) => (
              <button
                key={key}
                type="button"
                className={cn(
                  "rounded-xl border-2 px-2 py-3 text-center text-sm transition active:scale-95",
                  unidad === key
                    ? "border-primary bg-primary/10 font-semibold text-primary"
                    : "border-border text-muted-foreground",
                )}
                onClick={() => setUnidad(key)}
              >
                {val.label}
              </button>
            ))}
          </div>
          {kgEq !== null && (
            <p className="text-center text-sm text-muted-foreground">
              Equivale a <strong className="text-foreground">{kgEq} kg</strong>
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 flex-1" onClick={() => setPaso(1)}>
              <ChevronLeft className="mr-1 h-5 w-5" /> Atrás
            </Button>
            <Button className="h-12 flex-1 bg-primary text-primary-foreground hover:opacity-90" onClick={() => setPaso(3)}>
              Siguiente <ChevronRight className="mr-1 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Fecha de vencimiento</h2>
          <Input
            type="date"
            className="h-12 text-base"
            value={fechaVenc}
            onChange={(e) => setFechaVenc(e.target.value)}
          />
          <div className="rounded-xl bg-muted p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Resumen</h3>
            <div className="space-y-1 text-sm">
              <p className="flex justify-between"><span className="text-muted-foreground">Insumo</span><span className="font-medium text-foreground">{seleccion}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">Cantidad</span><span className="font-medium text-foreground">{cantidad} {UNIDADES_MTZ[unidad]?.label}</span></p>
              {kgEq !== null && <p className="flex justify-between"><span className="text-muted-foreground">Equivale a</span><span className="font-medium text-foreground">{kgEq} kg</span></p>}
              <p className="flex justify-between"><span className="text-muted-foreground">Vence</span><span className="font-medium text-foreground">{fechaVenc || "Sin fecha"}</span></p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 flex-1" onClick={() => setPaso(2)}>
              <ChevronLeft className="mr-1 h-5 w-5" /> Atrás
            </Button>
            <Button
              className="h-12 flex-1 bg-primary text-primary-foreground hover:opacity-90 text-base"
              onClick={() =>
                onComplete({
                  nombre: seleccion,
                  cantidad,
                  unidad,
                  kgEquivalente: kgEq,
                  fechaVencimiento: fechaVenc,
                })
              }
            >
              <Check className="mr-2 h-5 w-5" /> Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
