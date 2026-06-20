import { cn } from "@/lib/utils"

interface LowStockItem {
  name: string
  ollaName: string
  stock: string
  isCritical: boolean
}

interface LowStockTableProps {
  items: LowStockItem[]
  loading?: boolean
}

export function LowStockTable({ items, loading }: LowStockTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Insumos críticos y bajo stock</h3>
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : !items || items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No hay insumos críticos.</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                {item.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.ollaName}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-xs font-semibold", item.isCritical ? "text-destructive" : "text-amber-500")}>
                  {item.isCritical ? "⚠ Sin stock" : "Bajo stock"}
                </p>
                <p className="text-xs text-muted-foreground">{item.stock}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
