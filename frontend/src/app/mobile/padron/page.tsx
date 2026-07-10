"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BeneficiaryCard } from "@/components/mobile/beneficiary-card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"
import { Label } from "@/components/ui/label"

import { z } from "zod"

const beneficiarySchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio"),
  lastName: z.string().trim().min(1, "Los apellidos son obligatorios"),
  birthDate: z.string().trim().min(1, "La fecha de nacimiento es obligatoria").refine((val) => {
    const d = new Date(val)
    return !Number.isNaN(d.getTime()) && d <= new Date()
  }, { message: "Fecha de nacimiento inválida o futura" }),
  dni: z.string().trim().min(1, "El DNI es obligatorio").max(20, "Máximo 20 caracteres"),
  phone: z.string().trim().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
  ollaId: z.string().trim().min(1, "La olla común es obligatoria"),
})

interface Beneficiary {
  id: string
  nombre: string
  apellido: string
  dni: string
  prioridad?: string[]
  hasEatenToday?: boolean
}

interface BeneficiaryRecord {
  id: string
  firstName: string
  lastName: string
  dni: string | null
  healthConditions: { id: number; name: string }[]
  hasEatenToday?: boolean
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
  const router = useRouter()
  const { get, request } = useApi()
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [beneficiarios, setBeneficiarios] = useState<Beneficiary[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([])
  const [ollas, setOllas] = useState<OllaOption[]>([])
  const [modoEntrega, setModoEntrega] = useState(false)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [delivering, setDelivering] = useState(false)
  const [activeDishName, setActiveDishName] = useState<string | null>(null)
  const [isMenuExecuted, setIsMenuExecuted] = useState(false)
  const [maxServingsRemaining, setMaxServingsRemaining] = useState<number>(0)
  const [currentOllaId, setCurrentOllaId] = useState<string | null>(null)

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
      if (currentOllaId) params.ollaId = currentOllaId
      
      const data = await get<{ ok: boolean; items: BeneficiaryRecord[] }>("/api/beneficiaries", params)
      setBeneficiarios(
        data.items.map((b) => ({
          id: b.id,
          nombre: b.firstName,
          apellido: b.lastName,
          dni: b.dni ?? "",
          prioridad: (b.healthConditions ?? []).map((hc) => hc.name),
          hasEatenToday: b.hasEatenToday,
        })),
      )
    } catch (err) {
      toast.error("Error al cargar beneficiarios")
    } finally {
      setLoading(false)
    }
  }, [get, busqueda, currentOllaId])

  const fetchActiveMenu = useCallback(async () => {
    try {
      const data = await get<{
        ok: boolean
        olla?: { id: string; name: string } | null
        summary?: {
          menu?: {
            dishName: string
            status: string
            maxServingsRemaining?: number
          } | null
        }
      }>("/api/mobile/dashboard")
      if (data.ok && data.olla) {
        setCurrentOllaId(data.olla.id)
      }
      if (data.ok && data.summary?.menu) {
        setActiveDishName(data.summary.menu.dishName)
        setIsMenuExecuted(data.summary.menu.status === "executed")
        setMaxServingsRemaining(data.summary.menu.maxServingsRemaining ?? 0)
      } else {
        setActiveDishName(null)
        setIsMenuExecuted(false)
        setMaxServingsRemaining(0)
      }
    } catch (err) {
      console.error("Error fetching active menu", err)
      setLoading(false)
    }
  }, [get])

  useEffect(() => {
    fetchBeneficiaries()

    const handleSync = () => {
      console.log('[Padron Mobile] Sincronización completada. Refrescando beneficiarios...')
      fetchBeneficiaries()
    }
    window.addEventListener('pwa-sync-completed', handleSync)
    return () => {
      window.removeEventListener('pwa-sync-completed', handleSync)
    }
  }, [fetchBeneficiaries, currentOllaId])

  useEffect(() => {
    fetchActiveMenu()

    const handleSync = () => {
      console.log('[Padron Mobile] Sincronización completada. Refrescando menú activo...')
      fetchActiveMenu()
    }
    window.addEventListener('pwa-sync-completed', handleSync)
    return () => {
      window.removeEventListener('pwa-sync-completed', handleSync)
    }
  }, [fetchActiveMenu])

  useEffect(() => {
    if (modalAbierto) {
      Promise.all([
        get<{ ok: boolean; items: HealthCondition[] }>("/api/beneficiaries/conditions"),
        get<{ ok: boolean; items: OllaOption[] }>("/api/beneficiaries/ollas"),
      ]).then(([conditions, ollasData]) => {
        setHealthConditions(conditions.items)
        setOllas(ollasData.items)
        // Autoseleccionar la olla de la lideresa activa si está disponible
        if (currentOllaId) {
          setForm((prev) => ({ ...prev, ollaId: currentOllaId }))
        }
      })
    } else {
      setForm({ firstName: "", lastName: "", dni: "", birthDate: "", gender: "not_specified", phone: "", address: "", ollaId: "", priorityLevel: "normal", healthConditionIds: [] })
      setErrors({})
    }
  }, [modalAbierto, get, currentOllaId])

  const validate = () => {
    const result = beneficiarySchema.safeParse({
      firstName: form.firstName,
      lastName: form.lastName,
      birthDate: form.birthDate,
      dni: form.dni,
      phone: form.phone,
      ollaId: form.ollaId,
    })
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errs[err.path[0] as string] = err.message
        }
      })
      setErrors(errs)
      return false
    }
    setErrors({})
    return true
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
          dni: form.dni.trim(),
          birthDate: form.birthDate,
          gender: form.gender,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          ollaId: form.ollaId,
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
          <h1 className="text-xl font-bold text-foreground">
            {modoEntrega ? "Entregar Raciones" : "Padrón"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {modoEntrega ? "Selecciona beneficiarios para la entrega" : `${beneficiarios.length} beneficiarios`}
          </p>
        </div>
        {modoEntrega && (
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => {
              setModoEntrega(false)
              setSeleccionados([])
            }}
          >
            Cancelar
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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
        {!modoEntrega && (
          <Button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="h-12 w-12 rounded-full shrink-0 flex items-center justify-center bg-primary text-primary-foreground shadow-sm active:scale-95 p-0"
            aria-label="Agregar beneficiario"
          >
            <Plus className="h-5 w-5" />
          </Button>
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
              isSelected={seleccionados.includes(b.id)}
              onClick={() => {
                if (modoEntrega) {
                  if (b.hasEatenToday) {
                    toast.info(`${b.nombre} ya recibió su ración hoy.`)
                    return
                  }
                  const isSelectedAlready = seleccionados.includes(b.id)
                  if (!isSelectedAlready && seleccionados.length >= maxServingsRemaining) {
                    toast.warning(`⚠️ Solo queda stock para ${maxServingsRemaining} ración(es) más.`)
                    return
                  }
                  setSeleccionados((prev) =>
                      prev.includes(b.id)
                          ? prev.filter((id) => id !== b.id)
                          : [...prev, b.id],
                  )
                } else {
                  toast.info(`${b.nombre} ${b.apellido} — DNI ${b.dni}`)
                }
              }}
            />
          ))}
        </div>
      )}

      {!modoEntrega ? (
        <div className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-2rem)] max-w-[calc(448px-2rem)] -translate-x-1/2 p-1">
          <Button
            onClick={() => {
              setModoEntrega(true)
              setSeleccionados([])
            }}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            🍽️ Registrar Entrega de Ración
          </Button>
        </div>
      ) : (
        seleccionados.length > 0 && (
          <div className="fixed bottom-20 left-1/2 z-40 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-[calc(448px-2rem)] -translate-x-1/2 rounded-xl bg-card border border-border p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">
                  {seleccionados.length} ración(es) seleccionada(s)
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px] font-medium">
                  Plato: {activeDishName || "Almuerzo del día"} | Capacidad stock: {maxServingsRemaining} raciones
                </span>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                disabled={delivering}
                onClick={async () => {
                  setDelivering(true)
                  try {
                    await request("/api/mobile/deliveries", {
                      method: "POST",
                      body: JSON.stringify({
                        beneficiaryIds: seleccionados,
                        dishName: activeDishName || "Almuerzo del día",
                      }),
                    })
                    toast.success("Raciones registradas correctamente")
                    setModoEntrega(false)
                    setSeleccionados([])
                    router.push("/mobile/inicio")
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Error al registrar raciones")
                  } finally {
                    setDelivering(false)
                  }
                }}
              >
                {delivering ? "Registrando..." : "Confirmar"}
              </Button>
            </div>
            {!activeDishName && (
              <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                <span>⚠️ No hay menú planificado para hoy. Se usará fallback de insumos.</span>
              </div>
            )}
          </div>
        )
      )}

      <Sheet open={modalAbierto} onOpenChange={setModalAbierto}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card px-5 shadow-2xl pb-0">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-lg font-bold text-foreground">Nuevo beneficiario</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">Completa los datos del beneficiario</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-12">
            {/* Sección: Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Datos Personales</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm font-semibold tracking-wide text-foreground/80">Nombres *</Label>
                  <Input id="firstName" className="h-12 rounded-xl text-base" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Nombres" />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm font-semibold tracking-wide text-foreground/80">Apellidos *</Label>
                  <Input id="lastName" className="h-12 rounded-xl text-base" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellidos" />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dni" className="text-sm font-semibold tracking-wide text-foreground/80">DNI *</Label>
                  <Input id="dni" className="h-12 rounded-xl text-base" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} placeholder="12345678" maxLength={20} />
                  {errors.dni && <p className="text-xs text-destructive">{errors.dni}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate" className="text-sm font-semibold tracking-wide text-foreground/80">Fecha de nacimiento *</Label>
                  <Input id="birthDate" className="h-12 rounded-xl text-base" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                  {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-sm font-semibold tracking-wide text-foreground/80">Género</Label>
                  <select
                    id="gender"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2523666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat pr-10 cursor-pointer transition-all duration-200"
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
                  <Label htmlFor="priorityLevel" className="text-sm font-semibold tracking-wide text-foreground/80">Prioridad</Label>
                  <select
                    id="priorityLevel"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2523666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat pr-10 cursor-pointer transition-all duration-200"
                    value={form.priorityLevel}
                    onChange={(e) => setForm({ ...form, priorityLevel: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="low">Baja</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-border/40" />

            {/* Sección: Olla y Salud */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Olla y Salud</h3>

              <div className="space-y-1.5">
                  <Label htmlFor="ollaId" className="text-sm font-semibold tracking-wide text-foreground/80">Olla común *</Label>
                  <select
                    id="ollaId"
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2523666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.65rem_auto] bg-[right_1rem_center] bg-no-repeat pr-10 cursor-pointer transition-all duration-200"
                    value={form.ollaId}
                    onChange={(e) => setForm({ ...form, ollaId: e.target.value })}
                  >
                    <option value="">-- Seleccionar olla --</option>
                    {ollas.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  {errors.ollaId && <p className="text-xs text-destructive">{errors.ollaId}</p>}
                </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold tracking-wide text-foreground/80">Condiciones de salud</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {healthConditions.map((hc) => {
                    const selected = form.healthConditionIds.includes(hc.id)
                    return (
                      <button
                        key={hc.id}
                        type="button"
                        className={`rounded-full border px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 ${selected
                            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/15"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
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
            </div>

            <hr className="border-border/40" />

            {/* Sección: Contacto */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Contacto</h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-semibold tracking-wide text-foreground/80">Teléfono</Label>
                  <Input id="phone" className="h-12 rounded-xl text-base" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="999 999 999" maxLength={30} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-sm font-semibold tracking-wide text-foreground/80">Dirección</Label>
                  <Input id="address" className="h-12 rounded-xl text-base" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                className="h-14 w-full bg-primary text-primary-foreground hover:opacity-90 font-bold text-base rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-primary/10"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Guardando..." : "Guardar beneficiario"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
