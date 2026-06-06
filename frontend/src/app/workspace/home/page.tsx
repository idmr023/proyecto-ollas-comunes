"use client"

import { useState } from "react"
import {
  Building2,
  CookingPot,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const kpis = [
  { label: "Organizaciones", value: "24", icon: Building2, change: "+12%", trend: "up", color: "from-[#0F3821]/20 to-transparent" },
  { label: "Ollas comunes", value: "48", icon: CookingPot, change: "+8%", trend: "up", color: "from-emerald-500/20 to-transparent" },
  { label: "Beneficiarios", value: "1,240", icon: Users, change: "+23%", trend: "up", color: "from-blue-500/20 to-transparent" },
  { label: "Insumos", value: "86", icon: Package, change: "-5%", trend: "down", color: "from-amber-500/20 to-transparent" },
]

const actividades = [
  { icon: CheckCircle2, color: "text-status-active", text: "Nueva donación registrada — 50 kg de arroz", time: "Hace 5 min" },
  { icon: AlertTriangle, color: "text-highlight-foreground", text: "Alerta de stock bajo: Aceite vegetal (2 L)", time: "Hace 1 h" },
  { icon: UserPlus, color: "text-blue-500", text: "Beneficiario registrado: María García", time: "Hace 2 h" },
  { icon: Clock, color: "text-purple-500", text: "Inventario actualizado por OC San Juan", time: "Hace 4 h" },
]

const insumosVencer = [
  { nombre: "Arroz", org: "Olla Virgen de la Candelaria", vence: "Mañana", stock: "25 kg", urgente: true },
  { nombre: "Leche en polvo", org: "Comedor Los Olivos", vence: "En 3 días", stock: "10 kg", urgente: false },
  { nombre: "Aceite vegetal", org: "Olla Villa María", vence: "En 5 días", stock: "15 L", urgente: false },
]

const DonutChart = () => (
  <div className="flex items-center gap-6">
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.92 0.004 80)" strokeWidth="3" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.55 0.14 160)" strokeWidth="3" strokeDasharray="60 100" strokeDashoffset="0" strokeLinecap="round" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.78 0.14 75)" strokeWidth="3" strokeDasharray="25 100" strokeDashoffset="-60" strokeLinecap="round" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.52 0.16 27)" strokeWidth="3" strokeDasharray="15 100" strokeDashoffset="-85" strokeLinecap="round" />
      </svg>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-active" /><span>Stock adecuado</span><span className="ml-auto font-semibold">60%</span></div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-status-pending" /><span>Stock bajo</span><span className="ml-auto font-semibold">25%</span></div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive" /><span>Stock crítico</span><span className="ml-auto font-semibold">15%</span></div>
    </div>
  </div>
)

const LineChart = () => (
  <svg viewBox="0 0 300 120" className="h-28 w-full">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="oklch(0.55 0.14 160)" stopOpacity="0.3" />
        <stop offset="100%" stopColor="oklch(0.55 0.14 160)" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M0 100 Q25 90 50 95 Q75 80 100 70 Q125 50 150 55 Q175 35 200 40 Q225 20 250 30 Q275 15 300 20 L300 120 L0 120Z" fill="url(#grad)" />
    <path d="M0 100 Q25 90 50 95 Q75 80 100 70 Q125 50 150 55 Q175 35 200 40 Q225 20 250 30 Q275 15 300 20" fill="none" stroke="oklch(0.55 0.14 160)" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="280" cy="22" r="4" fill="oklch(0.55 0.14 160)" stroke="white" strokeWidth="2" />
  </svg>
)

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">¡Bienvenido!</h1>
          <p className="text-sm text-muted-foreground">Resumen general del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Últimos 30 días</span>
          </div>
          <Button className="h-9 gap-2 bg-[#0F3821] text-white hover:bg-[#0F3821]/90">
            <Download className="h-4 w-4" />
            Exportar reporte
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", k.color)}>
                <k.icon className="h-5 w-5 text-[#0F3821]" />
              </div>
            </div>
            <p className="mb-1 text-3xl font-bold text-foreground">{k.value}</p>
            <div className={`flex items-center gap-1 text-xs font-medium ${k.trend === "up" ? "text-status-active" : "text-destructive"}`}>
              {k.trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {k.change} vs mes anterior
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Donut - Resumen de inventario */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Resumen de inventario</h3>
          <DonutChart />
        </div>

        {/* Line - Evolución de beneficiarios */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Evolución de beneficiarios</h3>
            <span className="text-xs text-muted-foreground">Mensual</span>
          </div>
          <LineChart />
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Insumos a vencer */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Insumos a vencer</h3>
          <div className="space-y-3">
            {insumosVencer.map((item) => (
              <div key={item.nombre} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                  {item.nombre[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.nombre}</p>
                  <p className="text-xs text-muted-foreground">{item.org}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-xs font-semibold", item.urgente ? "text-destructive" : "text-muted-foreground")}>
                    {item.urgente ? "⚠ " : ""}{item.vence}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actividades recientes */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Actividades recientes</h3>
          <div className="space-y-0">
            {actividades.map((act, i) => (
              <div key={i} className="flex gap-3 border-l-2 border-border pb-4 pl-4 last:pb-0">
                <div className={`-ml-[21px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-card`}>
                  <act.icon className={`h-3.5 w-3.5 ${act.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{act.text}</p>
                  <p className="text-xs text-muted-foreground">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
