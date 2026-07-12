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
import { WifiOff, RefreshCw, AlertTriangle, Trash2, X } from 'lucide-react'
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

function CollapsedPill({ bgColor, icon, badgeCount, onExpand }: { bgColor: string; icon: React.ReactNode; badgeCount?: number; onExpand: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Expandir banner"
      onClick={onExpand}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand() } }}
      className={`fixed right-4 top-4 z-[9999] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white shadow-lg shadow-black/20 active:scale-95 transition-all duration-300 hover:scale-105 ${bgColor}`}
    >
      {icon}
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-white dark:ring-gray-950 animate-bounce">
          {badgeCount}
        </span>
      )}
    </div>
  )
}

function ConflictsSheet({ open, onOpenChange, failedMutations, onDismiss, onClearAll }: { open: boolean; onOpenChange: (open: boolean) => void; failedMutations: FailedMutation[]; onDismiss: (id: number) => void; onClearAll: () => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
                onClick={onClearAll}
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
                  onClick={() => onDismiss(fm.id!)}
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
  )
}

function OnlineConflictsBanner({ failedCount, onExpand, onCollapse, onReview }: { failedCount: number; onExpand: () => void; onCollapse: () => void; onReview: () => void }) {
  return (
    <div className="fixed right-4 top-4 z-[9999] flex items-center gap-3 rounded-xl bg-destructive px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white shadow-lg shadow-red-950/20 max-w-[calc(100%-2rem)] md:max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertTriangle className="h-4.5 w-4.5 text-amber-300 animate-pulse shrink-0" />
      <span className="truncate flex-1">Conflictos de sincronización ({failedCount})</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onReview}
          className="rounded bg-white/20 px-2.5 py-1 text-xs hover:bg-white/30 transition-colors font-bold"
        >
          Revisar
        </button>
        <button
          onClick={onCollapse}
          className="rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Minimizar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SyncingBanner({ pendingCount, failedCount, onCollapse, onReview }: { pendingCount: number; failedCount: number; onCollapse: () => void; onReview: () => void }) {
  return (
    <div className="fixed right-4 top-4 z-[9999] flex items-center justify-between gap-3 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs md:text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 max-w-[calc(100%-2rem)] md:max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 min-w-0">
        <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
        <span className="truncate">Sincronizando {pendingCount} cambio(s)...</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {failedCount > 0 && (
          <button
            onClick={onReview}
            className="flex items-center gap-1 text-xs text-amber-200 hover:text-amber-100 hover:underline font-bold"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{failedCount} error(es)</span>
          </button>
        )}
        <button
          onClick={onCollapse}
          className="rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Minimizar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function OfflineModeBanner({ pendingCount, failedCount, onCollapse, onReview }: { pendingCount: number; failedCount: number; onCollapse: () => void; onReview: () => void }) {
  return (
    <div className="fixed top-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center justify-between gap-3 rounded-full border border-amber-500/20 bg-amber-500/90 backdrop-blur-md pl-4 pr-2.5 py-1.5 text-xs md:text-sm font-semibold text-amber-950 shadow-md shadow-amber-900/10 max-w-[calc(100%-2rem)] md:max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="h-3.5 w-3.5 animate-pulse text-amber-950 shrink-0" />
        <span className="truncate">
          Sin conexión — Modo offline
          {pendingCount > 0 && ` (${pendingCount} local)`}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {failedCount > 0 && (
          <button
            onClick={onReview}
            className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold hover:bg-black/20 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap text-amber-950"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>{failedCount}</span>
          </button>
        )}
        <button
          onClick={onCollapse}
          className="rounded-full p-1 text-amber-950/70 hover:text-amber-950 hover:bg-black/10 transition-colors"
          aria-label="Minimizar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function OfflineBanner() {
  const online = useOnline()
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [failedMutations, setFailedMutations] = useState<FailedMutation[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const [prevOnline, setPrevOnline] = useState(online)
  const [prevPending, setPrevPending] = useState(pendingCount)
  const [prevFailed, setPrevFailed] = useState(failedCount)

  const updateData = async () => {
    const mutations = await getMutations()
    setPendingCount(mutations.length)

    const failed = await getFailedMutations()
    setFailedMutations(failed)
    setFailedCount(failed.length)
  }

  useEffect(() => {
    updateData()

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

  useEffect(() => {
    if (online !== prevOnline || pendingCount !== prevPending || failedCount !== prevFailed) {
      setIsCollapsed(false)
      setPrevOnline(online)
      setPrevPending(pendingCount)
      setPrevFailed(failedCount)
    }
  }, [online, pendingCount, failedCount, prevOnline, prevPending, prevFailed])

  const handleDismiss = async (id: number) => {
    await deleteFailedMutation(id)
    await updateData()
  }

  const handleClearAll = async () => {
    await clearFailedMutations()
    await updateData()
    setIsOpen(false)
  }

  const expandBanner = () => setIsCollapsed(false)
  const openSheet = () => setIsOpen(true)
  const closeSheet = (open: boolean) => setIsOpen(open)

  if (online && pendingCount === 0 && failedCount > 0) {
    if (isCollapsed) {
      return (
        <CollapsedPill
          bgColor="bg-destructive/90 backdrop-blur-md"
          icon={<AlertTriangle className="h-5 w-5 text-amber-300 animate-pulse" />}
          badgeCount={failedCount}
          onExpand={expandBanner}
        />
      )
    }
    return (
      <>
        <OnlineConflictsBanner
          failedCount={failedCount}
          onExpand={expandBanner}
          onCollapse={() => setIsCollapsed(true)}
          onReview={openSheet}
        />
        <ConflictsSheet
          open={isOpen}
          onOpenChange={closeSheet}
          failedMutations={failedMutations}
          onDismiss={handleDismiss}
          onClearAll={handleClearAll}
        />
      </>
    )
  }

  if (online && pendingCount > 0) {
    if (isCollapsed) {
      return (
        <CollapsedPill
          bgColor="bg-emerald-600/90 backdrop-blur-md"
          icon={<RefreshCw className="h-4 w-4 animate-spin text-white" />}
          badgeCount={pendingCount}
          onExpand={expandBanner}
        />
      )
    }
    return (
      <>
        <SyncingBanner
          pendingCount={pendingCount}
          failedCount={failedCount}
          onCollapse={() => setIsCollapsed(true)}
          onReview={openSheet}
        />
        <ConflictsSheet
          open={isOpen}
          onOpenChange={closeSheet}
          failedMutations={failedMutations}
          onDismiss={handleDismiss}
          onClearAll={handleClearAll}
        />
      </>
    )
  }

  if (online && pendingCount === 0) return null

  if (isCollapsed) {
    return (
      <CollapsedPill
        bgColor="bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-md text-amber-950 dark:text-amber-50"
        icon={<WifiOff className="h-4.5 w-4.5 text-amber-950 dark:text-amber-50 animate-pulse" />}
        badgeCount={failedCount > 0 ? failedCount : undefined}
        onExpand={expandBanner}
      />
    )
  }

  return (
    <>
      <OfflineModeBanner
        pendingCount={pendingCount}
        failedCount={failedCount}
        onCollapse={() => setIsCollapsed(true)}
        onReview={openSheet}
      />
      <ConflictsSheet
        open={isOpen}
        onOpenChange={closeSheet}
        failedMutations={failedMutations}
        onDismiss={handleDismiss}
        onClearAll={handleClearAll}
      />
    </>
  )
}
