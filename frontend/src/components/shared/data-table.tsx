interface DataTableProps<T> {
  columns: { key: string; header: string; className?: string }[]
  rows: T[]
  renderCell: (row: T, columnKey: string) => React.ReactNode
  emptyMessage?: string
  variant?: "default" | "compact"
}

export function DataTable<T extends { id: string }>({ columns, rows, renderCell, emptyMessage = "No se encontraron registros.", variant = "default" }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="relative overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm text-foreground">
        <thead className={variant === "compact" ? "bg-muted/50 text-xs font-medium text-muted-foreground border-b" : "bg-muted/70 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b"}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className ?? "px-6 py-3.5"}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-muted/20">
              {columns.map((col) => (
                <td key={col.key} className={col.className ?? "px-6 py-4"}>
                  {renderCell(row, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
