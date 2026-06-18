"use client"

import { useEffect } from 'react'
import { getMutations, deleteMutation, updateMutation, addFailedMutation, getFailedMutations } from '@/lib/indexed-db'

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'
const LS_MUTATION_COUNT = 'pwa-pending-mutation-count'
const LS_FAILED_COUNT = 'pwa-failed-mutation-count'

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

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.state?.token ?? null
    }
  } catch {}
  return null
}

async function detectDataLoss() {
  if (typeof window === 'undefined') return
  const prevPending = parseInt(localStorage.getItem(LS_MUTATION_COUNT) || '0', 10)
  const prevFailed = parseInt(localStorage.getItem(LS_FAILED_COUNT) || '0', 10)
  if (prevPending === 0 && prevFailed === 0) return

  const mutations = await getMutations()
  const failed = await getFailedMutations()
  const currentPending = mutations.length
  const currentFailed = failed.length

  const lostPending = Math.max(0, prevPending - currentPending)
  const lostFailed = Math.max(0, prevFailed - currentFailed)

  if (lostPending > 0 || lostFailed > 0) {
    console.warn('[PWA Sync] Datos perdidos detectados:', { lostPending, lostFailed })
    const token = getAuthToken()
    if (token) {
      try {
        await fetch(`${apiBaseUrl}/api/notifications/report-data-loss`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            pendingCount: lostPending,
            failedCount: lostFailed,
            message: `Se perdieron ${lostPending} mutaciones pendientes y ${lostFailed} fallos de sincronización en el almacenamiento local.`,
          }),
        })
      } catch (err) {
        console.warn('[PWA Sync] No se pudo reportar pérdida de datos:', err)
      }
    }
  }
}

function updateLocalCounters() {
  if (typeof window === 'undefined') return
  getMutations().then((m) => localStorage.setItem(LS_MUTATION_COUNT, String(m.length)))
  getFailedMutations().then((f) => localStorage.setItem(LS_FAILED_COUNT, String(f.length)))
}

