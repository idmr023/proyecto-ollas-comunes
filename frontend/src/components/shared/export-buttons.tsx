import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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

interface ExportButtonsProps {
  movements: Movement[]
  loading?: boolean
  from?: string
  to?: string
}

function formatDate(iso: string) {
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

export function ExportButtons({ movements, loading, from, to }: ExportButtonsProps) {
  const exportCsv = () => {
    if (movements.length === 0) { toast.error("No hay datos para exportar"); return }
    const header = "Fecha,Olla,Insumo,Tipo,Cantidad,Unidad,Notas"
    const rows = movements.map(m =>
      `"${formatDate(m.movementDate)}","${m.ollaName}","${m.supplyItemName}","${movementLabel(m.movementType)}",${m.quantity},"${m.unit}","${m.notes ?? ""}"`
    )
    const csv = "\uFEFF" + [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `reporte-${from ?? "todo"}_${to ?? "todo"}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success("Reporte CSV descargado")
  }

  const exportPdf = () => {
    const content = document.getElementById("report-content")
    if (!content) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    const doc = printWindow.document
    doc.open()
    doc.documentElement.innerHTML = `
      <!DOCTYPE html><html><head><title>Reporte SIGO-Ollas</title>
      <style>body{font-family:Arial;padding:30px;color:#333}h1{color:#0F3821}h2{color:#666;font-size:14px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0F3821;color:#fff;padding:8px}td{padding:6px;border-bottom:1px solid #ddd}</style></head>
      <body>${(content.cloneNode(true) as HTMLElement).innerHTML}</body></html>`
    doc.close()
    setTimeout(() => printWindow.print(), 500)
    toast.success("Vista previa de PDF abierta.")
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="h-9 gap-2" onClick={exportCsv} disabled={loading || movements.length === 0}>
        <FileDown className="h-4 w-4" />Exportar CSV
      </Button>
      <Button className="h-9 gap-2 bg-[#0F3821] text-white hover:bg-[#0F3821]/90" onClick={exportPdf} disabled={loading || movements.length === 0}>
        <FileDown className="h-4 w-4" />Exportar PDF
      </Button>
    </div>
  )
}
