"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface ExpiringItem {
  nombre: string
  cantidad: string
  venceEn: string
}

interface ExpiryAlertProps {
  items: ExpiringItem[]
}

export function ExpiryAlert({ items }: ExpiryAlertProps) {
  if (!items.length) return null
  return (
    <div className="rounded-xl border border-highlight bg-highlight/10 p-4">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-highlight-foreground" />
        <h3 className="text-sm font-semibold text-highlight-foreground">Insumos por vencer</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.nombre} className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{item.nombre}</span>
            <div className="text-right">
              <span className="block text-muted-foreground">{item.cantidad}</span>
              <span className="block text-xs font-semibold text-highlight-foreground">Vence {item.venceEn}</span>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/mobile/inventario"
        className="mt-3 block text-center text-sm font-medium text-highlight-foreground underline"
      >
        Ir a inventario
      </Link>
    </div>
  )
}
