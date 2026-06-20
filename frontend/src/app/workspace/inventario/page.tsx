'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageShell } from '@/components/workspace/page-shell'
import { Button } from '@/components/ui/button'
import { getTenantInventoryStock, getTenantInventoryMovements, TenantStockRecord, TenantMovementRecord } from '@/lib/organizations-api'
import { Boxes, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { RefreshButton } from '@/components/shared/refresh-button'
import { toast } from 'sonner'
import { SegmentedTabs } from '@/components/shared/segmented-tabs'
import { SearchInput } from '@/components/shared/search-input'
import { SelectField } from '@/components/shared/select-field'
import { Badge } from '@/components/shared/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock')
  const [loading, setLoading] = useState(true)
  const [stocks, setStocks] = useState<TenantStockRecord[]>([])
  const [movements, setMovements] = useState<TenantMovementRecord[]>([])
  const [search, setSearch] = useState('')
  const [filterOlla, setFilterOlla] = useState('')
  const [filterMovementType, setFilterMovementType] = useState('')

  const loadData = async () => { setLoading(true); try { const [s, m] = await Promise.all([getTenantInventoryStock(), getTenantInventoryMovements()]); setStocks(s); setMovements(m) } catch { toast.error('Error al cargar inventario') } finally { setLoading(false) } }
  useEffect(() => { loadData() }, [])

  const uniqueOllas = useMemo(() => { const n = new Set<string>(); stocks.forEach(s => n.add(s.ollaName)); movements.forEach(m => n.add(m.ollaName)); return Array.from(n).sort() }, [stocks, movements])

  const filteredStocks = useMemo(() => stocks.filter(s => (s.supplyItemName.toLowerCase().includes(search.toLowerCase()) || s.ollaName.toLowerCase().includes(search.toLowerCase()) || s.categoryName.toLowerCase().includes(search.toLowerCase())) && (!filterOlla || s.ollaName === filterOlla)), [stocks, search, filterOlla])

  const filteredMovements = useMemo(() => movements.filter(m => (m.supplyItemName.toLowerCase().includes(search.toLowerCase()) || m.ollaName.toLowerCase().includes(search.toLowerCase()) || (m.notes && m.notes.toLowerCase().includes(search.toLowerCase())) || (m.sourceName && m.sourceName.toLowerCase().includes(search.toLowerCase()))) && (!filterOlla || m.ollaName === filterOlla) && (!filterMovementType || m.movementType === filterMovementType)), [movements, search, filterOlla, filterMovementType])

  const movementBadgeVariant = (t: string) => t === 'in' ? 'success' : t === 'out' ? 'danger' : t === 'adjustment' ? 'info' : t === 'waste' ? 'warning' : 'neutral'
  const movementBadgeLabel = (t: string) => t === 'in' ? 'Ingreso' : t === 'out' ? 'Salida' : t === 'adjustment' ? 'Ajuste' : t === 'waste' ? 'Merma' : t

  return (
    <PageShell title="Monitoreo de Inventario" description="Consolidado de almacén y registro histórico de movimientos de todas las ollas comunes." width="wide">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <SegmentedTabs
            tabs={[{ id: 'stock', label: 'Stock por Olla', icon: <Boxes className="h-4 w-4" /> }, { id: 'movements', label: 'Kardex (Movimientos)', icon: <History className="h-4 w-4" /> }]}
            activeTab={activeTab} onChange={(id) => setActiveTab(id as 'stock' | 'movements')} />
          <RefreshButton onClick={loadData} loading={loading} label="Actualizar datos" />
        </div>

        <Card className="border-primary/5 shadow-sm bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-end">
            <SearchInput placeholder="Buscar por insumo, olla común..." value={search} onChange={setSearch} />
            <SelectField label="Filtrar por Olla" value={filterOlla} onChange={setFilterOlla} placeholder="Todas las ollas" options={uniqueOllas.map(o => ({ value: o, label: o }))} className="w-full md:w-56" />
            {activeTab === 'movements' && <SelectField label="Tipo de Movimiento" value={filterMovementType} onChange={setFilterMovementType} placeholder="Todos" options={[{ value: 'in', label: 'Ingresos (Entradas)' }, { value: 'out', label: 'Egresos (Salidas)' }, { value: 'adjustment', label: 'Ajustes' }, { value: 'waste', label: 'Mermas/Pérdidas' }]} className="w-full md:w-48" />}
          </CardContent>
        </Card>

        {activeTab === 'stock' && (
          <Card className="border-primary/5 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-lg font-bold">Resumen de Inventarios</CardTitle><CardDescription>Insumos disponibles por cada olla común registrada.</CardDescription></CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton /> : filteredStocks.length === 0 ? <EmptyState icon={Boxes} title="No se encontraron insumos." description="Intente cambiando el término de búsqueda o filtros." /> : (
                <div className="relative overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-sm text-foreground">
                    <thead className="bg-muted/70 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b"><tr><th className="px-6 py-3.5">Olla Común</th><th className="px-6 py-3.5">Insumo</th><th className="px-6 py-3.5">Categoría</th><th className="px-6 py-3.5 text-right">Cantidad</th><th className="px-6 py-3.5 text-center">Estado</th></tr></thead>
                    <tbody className="divide-y">
                      {filteredStocks.map((s, idx) => {
                        const isCritical = s.quantity > 0 && s.quantity < 5
                        const isOut = s.quantity <= 0
                        return (<tr key={`${s.ollaId}-${s.supplyItemId}-${idx}`} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium">{s.ollaName}</td><td className="px-6 py-4">{s.supplyItemName}</td>
                          <td className="px-6 py-4"><Badge variant="neutral">{s.categoryName}</Badge></td>
                          <td className="px-6 py-4 text-right font-bold">{s.quantity} {s.unit}</td>
                          <td className="px-6 py-4 text-center">{isOut ? <Badge variant="danger">Sin Stock</Badge> : isCritical ? <Badge variant="warning">Bajo Stock ⚠️</Badge> : <Badge variant="success">Suficiente</Badge>}</td>
                        </tr>)
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'movements' && (
          <Card className="border-primary/5 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-lg font-bold">Kardex de Auditoría</CardTitle><CardDescription>Registro histórico detallado de ingresos y egresos de almacén.</CardDescription></CardHeader>
            <CardContent>
              {loading ? <LoadingSkeleton /> : filteredMovements.length === 0 ? <EmptyState icon={History} title="No se registraron movimientos." description="Intente cambiando el término de búsqueda o filtros." /> : (
                <div className="relative overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-sm text-foreground">
                    <thead className="bg-muted/70 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b"><tr><th className="px-6 py-3.5">Fecha</th><th className="px-6 py-3.5">Olla Común</th><th className="px-6 py-3.5">Insumo</th><th className="px-6 py-3.5 text-center">Tipo</th><th className="px-6 py-3.5 text-right">Cantidad</th><th className="px-6 py-3.5">Detalle / Origen</th><th className="px-6 py-3.5">Registrado por</th></tr></thead>
                    <tbody className="divide-y">
                      {filteredMovements.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{new Date(m.movementDate).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-4 font-medium">{m.ollaName}</td><td className="px-6 py-4">{m.supplyItemName}</td>
                          <td className="px-6 py-4 text-center"><Badge variant={movementBadgeVariant(m.movementType)}>{movementBadgeLabel(m.movementType)}</Badge></td>
                          <td className="px-6 py-4 text-right font-bold">{m.quantity} {m.unit}</td>
                          <td className="px-6 py-4 text-xs">{m.notes ? <span className="text-foreground/80">{m.notes}</span> : <span className="text-muted-foreground/60 italic">—</span>}{m.sourceName && <div className="text-[10px] text-muted-foreground font-semibold">Origen: {m.sourceName}</div>}</td>
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{m.createdByName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  )
}
