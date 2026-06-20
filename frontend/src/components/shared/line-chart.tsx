"use client"

import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface LineChartProps {
  data: { month: string; count: number }[]
  title?: string
}

export function LineChart({ data, title }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Sin datos de evolución
      </div>
    )
  }

  return (
    <div>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">Mensual</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <ReLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.004 80)" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="oklch(0.55 0.02 40)" />
          <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.55 0.02 40)" />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="oklch(0.55 0.14 160)" strokeWidth={2.5} dot={{ r: 4, fill: "oklch(0.55 0.14 160)", strokeWidth: 2, stroke: "#fff" }} />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  )
}
