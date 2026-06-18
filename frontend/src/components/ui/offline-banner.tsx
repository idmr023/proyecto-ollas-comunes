"use client"

import { useEffect, useState } from 'react'
import useOnline from '@/hooks/use-online'
import {
  getMutations,
  getFailedMutations,
  deleteFailedMutation,
  clearFailedMutations,
  FailedMutation,
} from '@/lib/indexed-db'
import { WifiOff, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

function getMutationLabel(mutation: FailedMutation) {
  const isBeneficiary = mutation.path.startsWith('/api/beneficiaries')
  const isDelivery = mutation.path.startsWith('/api/mobile/deliveries')
  const isMenu = mutation.path.startsWith('/api/mobile/menu-plans')
  const isInventory = mutation.path.startsWith('/api/mobile/inventory')

  let label = 'Operación en el sistema'
  let details = ''

  if (isBeneficiary) {
    if (mutation.method === 'POST') label = 'Registrar Beneficiario'
    else if (mutation.method === 'PATCH') label = 'Editar Beneficiario'
    else if (mutation.method === 'DELETE') label = 'Eliminar Beneficiario'

    if (mutation.body) {
      details = `${mutation.body.firstName || ''} ${mutation.body.lastName || ''}`.trim()
      if (mutation.body.dni) details += ` (DNI: ${mutation.body.dni})`
    }
  } else if (isDelivery) {
    label = 'Entrega de Raciones'
    if (mutation.body) {
      details = `Plato: ${mutation.body.dishName || 'Almuerzo'} — ${mutation.body.beneficiaryIds?.length || 0} persona(s)`
    }
  } else if (isMenu) {
    label = 'Planificación de Menú'
    if (mutation.body) {
      details = `Plato: ${mutation.body.dishName || ''} (${mutation.body.servings || 0} raciones)`
    }
  } else if (isInventory) {
    label = 'Movimiento de Almacén'
    if (mutation.body) {
      details = `Insumo ID: ${mutation.body.supplyItemId || ''} — Cantidad: ${mutation.body.quantity || 0} (${mutation.body.movementType === 'in' ? 'Entrada' : 'Salida'})`
    }
  }

  return { label, details }
}

export default function OfflineBanner() {
  const online = useOnline()
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [failedMutations, setFailedMutations] = useState<FailedMutation[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const updateData = async () => {
    const mutations = await getMutations()
    setPendingCount(mutations.length)

    const failed = await getFailedMutations()
    setFailedMutations(failed)
    setFailedCount(failed.length)
  }

  useEffect(() => {
    updateData()

    // Escuchar actualizaciones de la cola offline, fallas y estado de red
    window.addEventListener('offline-mutations-updated', updateData)
    window.addEventListener('offline-failed-mutations-updated', updateData)
    window.addEventListener('online', updateData)
    window.addEventListener('offline', updateData)

    return () => {
      window.removeEventListener('offline-mutations-updated', updateData)
      window.removeEventListener('offline-failed-mutations-updated', updateData)
      window.removeEventListener('online', updateData)
      window.removeEventListener('offline', updateData)
    }
  }, [])

  const handleDismiss = async (id: number) => {
    await deleteFailedMutation(id)
    await updateData()
  }

  const handleClearAll = async () => {
    await clearFailedMutations()
    await updateData()
    setIsOpen(false)
  }

  // Render para avisos online sin cambios pendientes pero con fallos previos
  if (online && pendingCount === 0 && failedCount > 0) {
    return (
      <>
        <div className="fixed right-4 top-4 z-[9999] flex items-center gap-3 rounded-lg bg-destructive px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-300 animate-pulse" />
          <span>Hay {failedCount} conflicto(s) de sincronización.</span>
          <button
            onClick={() => setIsOpen(true)}
            className="rounded bg-white/20 px-2.5 py-1 text-xs hover:bg-white/30 transition-colors"
          >
            Revisar
          </button>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card px-5 shadow-2xl pb-6">
            <SheetHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Conflictos de Sincronización
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground mt-1">
                    Estos cambios no pudieron guardarse en el servidor debido a reglas de negocio (ej. DNI repetido).
                  </SheetDescription>
                </div>
                {failedMutations.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Descartar todo
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              {failedMutations.map((fm) => {
                const { label, details } = getMutationLabel(fm)
                return (
                  <div key={fm.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-left">
                    <div className="space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive">
                        {label}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{details}</p>
                      <p className="text-xs text-muted-foreground bg-card border border-border/50 p-2.5 rounded-lg font-mono leading-relaxed mt-1">
                        {fm.errorMessage}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(fm.id!)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Render para sincronización en proceso
  if (online && pendingCount > 0) {
    return (
      <>
        <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Sincronizando {pendingCount} cambio(s) pendiente(s)...</span>
          </div>
          {failedCount > 0 && (
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-1.5 mt-1 text-xs text-amber-200 hover:underline text-left"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Ver {failedCount} conflicto(s) anteriores</span>
            </button>
          )}
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card px-5 shadow-2xl pb-6">
            <SheetHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Conflictos de Sincronización
                  </SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground mt-1">
                    Estos cambios no pudieron guardarse en el servidor debido a reglas de negocio (ej. DNI repetido).
                  </SheetDescription>
                </div>
                {failedMutations.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Descartar todo
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              {failedMutations.map((fm) => {
                const { label, details } = getMutationLabel(fm)
                return (
                  <div key={fm.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-left">
                    <div className="space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive">
                        {label}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{details}</p>
                      <p className="text-xs text-muted-foreground bg-card border border-border/50 p-2.5 rounded-lg font-mono leading-relaxed mt-1">
                        {fm.errorMessage}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(fm.id!)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  if (online && pendingCount === 0) return null

  // Render para modo offline activo
  return (
    <>
      <div className="fixed top-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-amber-500/20 bg-amber-500/90 backdrop-blur-md px-4 py-1.5 text-xs md:text-sm font-semibold text-amber-950 shadow-md shadow-amber-900/10 pointer-events-auto transition-all duration-300 hover:scale-105">
        <WifiOff className="h-3.5 w-3.5 animate-pulse text-amber-950" />
        <span>
          Sin conexión — Modo offline activo
          {pendingCount > 0 && ` (${pendingCount} guardado(s) local)`}
        </span>
        {failedCount > 0 && (
          <button
            onClick={() => setIsOpen(true)}
            className="ml-1.5 rounded-full bg-black/10 px-2.5 py-0.5 text-[10px] font-bold hover:bg-black/20 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>{failedCount} error(es)</span>
          </button>
        )}
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card px-5 shadow-2xl pb-6">
          <SheetHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Conflictos de Sincronización
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-1">
                  Estos cambios no pudieron guardarse en el servidor debido a reglas de negocio (ej. DNI repetido).
                </SheetDescription>
              </div>
              {failedMutations.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Descartar todo
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {failedMutations.map((fm) => {
              const { label, details } = getMutationLabel(fm)
              return (
                <div key={fm.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-left">
                  <div className="space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive">
                      {label}
                    </span>
                    <p className="text-sm font-semibold text-foreground">{details}</p>
                    <p className="text-xs text-muted-foreground bg-card border border-border/50 p-2.5 rounded-lg font-mono leading-relaxed mt-1">
                      {fm.errorMessage}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDismiss(fm.id!)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
