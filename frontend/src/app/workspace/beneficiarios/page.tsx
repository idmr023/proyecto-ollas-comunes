'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorCard } from '@/components/shared/error-card'
import { PageShell } from '@/components/workspace/page-shell'
import type { Beneficiary, HealthCondition } from '@/types/beneficiary'
import { createBeneficiary, deleteBeneficiary, getHealthConditions, getOllasComunes, listBeneficiaries, updateBeneficiary } from '@/lib/beneficiaries-api'
import { beneficiarySchema } from '@/lib/validations/beneficiary'
import { z } from 'zod'
import { SearchInput } from '@/components/shared/search-input'
import { SelectField } from '@/components/shared/select-field'
import { Badge } from '@/components/shared/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { Modal } from '@/components/shared/modal'
import { BeneficiaryForm } from '@/components/shared/beneficiary-form'

const PRIORITY_VARIANTS: Record<string, "neutral" | "warning" | "danger"> = { low: "neutral", normal: "warning", high: "danger" }
const PRIORITY_LABELS: Record<string, string> = { low: "Bajo", normal: "Normal", high: "Alto" }

function calculateAge(birthDate: string): number { const b = new Date(birthDate); const t = new Date(); let a = t.getFullYear() - b.getFullYear(); const m = t.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--; return a }

