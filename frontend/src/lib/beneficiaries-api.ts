import { Beneficiary, BeneficiaryFormValues, HealthCondition } from '@/types/beneficiary'
import { getCache, setCache, addMutation } from './indexed-db'

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

function buildRequestHeaders(init?: RequestInit): Record<string, string> {
  const initHeaders = init?.headers
  const customHeaders: Record<string, string> =
    initHeaders && typeof initHeaders === 'object' && !Array.isArray(initHeaders)
      ? (initHeaders as Record<string, string>)
      : {}
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...customHeaders,
  }
}

function handleUnauthorized() {
  try {
    const store = JSON.parse(localStorage.getItem('auth-storage') ?? '{}')
    if (store.state?.isAuthenticated) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
  } catch {}
}

function isGetRequest(init?: RequestInit): boolean {
  return !init || !init.method || init.method.toUpperCase() === 'GET'
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine
}

async function serveOfflineOrEnqueue<T>(path: string, init?: RequestInit, isGet = false) {
  if (isGet) {
    const cached = await getCache<T>(path)
    if (cached) {
      console.log('[Offline API] Sirviendo caché local de IndexedDB para:', path)
      return cached
    }
    throw new Error('Sin conexión. No hay datos locales guardados para esta vista.')
  }
  return await handleOfflineMutation(path, init)
}

async function tryCacheFallback(path: string): Promise<any | null> {
  const cached = await getCache<any>(path)
  if (cached) {
    console.log('[Offline API] Fallo de red. Sirviendo caché de:', path)
    return cached
  }
  return null
}

async function handleOfflineMutation(path: string, init?: RequestInit) {
  const method = (init?.method ?? 'POST').toUpperCase() as 'POST' | 'PATCH' | 'DELETE'
  const body = init?.body ? JSON.parse(init.body as string) : null
  console.log('[Offline API] Encolando cambio offline:', method, path, body)

  await addMutation(path, method, body)

  if (path.startsWith('/api/beneficiaries')) {
    const mockId = body?.id || `temp-${Math.floor(100000 + Math.random() * 900000)}`
    const newBeneficiary = {
      id: mockId,
      ...body,
      fullName: `${body?.firstName ?? ''} ${body?.lastName ?? ''}`.trim(),
      status: 'active',
      registeredAt: new Date().toISOString(),
      olla: null,
      ollaId: body?.ollaId || null,
      healthConditions: [],
      offline: true,
    }

    const cachedList = await getCache<any>('/api/beneficiaries')
    if (cachedList && Array.isArray(cachedList.items)) {
      let updatedItems = [...cachedList.items]
      if (method === 'POST') {
        updatedItems.unshift(newBeneficiary)
      } else if (method === 'PATCH') {
        const idToUpdate = path.split('/').pop()
        updatedItems = updatedItems.map(item => item.id === idToUpdate ? { ...item, ...body } : item)
      } else if (method === 'DELETE') {
        const idToDelete = path.split('/').pop()
        updatedItems = updatedItems.filter(item => item.id !== idToDelete)
      }
      await setCache('/api/beneficiaries', { ...cachedList, items: updatedItems })
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('offline-mutations-updated'))
    }

    return {
      message: 'Operación registrada localmente.',
      item: newBeneficiary,
    }
  }

  throw new Error('Operación registrada localmente.')
}

async function apiRequest<T>(path: string, init?: RequestInit) {
  const url = `${apiBaseUrl}${path}`
  const isGet = isGetRequest(init)

  if (!isOnline()) {
    return serveOfflineOrEnqueue<T>(path, init, isGet)
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: buildRequestHeaders(init),
      cache: 'no-store',
    })

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; item?: T; items?: T[] }
      | null

    if (!response.ok) {
      if (response.status === 401) handleUnauthorized()
      throw new Error(payload?.message ?? 'No se pudo completar la solicitud.')
    }

    if (isGet && payload) {
      await setCache(path, payload)
    }

    return payload
  } catch (err) {
    if (isGet) {
      const cached = await tryCacheFallback(path)
      if (cached) return cached
    } else {
      return await handleOfflineMutation(path, init)
    }
    throw err
  }
}

export async function listBeneficiaries(filters?: {
  query?: string
  ollaId?: string
  healthConditionId?: string
}) {
  const params = new URLSearchParams()
  if (filters?.query) params.set('query', filters.query)
  if (filters?.ollaId) params.set('ollaId', filters.ollaId)
  if (filters?.healthConditionId) params.set('healthConditionId', filters.healthConditionId)
  const qs = params.toString()
  const path = qs ? `/api/beneficiaries?${qs}` : '/api/beneficiaries'
  const payload = await apiRequest<Beneficiary>(path)
  return payload?.items ?? []
}

export async function getBeneficiary(id: string) {
  const payload = await apiRequest<Beneficiary>(`/api/beneficiaries/${id}`)
  return payload?.item ?? null
}

export async function createBeneficiary(values: BeneficiaryFormValues) {
  const payload = await apiRequest<Beneficiary>('/api/beneficiaries', {
    method: 'POST',
    body: JSON.stringify(values),
  })
  return payload?.item ?? null
}

export async function updateBeneficiary(id: string, values: BeneficiaryFormValues) {
  const payload = await apiRequest<Beneficiary>(`/api/beneficiaries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  })
  return payload?.item ?? null
}

export async function deleteBeneficiary(id: string) {
  const payload = await apiRequest<Beneficiary>(`/api/beneficiaries/${id}`, {
    method: 'DELETE',
  })
  return payload
}

export async function getHealthConditions() {
  const payload = await apiRequest<HealthCondition>('/api/beneficiaries/conditions')
  return payload?.items ?? []
}

export async function getOllasComunes() {
  const payload = await apiRequest<{ id: string; name: string }>('/api/beneficiaries/ollas')
  return payload?.items ?? []
}
