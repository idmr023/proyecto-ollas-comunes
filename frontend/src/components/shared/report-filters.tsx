import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OllaSelect {
  id: string
  name: string
}

interface ReportFiltersProps {
  from: string
  to: string
  ollaId: string
  ollas: OllaSelect[]
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  onOllaChange: (v: string) => void
  onFilter: () => void
}

export function ReportFilters({ from, to, ollaId, ollas, onFromChange, onToChange, onOllaChange, onFilter }: ReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="report-from" className="text-xs font-medium text-muted-foreground">Desde</label>
        <input id="report-from" type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="report-to" className="text-xs font-medium text-muted-foreground">Hasta</label>
        <input id="report-to" type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="report-olla" className="text-xs font-medium text-muted-foreground">Olla común</label>
        <select id="report-olla" value={ollaId} onChange={(e) => onOllaChange(e.target.value)} className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm">
          <option value="">Todas</option>
          {ollas.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <Button variant="outline" className="h-9 gap-2" onClick={onFilter}>
        <Filter className="h-4 w-4" />
        Filtrar
      </Button>
    </div>
  )
}
