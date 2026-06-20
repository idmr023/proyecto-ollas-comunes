'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageShell } from '@/components/workspace/page-shell'
import { Button } from '@/components/ui/button'
import { getTenantAlerts, updateTenantAlert, TenantAlertRecord } from '@/lib/organizations-api'
import { Bell, AlertTriangle, CheckCircle, XCircle, Clock, Building } from 'lucide-react'
import { RefreshButton } from '@/components/shared/refresh-button'
import { toast } from 'sonner'
import { SegmentedTabs } from '@/components/shared/segmented-tabs'
import { SearchInput } from '@/components/shared/search-input'
import { SelectField } from '@/components/shared/select-field'
import { Badge } from '@/components/shared/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'

const SEVERITY_BADGE: Record<string, "danger" | "warning" | "info" | "neutral"> = {
  critical: "danger", high: "danger", medium: "warning", low: "info",
}

function severityLabel(s: string) { return s === 'critical' ? 'Crítica' : s === 'high' ? 'Alta' : s === 'medium' ? 'Media' : 'Baja' }

export default function AlertasPage() {
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<TenantAlertRecord[]>([])
  const [search, setSearch] = useState('')
  const [filterOlla, setFilterOlla] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterStatus, setFilterStatus] = useState('open')

  const loadAlerts = async () => { setLoading(true); try { setAlerts(await getTenantAlerts()) } catch { toast.error('Error al cargar alertas') } finally { setLoading(false) } }
  useEffect(() => { loadAlerts() }, [])

  const handleUpdateStatus = async (id: string, nextStatus: 'resolved' | 'dismissed') => {
    setActionLoadingId(id); try { const u = await updateTenantAlert(id, nextStatus); if (u) setAlerts(prev => prev.map(a => a.id === id ? u : a)); toast.success(`Alerta ${nextStatus === 'resolved' ? 'resuelta' : 'descartada'}`) } catch { toast.error('No se pudo actualizar') } finally { setActionLoadingId(null) }
  }

  const uniqueOllas = useMemo(() => {
    const s = new Set<string>(); alerts.forEach(a => { if (a.ollaName && a.ollaName !== 'Sistema') s.add(a.ollaName) }); return Array.from(s).sort()
  }, [alerts])

  const filteredAlerts = useMemo(() => alerts.filter(a => {
    const ms = a.message.toLowerCase().includes(search.toLowerCase()) || a.ollaName.toLowerCase().includes(search.toLowerCase()) || a.alertType.toLowerCase().includes(search.toLowerCase())
    return ms && (!filterOlla || a.ollaName === filterOlla) && (!filterSeverity || a.severity === filterSeverity) && (!filterStatus || a.status === filterStatus)
  }), [alerts, search, filterOlla, filterSeverity, filterStatus])

  return (
    <PageShell title="Bandeja de Alertas e Incidencias" description="Supervisa y gestiona conflictos, reportes de bajo stock y alertas del sistema." width="wide">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <SegmentedTabs
            tabs={[{ id: 'open', label: 'Abiertas', icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> }, { id: 'resolved', label: 'Resueltas', icon: <CheckCircle className="h-4 w-4 text-green-500" /> }, { id: 'dismissed', label: 'Descartadas', icon: <XCircle className="h-4 w-4 text-muted-foreground" /> }]}
            activeTab={filterStatus} onChange={setFilterStatus} />
          <RefreshButton onClick={loadAlerts} loading={loading} label="Actualizar Alertas" />
        </div>

        <Card className="border-primary/5 shadow-sm bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-end">
            <SearchInput placeholder="Buscar por mensaje, olla común..." value={search} onChange={setSearch} />
            <SelectField label="Olla Común" value={filterOlla} onChange={setFilterOlla} placeholder="Todas las ollas" options={[...(filterOlla ? [] : [{ value: 'Sistema', label: 'Sistema (General)' }]), ...uniqueOllas.map(o => ({ value: o, label: o }))]} className="w-full md:w-56" />
            <SelectField label="Severidad" value={filterSeverity} onChange={setFilterSeverity} placeholder="Todas las severidades" options={[{ value: 'critical', label: 'Crítica' }, { value: 'high', label: 'Alta' }, { value: 'medium', label: 'Media' }, { value: 'low', label: 'Baja' }]} className="w-full md:w-48" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? <LoadingSkeleton height="h-32" /> : filteredAlerts.length === 0 ? (
            <Card className="border-primary/5 shadow-sm"><CardContent className="flex flex-col items-center justify-center py-12"><EmptyState icon={Bell} title={filterStatus === 'open' ? 'No hay alertas abiertas.' : filterStatus === 'resolved' ? 'No hay alertas resueltas.' : 'No hay alertas descartadas.'} description="Todo está al día o puedes cambiar los filtros." /></CardContent></Card>
          ) : filteredAlerts.map(a => (
            <Card key={a.id} className={`border border-primary/5 transition-all shadow-sm rounded-2xl hover:shadow-md ${a.status === 'open' && (a.severity === 'critical' || a.severity === 'high') ? (a.severity === 'critical' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-orange-500') : ''}`}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{a.alertType === 'sync_conflict' ? 'Conflicto Sincro 🔄' : a.alertType === 'new_beneficiary' ? 'Nuevo Beneficiario 👤' : a.alertType === 'low_stock' ? 'Stock Crítico 🛒' : a.alertType}</span>
                    <Badge variant={SEVERITY_BADGE[a.severity] ?? 'neutral'}>{severityLabel(a.severity)}</Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 mt-1"><Building className="h-4 w-4 text-muted-foreground/60" />{a.ollaName}</CardTitle>
                </div>
                <div className="text-xs text-muted-foreground/80 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(a.detectedAt).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-foreground/90 leading-6">{a.message}</p>
                {a.status === 'resolved' && a.resolvedAt && <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 p-2 rounded-xl w-fit"><CheckCircle className="h-4 w-4" />Resuelta el {new Date(a.resolvedAt).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>}
                {a.status === 'dismissed' && <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-muted px-2.5 py-1 rounded-xl w-fit"><XCircle className="h-4 w-4" />Alerta Descartada</div>}
                {a.status === 'open' && <div className="mt-4 flex flex-wrap gap-2 border-t pt-3.5">
                  <Button size="sm" onClick={() => handleUpdateStatus(a.id, 'resolved')} disabled={actionLoadingId !== null} className="rounded-xl bg-green-600 hover:bg-green-700 text-white gap-1.5"><CheckCircle className="h-4 w-4" />Marcar como Resuelta</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(a.id, 'dismissed')} disabled={actionLoadingId !== null} className="rounded-xl border hover:bg-muted gap-1.5"><XCircle className="h-4 w-4" />Descartar Alerta</Button>
                </div>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
