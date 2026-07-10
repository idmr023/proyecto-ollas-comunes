"use client"

import { useState } from "react"
import { Search, Minus, Plus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const UNIDADES_MTZ: Record<string, { label: string; aKg: number }> = {
  kilo: { label: "Kilos (kg)", aKg: 1 },
  saco_50: { label: "Sacos (50 kg)", aKg: 50 },
  saco_25: { label: "Sacos (25 kg)", aKg: 25 },
  bolsa_10: { label: "Bolsas (10 kg)", aKg: 10 },
  unidad: { label: "Unidades", aKg: 0 },
  litro: { label: "Litros (L)", aKg: 0 },
}

const INSUMO_EMOJIS: Record<string, string> = {
  arroz: "🍚 Arroz",
  fideo: "🍝 Fideos",
  aceite: "🛢️ Aceite",
  lenteja: "🍲 Lentejas",
  frijol: "🫘 Frijoles",
  leche: "🥛 Leche",
  azucar: "🍯 Azúcar",
  sal: "🧂 Sal",
  harina: "🍞 Harina",
  conserva: "🐟 Conserva",
  atun: "🐟 Atún",
  pollo: "🍗 Pollo",
  carne: "🥩 Carne",
  verdura: "🥦 Verdura",
  papa: "🥔 Papa",
  cebolla: "🧅 Cebolla",
  agua: "💧 Agua",
  gas: "🔥 Gas",
}

function getEmoji(nombre: string): string {
  const norm = nombre.toLowerCase()
  for (const [key, val] of Object.entries(INSUMO_EMOJIS)) {
    if (norm.includes(key)) return val
  }
  return `📦 ${nombre}`
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
  isSalida?: boolean
}

const SUGERENCIAS = [
  "Arroz", "Fideos", "Aceite vegetal", "Lentejas", "Frijoles",
  "Leche en polvo", "Azúcar", "Sal", "Harina", "Conserva de pescado",
]

export function InventoryStepper({ onComplete, onCancel, supplyItems, isSalida }: Props) {
  const [paso, setPaso] = useState(1)
  const [busqueda, setBusqueda] = useState("")
  const [seleccion, setSeleccion] = useState("")
  const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState<string[]>([])
  const [cantidad, setCantidad] = useState(1)
  const [unidad, setUnidad] = useState("kilo")
  const [fechaVenc, setFechaVenc] = useState("")
  const [vencPreset, setVencPreset] = useState("none")
  const [modoTeclado, setModoTeclado] = useState(false)

  const sugerencias = supplyItems ? supplyItems.map((s) => s.name) : SUGERENCIAS
  const insumosComunes = sugerencias.slice(0, 8)

  const handleBusqueda = (v: string) => {
    setBusqueda(v)
    const q = v.toLowerCase()
    setSugerenciasFiltradas(q ? sugerencias.filter((s) => s.toLowerCase().includes(q)) : [])
  }

  const seleccionarInsumoYContinuar = (v: string) => {
    setSeleccion(v)
    setBusqueda("")
    setSugerenciasFiltradas([])
    setCantidad(1)
    setPaso(2)
  }

  const kgEq = convertirAKg(cantidad, unidad)

  const theme = {
    color: "emerald",
    primaryText: "text-emerald-600",
    bgClass: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
    borderClass: "border-emerald-300",
    bgLightClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    shadowClass: "shadow-emerald-100",
    indicatorClass: "bg-emerald-500",
    indicatorCircle: "bg-emerald-100 text-emerald-700",
    buttonBorderSelected: "border-emerald-600 bg-emerald-50/50 text-emerald-700",
    badgeLabel: isSalida ? "🔴 Retirar Insumo (Salida)" : "🟢 Agregar Insumo (Entrada)",
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Indicador de pasos visuales (Fijo en la parte superior del stepper) */}
      <div className="flex-shrink-0 pt-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2 px-1">
          {[1, 2, 3].map((p) => {
            const stepDisabled = isSalida && p === 3
            if (stepDisabled) return null

            const isCurrent = paso === p
            const isDone = paso > p
            const stepNames = ["1. Elegir Producto", "2. Cantidad", "3. Vencimiento"]

            return (
              <div key={p} className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-center w-full gap-2">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition shadow-sm",
                      isCurrent && cn("text-white font-black scale-110", theme.bgClass),
                      isDone && theme.indicatorCircle,
                      !isCurrent && !isDone && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="h-4.5 w-4.5 stroke-[3.5]" /> : p}
                  </div>
                  {p < (isSalida ? 2 : 3) && (
                    <div className={cn("h-1 flex-1 rounded-full", isDone ? theme.indicatorClass : "bg-muted")} />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-black transition-colors text-center w-full truncate",
                  isCurrent ? "text-foreground font-black" : "text-muted-foreground"
                )}>
                  {stepNames[p - 1]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* BODY: Con scroll independiente y padding */}
      <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 -mr-1">

      {paso === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">¿Qué producto vas a registrar?</h2>
            <p className="text-sm font-bold text-muted-foreground">Toca el producto en la lista o escribe para buscarlo.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-14 pl-12 text-lg rounded-2xl border-border/80 focus-visible:ring-primary/20 font-bold placeholder:text-muted-foreground/60"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              autoFocus
            />
          </div>

          {sugerenciasFiltradas.length > 0 && (
            <ul className="rounded-2xl border border-border bg-card shadow-lg divide-y divide-border/40 overflow-hidden max-h-72 overflow-y-auto">
              {sugerenciasFiltradas.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full px-5 py-4.5 text-left text-base font-extrabold transition hover:bg-primary/5 active:bg-primary/10 cursor-pointer text-foreground flex items-center gap-2"
                    onClick={() => seleccionarInsumoYContinuar(s)}
                  >
                    <span className="text-2xl" role="img" aria-label="icono">{getEmoji(s).split(" ")[0]}</span>
                    <span>{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!busqueda && (
            <div className="space-y-4 pt-2">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">👇 Toca uno de los productos comunes para avanzar:</p>
              <div className="grid grid-cols-2 gap-3">
                {insumosComunes.map((insumo) => {
                  const emojiText = getEmoji(insumo)
                  const emoji = emojiText.split(" ")[0]
                  const label = emojiText.substring(emoji.length).trim()

                  return (
                    <button
                      key={insumo}
                      type="button"
                      className="rounded-2xl border-2 border-border bg-card p-5 text-center hover:bg-muted active:scale-[0.96] transition-all cursor-pointer shadow-sm hover:border-primary/50 flex flex-col items-center justify-center gap-2 min-h-[110px]"
                      onClick={() => seleccionarInsumoYContinuar(insumo)}
                    >
                      <span className="text-4xl" role="img" aria-label="emoji">{emoji}</span>
                      <span className="text-base font-extrabold text-foreground tracking-tight leading-tight">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">
              ¿Qué cantidad de <span className={cn("font-black underline", theme.primaryText)}>{seleccion}</span> registrarás?
            </h2>
            <p className="text-sm font-bold text-muted-foreground">Ingresa el número y toca su presentación abajo.</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-5 py-5 bg-muted/40 rounded-3xl border border-border p-5 shadow-inner">
            <div className="flex items-center gap-8">
              <button
                type="button"
                className="flex h-16 w-16 items-center justify-center rounded-full border-3 border-border text-muted-foreground hover:bg-card hover:border-muted-foreground active:scale-90 transition cursor-pointer bg-card shadow-sm"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              >
                <Minus className="h-8 w-8 stroke-[3.5]" />
              </button>

              <div className="flex flex-col items-center min-w-[120px]">
                {modoTeclado ? (
                  <input
                    type="number"
                    className="w-28 text-center text-5xl font-black text-foreground border-b-3 border-primary focus:outline-none bg-transparent"
                    value={cantidad === 0 ? "" : cantidad}
                    onChange={(e) => setCantidad(Math.max(0, Number.parseInt(e.target.value) || 0))}
                    onBlur={() => setModoTeclado(false)}
                    autoFocus
                  />
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Editar cantidad"
                    onClick={() => setModoTeclado(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModoTeclado(true) } }}
                    className="text-6xl font-black text-foreground cursor-pointer hover:text-primary transition-colors active:scale-95 leading-none"
                    title="Toca para ingresar número"
                  >
                    {cantidad}
                  </span>
                )}

                <button
                  type="button"
                  className="mt-2 text-xs font-extrabold text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full hover:text-primary active:scale-95 transition shadow-sm cursor-pointer"
                  onClick={() => setModoTeclado(true)}
                >
                  ✏️ Escribir número
                </button>
              </div>

              <button
                type="button"
                className={cn("flex h-16 w-16 items-center justify-center rounded-full border-3 border-transparent text-white active:scale-90 transition cursor-pointer shadow-md", theme.bgClass)}
                onClick={() => setCantidad((c) => c + 1)}
              >
                <Plus className="h-8 w-8 stroke-[3.5]" />
              </button>
            </div>

            <div className="space-y-2 w-full text-center">
              <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">O agrega volumen rápido:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[5, 10, 25, 50].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className="rounded-xl border-2 border-border bg-card px-4.5 py-2.5 text-sm font-extrabold text-muted-foreground hover:border-primary hover:text-primary active:scale-95 transition cursor-pointer shadow-sm"
                    onClick={() => setCantidad((c) => c + v)}
                  >
                    +{v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground/80">👇 Toca la presentación de este producto:</p>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(UNIDADES_MTZ).map(([key, val]) => {
                const isSelected = unidad === key
                return (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      "rounded-2xl border-2 p-4 text-center text-base font-extrabold transition cursor-pointer active:scale-[0.98] shadow-sm",
                      isSelected
                        ? theme.buttonBorderSelected
                        : "border-border text-muted-foreground bg-card hover:bg-muted/50",
                    )}
                    onClick={() => setUnidad(key)}
                  >
                    {val.label}
                  </button>
                )
              })}
            </div>
          </div>

          {kgEq !== null && (
            <p className="text-center text-sm font-extrabold text-muted-foreground bg-muted/20 py-3 rounded-2xl border-2 border-dashed border-border/80">
              Equivale a un peso neto de: <strong className={cn("text-lg font-black", theme.primaryText)}>{kgEq} kg</strong>
            </p>
          )}

        </div>
      )}

      {paso === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">¿Cuándo vence el producto?</h2>
            <p className="text-sm font-bold text-muted-foreground">Toca una opción de fecha rápida para no usar el calendario.</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {[
              { key: "none", title: "No tiene / No vence 📂", desc: "Productos como sal, fideos secos, azúcar, harina." },
              { key: "1m", title: "Vence pronto (1 mes) ⚠️", desc: "Consumir rápido (los siguientes 30 días)." },
              { key: "3m", title: "Vence luego (3 meses) 🗓️", desc: "Consumir antes de los siguientes 90 días." },
              { key: "custom", title: "Elegir otra fecha... 📅", desc: "Abrir calendario completo del teléfono." },
            ].map((p) => {
              const isSelected = vencPreset === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  className={cn(
                    "rounded-2xl border-2 p-4 text-left transition cursor-pointer shadow-sm active:scale-95 flex flex-col gap-0.5",
                    isSelected
                      ? theme.buttonBorderSelected
                      : "border-border text-foreground bg-card hover:bg-muted/50"
                  )}
                  onClick={() => {
                    setVencPreset(p.key)
                    if (p.key === "none") {
                      setFechaVenc("")
                    } else if (p.key === "1m") {
                      const d = new Date()
                      d.setMonth(d.getMonth() + 1)
                      setFechaVenc(d.toISOString().split("T")[0])
                    } else if (p.key === "3m") {
                      const d = new Date()
                      d.setMonth(d.getMonth() + 3)
                      setFechaVenc(d.toISOString().split("T")[0])
                    }
                  }}
                >
                  <span className="font-extrabold text-base">{p.title}</span>
                  <span className="text-xs text-muted-foreground font-semibold leading-snug">{p.desc}</span>
                </button>
              )
            })}
          </div>

          {vencPreset === "custom" && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-2xl border border-border">
              <label htmlFor="custom-venc" className="text-xs font-black text-muted-foreground/80 block">📅 Toca abajo para ver el calendario:</label>
              <Input
                id="custom-venc"
                type="date"
                className="h-14 text-base font-bold rounded-xl border-border bg-card"
                value={fechaVenc}
                onChange={(e) => setFechaVenc(e.target.value)}
              />
            </div>
          )}

          <div className="rounded-3xl border-2 border-border bg-muted/40 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground pb-2 border-b-2 border-border">👉 Resumen: ¿Todo está correcto?</h3>
            <div className="space-y-3 text-base">
              <div className="flex justify-between items-center pb-2 border-b border-border/20">
                <span className="text-muted-foreground font-semibold">Producto</span>
                <span className="font-black text-foreground text-lg flex items-center gap-1.5">
                  <span className="text-2xl" role="img" aria-label="icono">{getEmoji(seleccion).split(" ")[0]}</span>
                  <span>{seleccion}</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/20">
                <span className="text-muted-foreground font-semibold">Cantidad</span>
                <span className="font-extrabold text-foreground text-base">
                  {cantidad} {UNIDADES_MTZ[unidad]?.label}
                </span>
              </div>
              {kgEq !== null && (
                <div className="flex justify-between items-center pb-2 border-b border-border/20">
                  <span className="text-muted-foreground font-semibold">Peso Total</span>
                  <span className={cn("font-black text-base", theme.primaryText)}>{kgEq} kg</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Vence</span>
                <span className="font-extrabold text-foreground bg-card px-3 py-1.5 rounded-xl border-2 border-border/60 text-sm">
                  {fechaVenc
                    ? new Date(fechaVenc + "T12:00:00").toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                    : "No vence / No tiene 📂"}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
      </div>

      {/* FOOTER: Fijo en la parte inferior */}
      {paso > 1 && (
        <div className="flex-shrink-0 pt-3 pb-2 bg-card border-t border-border/40 flex gap-3">
          <Button variant="outline" className="h-16 flex-1 rounded-xl text-base font-black border-2 cursor-pointer active:scale-95 transition" onClick={() => setPaso(paso - 1)}>
            👈 Atrás
          </Button>
          {paso === 2 ? (
            <Button
              className={cn("h-16 flex-1 text-white rounded-xl text-base font-black shadow-lg active:scale-95 transition gap-1.5 cursor-pointer", theme.bgClass)}
              onClick={() => {
                if (isSalida) {
                  onComplete({
                    nombre: seleccion,
                    cantidad,
                    unidad,
                    kgEquivalente: kgEq,
                    fechaVencimiento: "",
                  })
                } else {
                  setPaso(3)
                }
              }}
            >
              {isSalida ? "Terminar y Guardar ✔️" : "Siguiente Paso ➡️"}
            </Button>
          ) : (
            <Button
              className={cn("h-16 flex-1 text-white rounded-xl text-lg font-black shadow-lg active:scale-95 transition gap-1.5 cursor-pointer", theme.bgClass)}
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
              <Check className="h-6 w-6 stroke-[3.5]" /> Guardar Registro ✔️
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