export default function BeneficiariosPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([])
  const [ollas, setOllas] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOllaId, setFilterOllaId] = useState('')
  const [filterHealthConditionId, setFilterHealthConditionId] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Beneficiary | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { const t = setTimeout(() => setDebouncedQuery(searchQuery), 300); return () => clearTimeout(t) }, [searchQuery])

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try { const [b, c, o] = await Promise.all([listBeneficiaries({ query: debouncedQuery || undefined, ollaId: filterOllaId || undefined, healthConditionId: filterHealthConditionId || undefined }), getHealthConditions(), getOllasComunes()]); setBeneficiaries(b); setHealthConditions(c); setOllas(o) }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setLoading(false) }
  }, [debouncedQuery, filterOllaId, filterHealthConditionId])

  useEffect(() => { fetchData() }, [fetchData])

  function openCreateModal() { setEditingId(null); setEditingData(null); setModalOpen(true) }
  function openEditModal(b: Beneficiary) { setEditingId(b.id); setEditingData(b); setModalOpen(true) }

  async function handleSubmit(data: any) {
    const r = beneficiarySchema.safeParse(data)
    if (!r.success) { toast.error(r.error.issues.map(e => e.message).join(' ')); return }
    setSaving(true)
    try {
      if (editingId) { await updateBeneficiary(editingId, data); toast.success('Beneficiario actualizado.') }
      else { await createBeneficiary(data); toast.success('Beneficiario registrado.') }
      setModalOpen(false); fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) { setDeletingId(id); try { await deleteBeneficiary(id); toast.success('Beneficiario eliminado.'); fetchData() } catch (err) { toast.error(err instanceof Error ? err.message : 'Error') } finally { setDeletingId(null) } }

  const getInitialData = () => {
    if (!editingData) return undefined
    return { firstName: editingData.firstName, lastName: editingData.lastName, dni: editingData.dni ?? '', birthDate: editingData.birthDate.slice(0, 10), gender: editingData.gender, priorityLevel: editingData.priorityLevel, phone: editingData.phone ?? '', address: editingData.address ?? '', ollaId: editingData.ollaId ?? '', healthConditionIds: (editingData.healthConditions ?? []).map(hc => hc.id) }
  }

  return (
    <PageShell title="Beneficiarios" description="Padrón y seguimiento de beneficiarios." width="wide">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <SearchInput placeholder="DNI, nombres o apellidos..." value={searchQuery} onChange={setSearchQuery} />
          <SelectField label="Olla Común" value={filterOllaId} onChange={setFilterOllaId} placeholder="Todas" options={ollas.map(o => ({ value: o.id, label: o.name }))} className="w-full sm:max-w-[200px]" />
          <SelectField label="Condición de Salud" value={filterHealthConditionId} onChange={setFilterHealthConditionId} placeholder="Todas" options={healthConditions.map(hc => ({ value: String(hc.id), label: hc.name }))} className="w-full sm:max-w-[200px]" />
        </div>
        <Button onClick={openCreateModal} className="shrink-0 bg-[#0F3821] text-white hover:bg-[#0F3821]/90">+ Registrar Beneficiario</Button>
      </div>

      {error && <ErrorCard message={error} onRetry={fetchData} />}

      {loading && <LoadingSkeleton count={5} height="h-12" />}
      {!loading && !error && beneficiaries.length === 0 && <EmptyState title="No se encontraron beneficiarios." description="Intente cambiando los filtros o registre uno nuevo." action={{ label: 'Registrar primer beneficiario', onClick: openCreateModal }} />}

      {!loading && !error && beneficiaries.length > 0 && (
        <div className="hidden md:block"><div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/50 text-left text-muted-foreground"><th className="px-4 py-3 font-medium">DNI</th><th className="px-4 py-3 font-medium">Nombre Completo</th><th className="px-4 py-3 font-medium">Edad</th><th className="px-4 py-3 font-medium">Olla</th><th className="px-4 py-3 font-medium">Prioridad</th><th className="px-4 py-3 font-medium">Estado</th><th className="px-4 py-3 font-medium">Condiciones</th><th className="px-4 py-3 font-medium text-right">Acciones</th></tr></thead><tbody>
          {beneficiaries.map(b => {
            const age = calculateAge(b.birthDate)
            return (<tr key={b.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-4 py-3 font-mono text-xs">{b.dni ?? '—'}</td><td className="px-4 py-3 font-medium">{b.fullName}</td><td className="px-4 py-3 text-muted-foreground">{age} años</td><td className="px-4 py-3">{b.olla?.name ?? '—'}</td><td className="px-4 py-3"><Badge variant={PRIORITY_VARIANTS[b.priorityLevel] ?? 'neutral'}>{PRIORITY_LABELS[b.priorityLevel] ?? b.priorityLevel}</Badge></td><td className="px-4 py-3"><Badge variant={b.status === 'active' ? 'success' : 'neutral'}>{b.status === 'active' ? 'Activo' : 'Inactivo'}</Badge></td><td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(b.healthConditions ?? []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}{(b.healthConditions ?? []).slice(0, 3).map(hc => <Badge key={hc.id} variant="info">{hc.name}</Badge>)}</div></td><td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openEditModal(b)}>Editar</Button><Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={deletingId === b.id} onClick={() => handleDelete(b.id)}>{deletingId === b.id ? '...' : 'Eliminar'}</Button></div></td></tr>)
          })}
        </tbody></table></div></div>
      )}

      {!loading && !error && beneficiaries.length > 0 && (
        <div className="grid gap-3 md:hidden">
          {beneficiaries.map(b => {
            const age = calculateAge(b.birthDate)
            return (<Card key={b.id} className="transition-shadow hover:shadow-md"><CardContent className="py-4"><div className="mb-2 flex items-start justify-between"><div><p className="font-medium">{b.fullName}</p><p className="text-xs text-muted-foreground font-mono">{b.dni ?? 'Sin DNI'}</p></div><div className="flex gap-1"><Badge variant={PRIORITY_VARIANTS[b.priorityLevel] ?? 'neutral'}>{PRIORITY_LABELS[b.priorityLevel] ?? b.priorityLevel}</Badge><Badge variant={b.status === 'active' ? 'success' : 'neutral'}>{b.status === 'active' ? 'Activo' : 'Inactivo'}</Badge></div></div><div className="mb-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground"><span>Edad: {age} años</span><span>Olla: {b.olla?.name ?? '—'}</span></div>{(b.healthConditions ?? []).length > 0 && <div className="mb-3 flex flex-wrap gap-1">{(b.healthConditions ?? []).map(hc => <Badge key={hc.id} variant="info">{hc.name}</Badge>)}</div>}<div className="flex gap-2"><Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(b)}>Editar</Button><Button variant="outline" size="sm" className="flex-1 text-red-600 border-red-200" disabled={deletingId === b.id} onClick={() => handleDelete(b.id)}>{deletingId === b.id ? 'Eliminando...' : 'Eliminar'}</Button></div></CardContent></Card>)
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Beneficiario' : 'Registrar Beneficiario'}>
        <BeneficiaryForm mode={editingId ? 'edit' : 'create'} initialData={getInitialData()} ollas={ollas} healthConditions={healthConditions} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} loading={saving} />
      </Modal>
    </PageShell>
  )
}
