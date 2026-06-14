"use client"

import { useEffect, useState } from 'react'
import useOnline from '@/hooks/use-online'
import { getMutations } from '@/lib/indexed-db'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflineBanner() {
  const online = useOnline()
  const [pendingCount, setPendingCount] = useState(0)

  const updateCount = async () => {
    const mutations = await getMutations()
    setPendingCount(mutations.length)
  }

  useEffect(() => {
    updateCount()

    // Escuchar actualizaciones de la cola offline y estado de red
    window.addEventListener('offline-mutations-updated', updateCount)
    window.addEventListener('online', updateCount)
    window.addEventListener('offline', updateCount)

    return () => {
      window.removeEventListener('offline-mutations-updated', updateCount)
      window.removeEventListener('online', updateCount)
      window.removeEventListener('offline', updateCount)
    }
  }, [])

  if (online && pendingCount === 0) return null

  if (online && pendingCount > 0) {
    return (
      <div className="fixed right-4 top-4 z-[9999] flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Sincronizando {pendingCount} cambio(s) pendiente(s)...</span>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black shadow-xl shadow-amber-950/20">
      <WifiOff className="h-4 w-4 animate-pulse" />
      <span>
        Sin conexión — Modo offline activo
        {pendingCount > 0 && ` (${pendingCount} guardado(s) local)`}
      </span>
    </div>
  )
}
