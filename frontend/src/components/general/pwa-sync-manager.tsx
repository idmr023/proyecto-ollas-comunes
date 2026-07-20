"use client"

import { useEffect } from 'react'
import { getMutations, deleteMutation, updateMutation, addFailedMutation, getFailedMutations } from '@/lib/indexed-db'
import type { OfflineMutation } from '@/lib/indexed-db'
import { apiFetch } from '@/lib/http'

const LS_MUTATION_COUNT = 'pwa-pending-mutation-count'
const LS_FAILED_COUNT = 'pwa-failed-mutation-count'

/**
 * La sesion viaja en la cookie `httpOnly`, que el navegador adjunta sola. Ya no
 * hay token que leer, asi que lo unico comprobable desde aqui es si la interfaz
 * cree tener sesion; el backend responde 401 si no la hay.
 */
function hasSession(): boolean {
  try {
    const raw = sessionStorage.getItem('auth-storage')
    if (!raw) return false
    return Boolean(JSON.parse(raw).state?.isAuthenticated)
  } catch {
    return false
  }
}

async function detectDataLoss() {
  if (typeof window === 'undefined') return
  const prevPending = Number.parseInt(localStorage.getItem(LS_MUTATION_COUNT) || '0', 10)
  const prevFailed = Number.parseInt(localStorage.getItem(LS_FAILED_COUNT) || '0', 10)
  if (prevPending === 0 && prevFailed === 0) return

  const mutations = await getMutations()
  const failed = await getFailedMutations()
  const currentPending = mutations.length
  const currentFailed = failed.length

  const lostPending = Math.max(0, prevPending - currentPending)
  const lostFailed = Math.max(0, prevFailed - currentFailed)

  if (lostPending > 0 || lostFailed > 0) {
    console.warn('[PWA Sync] Datos perdidos detectados:', { lostPending, lostFailed })
    if (hasSession()) {
      try {
        await apiFetch('/api/notifications/report-data-loss', {
          method: 'POST',
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
  if (!hasSession()) return
  try {
    await apiFetch('/api/notifications/backup-mutation', {
      method: 'POST',
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

async function rewriteDependentMutations(
  mutations: OfflineMutation[],
  startIndex: number,
  tempId: string,
  realId: string
): Promise<void> {
  for (let j = startIndex; j < mutations.length; j++) {
    const sub = mutations[j]
    let modified = false

    if (sub.path.includes(tempId)) {
      sub.path = sub.path.replaceAll(tempId, realId)
      modified = true
    }
    if (sub.body) {
      const bodyStr = JSON.stringify(sub.body)
      if (bodyStr.includes(tempId)) {
        sub.body = JSON.parse(bodyStr.replaceAll(tempId, realId))
        modified = true
      }
    }
    if (modified) await updateMutation(sub)
  }
}

async function shouldDiscardByPath(
  mutation: OfflineMutation,
  failedTempId: string
): Promise<boolean> {
  return (
    mutation.path.includes(failedTempId) &&
    (mutation.method === 'PATCH' || mutation.method === 'DELETE')
  )
}

async function discardDependentMutation(
  mutation: OfflineMutation,
  reason: string
): Promise<void> {
  await addFailedMutation(mutation, reason, 400)
  await deleteMutation(mutation.id!)
}

async function scrubBodyReference(
  mutation: OfflineMutation,
  failedTempId: string
): Promise<void> {
  if (!mutation.body) return
  if (!JSON.stringify(mutation.body).includes(failedTempId)) return

  let modified = false
  if (Array.isArray(mutation.body.beneficiaryIds)) {
    mutation.body.beneficiaryIds = mutation.body.beneficiaryIds.filter(
      (id: string) => id !== failedTempId
    )
    modified = true
  }
  if (JSON.stringify(mutation.body).includes(failedTempId)) {
    mutation.body = JSON.parse(
      JSON.stringify(mutation.body).replaceAll(failedTempId, 'deleted-offline')
    )
    modified = true
  }
  if (modified) await updateMutation(mutation)
}

async function discardDependentMutations(
  mutations: OfflineMutation[],
  startIndex: number,
  failedTempId: string,
  reason: string
): Promise<void> {
  for (let j = startIndex; j < mutations.length; j++) {
    const sub = mutations[j]
    if (await shouldDiscardByPath(sub, failedTempId)) {
      await discardDependentMutation(sub, reason)
      mutations.splice(j, 1)
      j--
      continue
    }
    await scrubBodyReference(sub, failedTempId)
  }
}

type FailedHandlingResult = { retryable: boolean; progressed: boolean }

async function handleFailedMutation(
  mutation: OfflineMutation,
  res: Response,
  mutations: OfflineMutation[],
  i: number
): Promise<FailedHandlingResult> {
  if (res.status === 401 || res.status === 403) {
    console.warn('[PWA Sync] Error de autenticación. Deteniendo sincronización.')
    window.dispatchEvent(new Event('pwa-sync-auth-required'))
    return { retryable: false, progressed: false }
  }

  if (res.status < 400 || res.status >= 500) {
    return { retryable: true, progressed: false }
  }

  const errBody = await res.json().catch(() => ({}))
  const errMsg = errBody.message || `Error del servidor (${res.status})`
  console.error('[PWA Sync] Error lógico descartable:', errMsg)

  await addFailedMutation(mutation, errMsg, res.status)
  await deleteMutation(mutation.id!)
  backupMutationToServer({ ...mutation, errorMessage: errMsg, status: res.status })

  if (mutation.tempId) {
    console.warn(`[PWA Sync] Limpieza en cascada para ${mutation.tempId} fallido...`)
    await discardDependentMutations(
      mutations,
      i + 1,
      mutation.tempId,
      'Cancelado por error en cascada: No se pudo registrar el beneficiario original.'
    )
  }

  window.dispatchEvent(new Event('offline-failed-mutations-updated'))
  return { retryable: false, progressed: true }
}

async function executeMutationRequest(mutation: OfflineMutation): Promise<Response | null> {
  try {
    return await apiFetch(mutation.path, {
      method: mutation.method,
      body: mutation.body ? JSON.stringify(mutation.body) : undefined,
    })
  } catch (err) {
    console.error('[PWA Sync] Error de conexión durante sincronización:', err)
    return null
  }
}

async function extractRealId(res: Response): Promise<string | null> {
  const data = await res.json().catch(() => ({}))
  return data.item?.id || data.delivery?.id || data.movement?.id || null
}

async function processSuccess(
  mutation: OfflineMutation,
  res: Response,
  mutations: OfflineMutation[],
  currentIndex: number,
): Promise<boolean> {
  console.log('[PWA Sync] Sincronizado con éxito:', mutation.method, mutation.path)
  const realId = await extractRealId(res)

  if (realId && mutation.tempId) {
    console.log(`[PWA Sync] Reescritura de IDs: Reemplazando ${mutation.tempId} por ${realId}`)
    await rewriteDependentMutations(mutations, currentIndex + 1, mutation.tempId, realId)
  }

  await deleteMutation(mutation.id!)
  return true
}

async function processFailure(
  mutation: OfflineMutation,
  res: Response,
  mutations: OfflineMutation[],
  currentIndex: number,
): Promise<{ retryable: boolean; progressed: boolean }> {
  console.warn('[PWA Sync] Error del servidor en mutación:', mutation.id, res.status)
  return await handleFailedMutation(mutation, res, mutations, currentIndex)
}

export default function PwaSyncManager() {
  const syncOfflineMutations = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    const mutations = await getMutations()
    if (mutations.length === 0) return

    console.log('[PWA Sync] Iniciando sincronización de', mutations.length, 'cambios en cola...')

    let syncCompletedAny = false

    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i]
      const res = await executeMutationRequest(mutation)
      if (res === null) break

      if (res.ok) {
        syncCompletedAny = await processSuccess(mutation, res, mutations, i)
        continue
      }

      const { retryable, progressed } = await processFailure(mutation, res, mutations, i)
      if (retryable) break
      if (progressed) syncCompletedAny = true
    }

    updateLocalCounters()
    window.dispatchEvent(new Event('offline-mutations-updated'))

    if (syncCompletedAny) {
      console.log('[PWA Sync] Despachando evento pwa-sync-completed para actualizar datos reactivamente.')
      window.dispatchEvent(new Event('pwa-sync-completed'))
    }
  }

  useEffect(() => {
    detectDataLoss()
    syncOfflineMutations()
    window.addEventListener('online', syncOfflineMutations)

    return () => {
      window.removeEventListener('online', syncOfflineMutations)
    }
  }, [])

  return null
}
