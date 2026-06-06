"use client"

import { UserRound, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Beneficiary {
  id: string
  nombre: string
  apellido: string
  dni: string
  prioridad?: string[]
}

const BADGE_STYLES: Record<string, string> = {
  Anemia: "bg-destructive/10 text-destructive border-destructive/20",
  Gestante: "bg-accent/10 text-accent-foreground border-accent/20",
  "Adulto Mayor": "bg-primary/10 text-primary border-primary/20",
  Niño: "bg-status-pending/20 text-status-pending border-status-pending/20",
  Discapacidad: "bg-muted text-muted-foreground border-border",
}

interface Props {
  beneficiary: Beneficiary
  onClick?: () => void
}

export function BeneficiaryCard({ beneficiary, onClick }: Props) {
  const badges = beneficiary.prioridad ?? []
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition active:scale-[0.98]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <UserRound className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {beneficiary.nombre} {beneficiary.apellido}
        </p>
        <p className="text-xs text-muted-foreground">DNI {beneficiary.dni}</p>
        {badges.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className={cn(
                  "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-tight",
                  BADGE_STYLES[b] ?? "bg-muted text-muted-foreground border-border",
                )}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  )
}
