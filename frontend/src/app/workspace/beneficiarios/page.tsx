'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/shared/modal'
import { BeneficiaryForm } from '@/components/shared/beneficiary-form'
import { PageShell } from '@/components/workspace/page-shell'
import { Skeleton } from '@/components/ui/skeleton'
import type { Beneficiary, HealthCondition } from '@/types/beneficiary'
import {
  createBeneficiary,
  deleteBeneficiary,
  getHealthConditions,
  getOllasComunes,
  listBeneficiaries,
  updateBeneficiary,
} from '@/lib/beneficiaries-api'
import { z } from 'zod'

const beneficiarySchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio.'),
  lastName: z.string().trim().min(1, 'Los apellidos son obligatorios.'),
  birthDate: z.string().trim().min(1, 'La fecha de nacimiento es obligatoria.'),
  dni: z.string().trim().min(1, 'El DNI es obligatorio.').max(20, 'El DNI no puede exceder 20 caracteres.'),
  ollaId: z.string().trim().min(1, 'La olla común es obligatoria.'),
})

type PriorityStyle = { label: string; className: string }

const PRIORITY_MAP: Record<string, PriorityStyle> = {
  low: { label: 'Bajo', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  normal: { label: 'Normal', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  high: { label: 'Alto', className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function BeneficiariosPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([])
  const [ollas, setOllas] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOllaId, setFilterOllaId] = useState('')
  const [filterHealthConditionId, setFilterHealthConditionId] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null)
  const [formVersion, setFormVersion] = useState(0)
  const [saving, setSaving] = useState(false)

  // Confirm delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [beneficiariesData, conditionsData, ollasData] = await Promise.all([
        listBeneficiaries({
          query: debouncedQuery || undefined,
          ollaId: filterOllaId || undefined,
          healthConditionId: filterHealthConditionId || undefined,
        }),
        getHealthConditions(),
        getOllasComunes(),
      ])
      setBeneficiaries(beneficiariesData)
      setHealthConditions(conditionsData)
      setOllas(ollasData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar beneficiarios.')
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, filterOllaId, filterHealthConditionId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function openCreateModal() {
    setEditingBeneficiary(null)
    setFormVersion((v) => v + 1)
    setModalOpen(true)
  }

  function openEditModal(beneficiary: Beneficiary) {
    setEditingBeneficiary(beneficiary)
    setFormVersion((v) => v + 1)
    setModalOpen(true)
  }

  async function handleFormSubmit(data: {
    firstName: string
    lastName: string
    dni: string
    birthDate: string
    gender: string
    priorityLevel: string
    phone: string
    address: string
    ollaId: string
    healthConditionIds: number[]
  }) {
    const result = beneficiarySchema.safeParse({
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      dni: data.dni,
      ollaId: data.ollaId,
    })

    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message)
      toast.error(messages.join(' '))
      return
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      dni: data.dni,
      birthDate: data.birthDate,
      gender: data.gender,
      priorityLevel: data.priorityLevel,
      phone: data.phone,
      address: data.address,
      ollaId: data.ollaId,
      healthConditionIds: data.healthConditionIds,
      status: editingBeneficiary?.status ?? 'active',
    }

    setSaving(true)
    try {
      if (editingBeneficiary) {
        await updateBeneficiary(editingBeneficiary.id, payload)
        toast.success('Beneficiario actualizado correctamente.')
      } else {
        await createBeneficiary(payload)
        toast.success('Beneficiario registrado correctamente.')
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar beneficiario.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteBeneficiary(id)
      toast.success('Beneficiario eliminado correctamente.')
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar beneficiario.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageShell title="Beneficiarios" description="Padrón y seguimiento de beneficiarios." width="wide">
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="DNI, nombres o apellidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:max-w-[180px]">
            <Label htmlFor="filter-olla">Olla Común</Label>
            <select
              id="filter-olla"
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={filterOllaId}
              onChange={(e) => setFilterOllaId(e.target.value)}
            >
              <option value="">Todas</option>
              {ollas.map((olla) => (
                <option key={olla.id} value={olla.id}>{olla.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:max-w-[200px]">
            <Label htmlFor="filter-condition">Condición de Salud</Label>
            <select
              id="filter-condition"
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={filterHealthConditionId}
              onChange={(e) => setFilterHealthConditionId(e.target.value)}
            >
              <option value="">Todas</option>
              {healthConditions.map((hc) => (
                <option key={hc.id} value={String(hc.id)}>{hc.name}</option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={openCreateModal} className="shrink-0">
          + Registrar Beneficiario
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && beneficiaries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No se encontraron beneficiarios.</p>
            <Button variant="outline" className="mt-4" onClick={openCreateModal}>
              Registrar primer beneficiario
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table */}
      {!loading && !error && beneficiaries.length > 0 && (
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium">Nombre Completo</th>
                  <th className="px-4 py-3 font-medium">Edad</th>
                  <th className="px-4 py-3 font-medium">Olla Asignada</th>
                  <th className="px-4 py-3 font-medium">Prioridad</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Condiciones</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map((b) => {
                  const priority = PRIORITY_MAP[b.priorityLevel] ?? PRIORITY_MAP.normal
                  const age = calculateAge(b.birthDate)
                  return (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{b.dni ?? '—'}</td>
                      <td className="px-4 py-3 font-medium">{b.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{age} años</td>
                      <td className="px-4 py-3">{b.olla?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${priority.className}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          b.status === 'active'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {b.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(b.healthConditions ?? []).length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {(b.healthConditions ?? []).slice(0, 3).map((hc) => (
                            <span key={hc.id} className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {hc.name}
                            </span>
                          ))}
                          {(b.healthConditions ?? []).length > 3 && (
                            <span className="text-xs text-muted-foreground">+{(b.healthConditions ?? []).length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(b)}>
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={deletingId === b.id}
                            onClick={() => handleDelete(b.id)}
                          >
                            {deletingId === b.id ? '...' : 'Eliminar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      {!loading && !error && beneficiaries.length > 0 && (
        <div className="grid gap-3 md:hidden">
          {beneficiaries.map((b) => {
            const priority = PRIORITY_MAP[b.priorityLevel] ?? PRIORITY_MAP.normal
            const age = calculateAge(b.birthDate)
            return (
              <Card key={b.id} className="transition-shadow hover:shadow-md">
                <CardContent className="py-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-medium">{b.fullName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{b.dni ?? 'Sin DNI'}</p>
                    </div>
                    <div className="flex gap-1">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${priority.className}`}>
                        {priority.label}
                      </span>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        b.status === 'active'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {b.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>Edad: {age} años</span>
                    <span>Olla: {b.olla?.name ?? '—'}</span>
                  </div>
                  {(b.healthConditions ?? []).length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {(b.healthConditions ?? []).map((hc) => (
                        <span key={hc.id} className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {hc.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(b)}>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      disabled={deletingId === b.id}
                      onClick={() => handleDelete(b.id)}
                    >
                      {deletingId === b.id ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBeneficiary ? 'Editar Beneficiario' : 'Registrar Beneficiario'}
        maxWidth="max-w-2xl"
      >
        <BeneficiaryForm
          key={formVersion}
          mode={editingBeneficiary ? 'edit' : 'create'}
          initialData={
            editingBeneficiary
              ? {
                  firstName: editingBeneficiary.firstName,
                  lastName: editingBeneficiary.lastName,
                  dni: editingBeneficiary.dni ?? '',
                  birthDate: editingBeneficiary.birthDate.slice(0, 10),
                  gender: editingBeneficiary.gender,
                  priorityLevel: editingBeneficiary.priorityLevel,
                  phone: editingBeneficiary.phone ?? '',
                  address: editingBeneficiary.address ?? '',
                  ollaId: editingBeneficiary.ollaId ?? '',
                  healthConditionIds: (editingBeneficiary.healthConditions ?? []).map((hc) => hc.id),
                }
              : undefined
          }
          ollas={ollas}
          healthConditions={healthConditions}
          onSubmit={handleFormSubmit}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </PageShell>
  )
}
