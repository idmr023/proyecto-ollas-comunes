'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageShell } from '@/components/workspace/page-shell'
import { Skeleton } from '@/components/ui/skeleton'
import type { Beneficiary, BeneficiaryFormValues, HealthCondition } from '@/types/beneficiary'
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

const GENDER_OPTIONS = [
  { value: 'not_specified', label: 'No especificado' },
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
]

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function emptyForm(): BeneficiaryFormValues {
  return {
    firstName: '',
    lastName: '',
    dni: '',
    gender: 'not_specified',
    birthDate: '',
    phone: '',
    address: '',
    ollaId: '',
    priorityLevel: 'normal',
    status: 'active',
    healthConditionIds: [],
  }
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BeneficiaryFormValues>(emptyForm())
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
    setEditingId(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEditModal(beneficiary: Beneficiary) {
    setEditingId(beneficiary.id)
    setForm({
      firstName: beneficiary.firstName,
      lastName: beneficiary.lastName,
      dni: beneficiary.dni ?? '',
      gender: beneficiary.gender,
      birthDate: beneficiary.birthDate.slice(0, 10),
      phone: beneficiary.phone ?? '',
      address: beneficiary.address ?? '',
      ollaId: beneficiary.ollaId ?? '',
      priorityLevel: beneficiary.priorityLevel,
      status: beneficiary.status,
      healthConditionIds: (beneficiary.healthConditions ?? []).map((hc) => hc.id),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const result = beneficiarySchema.safeParse({
      firstName: form.firstName,
      lastName: form.lastName,
      birthDate: form.birthDate,
      dni: form.dni ?? '',
      ollaId: form.ollaId ?? '',
    })

    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message)
      toast.error(messages.join(' '))
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateBeneficiary(editingId, form)
        toast.success('Beneficiario actualizado correctamente.')
      } else {
        await createBeneficiary(form)
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

  function updateFormField<K extends keyof BeneficiaryFormValues>(
    key: K,
    value: BeneficiaryFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleHealthCondition(conditionId: number) {
    setForm((prev) => {
      const ids = prev.healthConditionIds ?? []
      if (ids.includes(conditionId)) {
        return { ...prev, healthConditionIds: ids.filter((id) => id !== conditionId) }
      }
      return { ...prev, healthConditionIds: [...ids, conditionId] }
    })
  }

  const selectedOllaName = useMemo(() => {
    if (!form.ollaId) return ''
    return ollas.find((o) => o.id === form.ollaId)?.name ?? ''
  }, [form.ollaId, ollas])

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
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
          <div className="fixed inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative z-50 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-950">
            <h2 className="mb-4 text-lg font-semibold">
              {editingId ? 'Editar Beneficiario' : 'Registrar Beneficiario'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Nombres *</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => updateFormField('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => updateFormField('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    maxLength={20}
                    value={form.dni ?? ''}
                    onChange={(e) => updateFormField('dni', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => updateFormField('birthDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gender">Género</Label>
                  <select
                    id="gender"
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={form.gender}
                    onChange={(e) => updateFormField('gender', e.target.value)}
                  >
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="priorityLevel">Prioridad</Label>
                  <select
                    id="priorityLevel"
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={form.priorityLevel}
                    onChange={(e) => updateFormField('priorityLevel', e.target.value)}
                  >
                    <option value="low">Bajo</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phone ?? ''}
                  onChange={(e) => updateFormField('phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={form.address ?? ''}
                  onChange={(e) => updateFormField('address', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="ollaId">Olla Común *</Label>
                <select
                  id="ollaId"
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={form.ollaId ?? ''}
                  onChange={(e) => updateFormField('ollaId', e.target.value)}
                >
                  <option value="">-- Seleccionar olla --</option>
                  {ollas.map((olla) => (
                    <option key={olla.id} value={olla.id}>{olla.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Condiciones de Salud</Label>
                <div className="mt-1 grid grid-cols-2 gap-2 rounded-lg border p-3">
                  {healthConditions.length === 0 && (
                    <p className="col-span-2 text-xs text-muted-foreground">No hay condiciones disponibles.</p>
                  )}
                  {healthConditions.map((hc) => {
                    const checked = (form.healthConditionIds ?? []).includes(hc.id)
                    return (
                      <label key={hc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={checked}
                          onChange={() => toggleHealthCondition(hc.id)}
                        />
                        {hc.name}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Registrar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
