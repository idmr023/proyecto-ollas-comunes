"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BeneficiaryCard } from "@/components/mobile/beneficiary-card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"
import { Label } from "@/components/ui/label"

interface Beneficiary {
  id: string
  nombre: string
  apellido: string
  dni: string
  prioridad?: string[]
}

interface BeneficiaryRecord {
  id: string
  firstName: string
  lastName: string
  dni: string | null
  healthConditions: { id: number; name: string }[]
}

interface HealthCondition {
  id: number
  name: string
}

interface OllaOption {
  id: string
  name: string
}

export default function PadronPage() {
  const { get, request } = useApi()
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [beneficiarios, setBeneficiarios] = useState<Beneficiary[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([])
  const [ollas, setOllas] = useState<OllaOption[]>([])

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    birthDate: "",
    gender: "not_specified",
    phone: "",
    address: "",
    ollaId: "",
    priorityLevel: "normal",
    healthConditionIds: [] as number[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchBeneficiaries = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (busqueda.trim()) params.query = busqueda.trim()
      const data = await get<{ ok: boolean; items: BeneficiaryRecord[] }>("/api/beneficiaries", params)
      setBeneficiarios(
        data.items.map((b) => ({
          id: b.id,
          nombre: b.firstName,
          apellido: b.lastName,
          dni: b.dni ?? "",
          prioridad: b.healthConditions.map((hc) => hc.name),
        })),
      )
    } catch (err) {
      toast.error("Error al cargar beneficiarios")
    } finally {
      setLoading(false)
    }
  }, [get, busqueda])

  useEffect(() => {
    fetchBeneficiaries()
  }, [fetchBeneficiaries])

  useEffect(() => {
    if (modalAbierto) {
      Promise.all([
        get<{ ok: boolean; items: HealthCondition[] }>("/api/beneficiaries/conditions"),
        get<{ ok: boolean; items: OllaOption[] }>("/api/beneficiaries/ollas"),
      ]).then(([conditions, ollasData]) => {
        setHealthConditions(conditions.items)
        setOllas(ollasData.items)
      })
    } else {
      setForm({ firstName: "", lastName: "", dni: "", birthDate: "", gender: "not_specified", phone: "", address: "", ollaId: "", priorityLevel: "normal", healthConditionIds: [] })
      setErrors({})
    }
  }, [modalAbierto, get])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.firstName.trim()) errs.firstName = "El nombre es obligatorio"
    if (!form.lastName.trim()) errs.lastName = "Los apellidos son obligatorios"
    if (!form.birthDate.trim()) errs.birthDate = "La fecha de nacimiento es obligatoria"
    else {
      const d = new Date(form.birthDate)
      if (isNaN(d.getTime())) errs.birthDate = "Fecha inválida"
      else if (d > new Date()) errs.birthDate = "No puede ser futura"
    }
    if (form.dni && form.dni.length > 20) errs.dni = "Máximo 20 caracteres"
    if (form.phone && form.phone.length > 30) errs.phone = "Máximo 30 caracteres"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await request("/api/beneficiaries", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dni: form.dni.trim() || undefined,
          birthDate: form.birthDate,
          gender: form.gender,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          ollaId: form.ollaId || undefined,
          priorityLevel: form.priorityLevel,
          healthConditionIds: form.healthConditionIds,
        }),
      })
      toast.success("Beneficiario registrado correctamente")
      setModalAbierto(false)
      setBusqueda("")
      setLoading(true)
      fetchBeneficiaries()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCondition = (id: number) => {
    setForm((prev) => ({
      ...prev,
      healthConditionIds: prev.healthConditionIds.includes(id)
        ? prev.healthConditionIds.filter((c) => c !== id)
        : [...prev.healthConditionIds, id],
    }))
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Padrón</h1>
          <p className="text-sm text-muted-foreground">{beneficiarios.length} beneficiarios</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-10 pr-10 text-base"
          placeholder="Buscar por nombre o DNI…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setBusqueda("")}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
        </div>
      ) : beneficiarios.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {busqueda ? "Sin resultados" : "Aún no hay beneficiarios registrados"}
        </p>
      ) : (
        <div className="space-y-3">
          {beneficiarios.map((b) => (
            <BeneficiaryCard
              key={b.id}
              beneficiary={b}
              onClick={() => toast.info(`${b.nombre} ${b.apellido} — DNI ${b.dni}`)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:scale-90"
        onClick={() => setModalAbierto(true)}
        aria-label="Agregar beneficiario"
      >
        <Plus className="h-7 w-7" />
      </button>

      <Sheet open={modalAbierto} onOpenChange={setModalAbierto}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nuevo beneficiario</SheetTitle>
            <SheetDescription>Completa los datos del beneficiario</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Nombres *</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Nombres" />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Apellidos *</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellidos" />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} placeholder="12345678" maxLength={20} />
                {errors.dni && <p className="text-xs text-destructive">{errors.dni}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gender">Género</Label>
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="not_specified">No especificado</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priorityLevel">Prioridad</Label>
                <select
                  id="priorityLevel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.priorityLevel}
                  onChange={(e) => setForm({ ...form, priorityLevel: e.target.value })}
                >
                  <option value="normal">Normal</option>
                  <option value="low">Baja</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Condiciones de salud</Label>
              <div className="flex flex-wrap gap-2">
                {healthConditions.map((hc) => {
                  const selected = form.healthConditionIds.includes(hc.id)
                  return (
                    <button
                      key={hc.id}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                      onClick={() => toggleCondition(hc.id)}
                    >
                      {hc.name}
                    </button>
                  )
                })}
                {healthConditions.length === 0 && (
                  <p className="text-xs text-muted-foreground">Cargando condiciones...</p>
                )}
              </div>
            </div>

            {ollas.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="ollaId">Olla común</Label>
                <select
                  id="ollaId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.ollaId}
                  onChange={(e) => setForm({ ...form, ollaId: e.target.value })}
                >
                  <option value="">Sin asignar</option>
                  {ollas.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="999 999 999" maxLength={30} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección" />
            </div>

            <Button
              className="h-12 w-full bg-primary text-primary-foreground hover:opacity-90"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Guardando..." : "Guardar beneficiario"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