async function backupMutationToServer(mutation: { path: string; method: string; body?: unknown; timestamp: number; errorMessage?: string; status?: number }) {
  const token = getAuthToken()
  if (!token) return
  try {
    await fetch(`${apiBaseUrl}/api/notifications/backup-mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        path: mutation.path,
        method: mutation.method,
        body: mutation.body,
        errorMessage: mutation.errorMessage,
        status: mutation.status,
        originalTimestamp: mutation.timestamp,
      }),
    })
  } catch {
    // backup is optional, ignore errors
  }
}

export default function PwaSyncManager() {
  const syncOfflineMutations = async () => {
    // Verificar si estamos realmente online
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    const mutations = await getMutations()
    if (mutations.length === 0) return

    console.log('[PWA Sync] Iniciando sincronización de', mutations.length, 'cambios en cola...');

    let syncCompletedAny = false;

    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i]
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
          
          // Reescritura de IDs temporales (tempId) si es un POST exitoso
          const responseData = await res.json().catch(() => ({}))
          const realId = responseData.item?.id || responseData.delivery?.id || responseData.movement?.id
          if (realId && mutation.tempId) {
            console.log(`[PWA Sync] Reescritura de IDs: Reemplazando ${mutation.tempId} por ${realId}`)
            // Buscar y actualizar el resto de mutaciones en cola
            for (let j = i + 1; j < mutations.length; j++) {
              const subMutation = mutations[j]
              let modified = false
              
              // 1. Reemplazar en path
              if (subMutation.path.includes(mutation.tempId)) {
                subMutation.path = subMutation.path.replaceAll(mutation.tempId, realId)
                modified = true
              }
              
              // 2. Reemplazar en body
              if (subMutation.body) {
                let bodyStr = JSON.stringify(subMutation.body)
                if (bodyStr.includes(mutation.tempId)) {
                  bodyStr = bodyStr.replaceAll(mutation.tempId, realId)
                  subMutation.body = JSON.parse(bodyStr)
                  modified = true
                }
              }
              
              if (modified) {
                await updateMutation(subMutation)
              }
            }
          }

          await deleteMutation(mutation.id!)
          syncCompletedAny = true
        } else {
          console.warn('[PWA Sync] Error del servidor en mutación:', mutation.id, res.status)
          
          if (res.status === 401 || res.status === 403) {
            console.warn('[PWA Sync] Error de autenticación. Deteniendo sincronización.')
            // Disparar evento para alertar
            window.dispatchEvent(new Event('pwa-sync-auth-required'))
            break
          } else if (res.status >= 400 && res.status < 500) {
            const errBody = await res.json().catch(() => ({}))
            const errMsg = errBody.message || `Error del servidor (${res.status})`
            console.error('[PWA Sync] Error lógico descartable:', errMsg)
            
            // Registrar fallo en indexedDB
            await addFailedMutation(mutation, errMsg, res.status)
            await deleteMutation(mutation.id!)
            // Backup del fallo al servidor
            backupMutationToServer({ ...mutation, errorMessage: errMsg, status: res.status })
            
            // Limpieza en Cascada si la mutación tenía un tempId
            if (mutation.tempId) {
              console.warn(`[PWA Sync] Limpieza en cascada para ${mutation.tempId} fallido...`)
              for (let j = i + 1; j < mutations.length; j++) {
                const subMutation = mutations[j]
                
                // Si es edición o eliminación del recurso fallido, descartarlo
                if (subMutation.path.includes(mutation.tempId) && (subMutation.method === 'PATCH' || subMutation.method === 'DELETE')) {
                  console.warn(`[PWA Sync] Descartando mutación dependiente en path: ${subMutation.method} ${subMutation.path}`)
                  await addFailedMutation(subMutation, `Cancelado por error en cascada: No se pudo registrar el beneficiario original.`, 400)
                  await deleteMutation(subMutation.id!)
                  
                  // Removerlo de la cola en este ciclo
                  mutations.splice(j, 1)
                  j--
                }
                // Si es una entrega o movimiento que lo referencia en su body
                else if (subMutation.body) {
                  let bodyStr = JSON.stringify(subMutation.body)
                  if (bodyStr.includes(mutation.tempId)) {
                    let modified = false
                    // Si contiene el ID temporal, intentar filtrar
                    if (Array.isArray(subMutation.body.beneficiaryIds)) {
                      subMutation.body.beneficiaryIds = subMutation.body.beneficiaryIds.filter((id: string) => id !== mutation.tempId)
                      bodyStr = JSON.stringify(subMutation.body)
                      modified = true
                    }
                    // Si tiene el tempId en otro campo del body o si ya se filtró, actualizar
                    if (bodyStr.includes(mutation.tempId)) {
                      bodyStr = bodyStr.replaceAll(mutation.tempId, "deleted-offline")
                      subMutation.body = JSON.parse(bodyStr)
                      modified = true
                    }
                    if (modified) {
                      await updateMutation(subMutation)
                    }
                  }
                }
              }
            }
            
            syncCompletedAny = true
            // Despachar evento para alertar al banner que hay cambios fallidos
            window.dispatchEvent(new Event('offline-failed-mutations-updated'))
            continue
          } else {
            // 500 u otros errores temporales de servidor
            break
          }
        }
      } catch (err) {
        console.error('[PWA Sync] Error de conexión durante sincronización:', err)
        break
      }
    }

    // Actualizar contadores locales
    updateLocalCounters()

    // Despachar evento para actualizar el banner
    window.dispatchEvent(new Event('offline-mutations-updated'))

    // Si se sincronizó al menos una mutación exitosamente, recargamos la página para refrescar los datos frescos
    if (syncCompletedAny) {
      console.log('[PWA Sync] Recargando datos de la interfaz para reflejar base de datos remota.')
      window.location.reload()
    }
  }

  useEffect(() => {
    // Detectar pérdida de datos en el almacenamiento local
    detectDataLoss()

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
