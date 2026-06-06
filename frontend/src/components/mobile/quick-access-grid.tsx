"use client"

import Link from "next/link"
import { PackagePlus, PackageMinus, Users, Sparkles } from "lucide-react"

const items = [
  { href: "/mobile/inventario?accion=ingreso", label: "Registrar Ingreso", icon: PackagePlus },
  { href: "/mobile/inventario?accion=salida", label: "Registrar Salida", icon: PackageMinus },
  { href: "/mobile/padron", label: "Padrón", icon: Users },
  { href: "/mobile/menu-ia", label: "Menú IA", icon: Sparkles },
] as const

export function QuickAccessGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm transition active:scale-[0.97]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <span className="text-center text-sm font-medium text-foreground">{label}</span>
        </Link>
      ))}
    </div>
  )
}
