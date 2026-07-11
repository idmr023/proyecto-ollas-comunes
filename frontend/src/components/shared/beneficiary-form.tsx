"use client"

import { useState } from "react"
import { SelectField } from "@/components/shared/select-field"

interface OllaOption { id: string; name: string }
interface HealthCondition { id: number; name: string }

interface BeneficiaryFormProps {
  mode: "create" | "edit"
  initialData?: {
    firstName?: string; lastName?: string; dni?: string
    birthDate?: string; gender?: string; priorityLevel?: string
    phone?: string; address?: string; ollaId?: string
    healthConditionIds?: number[]
  }
  ollas: OllaOption[]
  healthConditions: HealthCondition[]
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

const GENDERS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
  { value: "not_specified", label: "No especificado" },
]

const PRIORITIES = [
  { value: "low", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Alta" },
]

export function BeneficiaryForm({ mode, initialData, ollas, healthConditions, onSubmit, onCancel, loading }: BeneficiaryFormProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName ?? "")
  const [lastName, setLastName] = useState(initialData?.lastName ?? "")
  const [dni, setDni] = useState(initialData?.dni ?? "")
  const [birthDate, setBirthDate] = useState(initialData?.birthDate ?? "")
  const [gender, setGender] = useState(initialData?.gender ?? "not_specified")
  const [priorityLevel, setPriorityLevel] = useState(initialData?.priorityLevel ?? "normal")
  const [phone, setPhone] = useState(initialData?.phone ?? "")
  const [address, setAddress] = useState(initialData?.address ?? "")
  const [ollaId, setOllaId] = useState(initialData?.ollaId ?? ollas[0]?.id ?? "")
  const [healthIds, setHealthIds] = useState<number[]>(initialData?.healthConditionIds ?? [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ firstName, lastName, dni, birthDate, gender, priorityLevel, phone, address, ollaId, healthConditionIds: healthIds })
  }

  const toggleHealthCondition = (id: number) => {
    setHealthIds(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Datos Personales</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="beneficiary-firstName" className="text-xs font-medium text-muted-foreground">Nombre</label>
            <input id="beneficiary-firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm" placeholder="Nombre" required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="beneficiary-lastName" className="text-xs font-medium text-muted-foreground">Apellido</label>
            <input id="beneficiary-lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm" placeholder="Apellido" required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="beneficiary-dni" className="text-xs font-medium text-muted-foreground">DNI</label>
            <input id="beneficiary-dni" value={dni} onChange={e => setDni(e.target.value)} className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm" placeholder="00000000" required />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="beneficiary-birthDate" className="text-xs font-medium text-muted-foreground">Fecha de Nacimiento</label>
            <input id="beneficiary-birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm" required />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Olla y Prioridad</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField label="Olla Común" value={ollaId} onChange={setOllaId}
            options={ollas.map(o => ({ value: o.id, label: o.name }))} selectClassName="h-10" />
          <SelectField label="Prioridad" value={priorityLevel} onChange={setPriorityLevel} options={PRIORITIES} selectClassName="h-10" />
          <SelectField label="Género" value={gender} onChange={setGender} options={GENDERS} selectClassName="h-10" />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Contacto</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="beneficiary-phone" className="text-xs font-medium text-muted-foreground">Teléfono</label>
            <input id="beneficiary-phone" value={phone} onChange={e => setPhone(e.target.value)} className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm" placeholder="987654321" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="beneficiary-address" className="text-xs font-medium text-muted-foreground">Dirección</label>
            <input id="beneficiary-address" value={address} onChange={e => setAddress(e.target.value)} className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm" placeholder="Av. Ejemplo 123" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Condiciones de Salud</h4>
        <div className="flex flex-wrap gap-2">
          {healthConditions.map((hc) => (
            <button key={hc.id} type="button"
              onClick={() => toggleHealthCondition(hc.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                healthIds.includes(hc.id)
                  ? "bg-[#0F3821] text-white border-[#0F3821]"
                  : "bg-muted text-muted-foreground border-border hover:border-[#0F3821]/30"
              }`}
            >
              {hc.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 rounded-xl bg-[#0F3821] py-2.5 text-sm font-semibold text-white hover:bg-[#0F3821]/90 disabled:opacity-50 transition">
          {loading ? "Guardando..." : mode === "create" ? "Registrar" : "Actualizar"}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition">
          Cancelar
        </button>
      </div>
    </form>
  )
}
