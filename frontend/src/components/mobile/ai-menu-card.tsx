"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AiMenuCardProps {
  nombre: string
  puntaje: number
  ingredientes: string[]
  onUsar: () => void
}

export function AiMenuCard({ nombre, puntaje, ingredientes, onUsar }: AiMenuCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 bg-primary p-4 text-primary-foreground">
        <Sparkles className="h-6 w-6" />
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">Sugerencia del día</p>
          <h3 className="text-lg font-bold leading-tight">{nombre}</h3>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black">{puntaje}</span>
          <span className="text-[10px] font-medium uppercase opacity-80">Puntaje</span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insumos a utilizar</p>
        <ul className="space-y-2">
          {ingredientes.map((ing) => (
            <li key={ing} className="flex items-center gap-2 text-sm text-foreground">
              <span className="h-2 w-2 rounded-full bg-status-active" />
              {ing}
            </li>
          ))}
        </ul>
        <Button
          onClick={onUsar}
          className="mt-2 h-12 w-full bg-primary text-primary-foreground hover:opacity-90 text-base"
        >
          Usar este menú y descontar stock
        </Button>
      </div>
    </div>
  )
}
