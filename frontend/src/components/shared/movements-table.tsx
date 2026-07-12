interface Movement {
  id: string
  ollaName: string
  supplyItemName: string
  unit: string
  movementType: string
  quantity: number
  movementDate: string
  notes: string | null
}

interface MovementsTableProps {
  movements: Movement[]
  loading?: boolean
}

function formatDate(iso: string) {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
}

function movementLabel(type: string) {
  switch (type) {
    case "in": return "Ingreso"
    case "out": return "Salida"
    case "adjustment": return "Ajuste"
    case "waste": return "Merma"
    default: return type
  }
}

export function MovementsTable({ movements, loading }: MovementsTableProps) {
  return (
    <div id="report-content">
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">Movimientos de inventario</h3>
          <span className="text-xs text-muted-foreground">
            {loading ? "Cargando..." : `${movements.length} registros`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Fecha</th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Olla</th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Insumo</th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Tipo</th>
                <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Cantidad</th>
                <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Notas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-5 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-32 animate-pulse rounded bg-muted" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></td>
                    <td className="px-5 py-3"><div className="h-4 w-16 animate-pulse rounded bg-muted" /></td>
                    <td className="px-5 py-3 text-right"><div className="ml-auto h-4 w-12 animate-pulse rounded bg-muted" /></td>
                    <td className="hidden px-5 py-3 md:table-cell"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
                  </tr>
                ))
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    No se encontraron movimientos en este rango de fechas.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="border-b border-border transition hover:bg-muted/30">
                    <td className="whitespace-nowrap px-5 py-3 text-foreground">{formatDate(m.movementDate)}</td>
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-foreground">{m.ollaName}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-foreground">{m.supplyItemName}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.movementType === "in" ? "bg-green-50 text-green-700" :
                        m.movementType === "out" ? "bg-red-50 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {movementLabel(m.movementType)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono tabular-nums text-foreground">
                      {m.quantity.toLocaleString("es-PE")} {m.unit}
                    </td>
                    <td className="hidden max-w-[200px] truncate px-5 py-3 text-muted-foreground md:table-cell">
                      {m.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
