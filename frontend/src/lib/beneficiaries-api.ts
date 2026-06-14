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

    // Actualizar la caché del listado general
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

    // Despachar evento para alertar al banner que hay cambios en la cola
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
  const isGet = !init || !init.method || init.method.toUpperCase() === 'GET'
  const isOffline = typeof window !== 'undefined' && (!navigator.onLine)

  if (isOffline) {
    if (isGet) {
      const cached = await getCache<any>(path)
      if (cached) {
        console.log('[Offline API] Sirviendo caché local de IndexedDB para:', path)
        return cached
      }
      throw new Error('Sin conexión. No hay datos locales guardados para esta vista.')
    } else {
      return await handleOfflineMutation(path, init)
    }
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    })

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; item?: T; items?: T[] }
      | null

    if (!response.ok) {
      if (response.status === 401 && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const store = JSON.parse(localStorage.getItem('auth-storage') ?? '{}')
          if (store.state?.isAuthenticated) {
            localStorage.removeItem('auth-storage')
            window.location.href = '/login'
          }
        } catch {}
      }
      throw new Error(payload?.message ?? 'No se pudo completar la solicitud.')
    }

    if (isGet && payload) {
      await setCache(path, payload)
    }

    return payload
  } catch (err: any) {
    if (isGet) {
      const cached = await getCache<any>(path)
      if (cached) {
        console.log('[Offline API] Fallo de red. Sirviendo caché de:', path)
        return cached
      }
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
  const path = `/api/beneficiaries${qs ? `?${qs}` : ''}`
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
