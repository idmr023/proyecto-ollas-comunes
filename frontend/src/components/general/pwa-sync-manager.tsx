"use client"

import { useEffect } from 'react'
import { getMutations, deleteMutation } from '@/lib/indexed-db'

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'

function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state?.token) {
        return { Authorization: `Bearer ${parsed.state.token}` }
      }
    }
  } catch {}
  return {}
}

export default function PwaSyncManager() {
  const syncOfflineMutations = async () => {
    // Verificar si estamos realmente online
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    const mutations = await getMutations()
    if (mutations.length === 0) return

    console.log('[PWA Sync] Iniciando sincronización de', mutations.length, 'cambios en cola...');

    let syncCompletedAny = false;

    for (const mutation of mutations) {
      const url = `${apiBaseUrl}${mutation.path}`
      try {
        const res = await fetch(url, {
          method: mutation.method,
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: mutation.body ? JSON.stringify(mutation.body) : undefined,
        })

        if (res.ok) {
          console.log('[PWA Sync] Sincronizado con éxito:', mutation.method, mutation.path)
          await deleteMutation(mutation.id!)
          syncCompletedAny = true
        } else {
          console.warn('[PWA Sync] Error del servidor en mutación:', mutation.id, res.status)
          // Detener el bucle para evitar inconsistencias (por ejemplo, intentar editar un registro cuya creación falló)
          break
        }
      } catch (err) {
        console.error('[PWA Sync] Error de conexión durante sincronización:', err)
        break
      }
    }

    // Despachar evento para actualizar el banner
    window.dispatchEvent(new Event('offline-mutations-updated'))

    // Si se sincronizó al menos una mutación, recargamos la página para refrescar los datos frescos del servidor
    if (syncCompletedAny) {
      console.log('[PWA Sync] Recargando datos de la interfaz para reflejar base de datos remota.')
      window.location.reload()
    }
  }

  useEffect(() => {
    // Sincronizar inmediatamente si estamos online al montar el componente
    syncOfflineMutations()

    // Escuchar el evento online del navegador
    window.addEventListener('online', syncOfflineMutations)

    return () => {
      window.removeEventListener('online', syncOfflineMutations)
    }
  }, [])

  return null
}
