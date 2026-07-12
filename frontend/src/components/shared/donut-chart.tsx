"use client"

import { PieChart, Pie, Sector, ResponsiveContainer, Legend } from "recharts"
import type { PieSectorShapeProps } from "recharts"

interface DonutChartProps {
  data: { name: string; value: number; color: string }[]
  title?: string
}

const renderLabel = ({ percent }: { percent?: number }) => `${((percent ?? 0) * 100).toFixed(0)}%`

function renderShape(props: PieSectorShapeProps) {
  const { payload, ...sectorProps } = props
  return <Sector {...sectorProps} fill={(payload as { color?: string })?.color ?? "#82ca9d"} />
}

function renderLegendValue(value: string) {
  return <span className="text-xs text-foreground">{value}</span>
}

export function DonutChart({ data, title }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Sin datos de inventario
      </div>
    )
  }

  return (
    <div>
      {title && <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
            shape={renderShape}
          />
          <Legend formatter={renderLegendValue} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
