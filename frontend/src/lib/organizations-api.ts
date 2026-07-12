import { Organization, OrganizationFormValues, OrganizationStatus } from '@/types/organization'

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'

const CACHE_PREFIX = 'api-cache:'

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

function readCache<T>(cacheKey: string): { ts: number; payload: T } | null {
  try {
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null
    return JSON.parse(cached) as { ts: number; payload: T }
  } catch {
    return null
  }
}

function writeCache(cacheKey: string, payload: unknown) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }))
  } catch {}
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

async function apiRequest<T>(path: string, init?: RequestInit) {
  const url = `${apiBaseUrl}${path}`
  const method = (init?.method ?? 'GET').toUpperCase()
  const cacheKey = `${CACHE_PREFIX}${path}`

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
      if (response.status === 401) handleUnauthorized()
      throw new Error(payload?.message ?? 'No se pudo completar la solicitud.')
    }

    if (method === 'GET') writeCache(cacheKey, payload)
    return payload
  } catch (err) {
    if (method === 'GET') {
      const cached = readCache<{ message?: string; item?: T; items?: T[] }>(cacheKey)
      if (cached) return cached.payload
    }
    throw err
  }
}

export async function listOrganizations() {
  const payload = await apiRequest<Organization>('/api/organizations')
  return payload?.items ?? []
}

export async function getOrganization(slug: string) {
  const payload = await apiRequest<Organization>(`/api/organizations/${slug}`)
  return payload?.item ?? null
}

export async function createOrganization(values: OrganizationFormValues) {
  const payload = await apiRequest<Organization>('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(values),
  })

  return payload?.item ?? null
}

export async function updateOrganization(slug: string, values: OrganizationFormValues) {
  const payload = await apiRequest<Organization>(`/api/organizations/${slug}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  })

  return payload?.item ?? null
}

export async function updateOrganizationStatus(
  slug: string,
  status: OrganizationStatus,
) {
  const payload = await apiRequest<Organization>(`/api/organizations/${slug}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

  return payload?.item ?? null
}

export interface TenantStockRecord {
  ollaName: string
  ollaId: string
  supplyItemId: string
  supplyItemName: string
  categoryName: string
  quantity: number
  unit: string
  updatedAt: string
}

export interface TenantMovementRecord {
  id: string
  ollaName: string
  ollaId: string
  supplyItemName: string
  unit: string
  movementType: string
  quantity: number
  movementDate: string
  notes: string | null
  sourceName: string | null
  createdByName: string
}

export async function getTenantInventoryStock() {
  const payload = await apiRequest<TenantStockRecord>('/api/organizations/inventory/stock')
  return payload?.items ?? []
}

export async function getTenantInventoryMovements() {
  const payload = await apiRequest<TenantMovementRecord>('/api/organizations/inventory/movements')
  return payload?.items ?? []
}

export interface TenantAlertRecord {
  id: string
  ollaName: string
  ollaId: string | null
  alertType: string
  severity: string
  message: string
  status: string
  detectedAt: string
  resolvedAt: string | null
}

export async function getTenantAlerts() {
  const payload = await apiRequest<TenantAlertRecord>('/api/organizations/alerts')
  return payload?.items ?? []
}

export async function updateTenantAlert(id: string, status: string) {
  const payload = await apiRequest<TenantAlertRecord>(`/api/organizations/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
  return payload?.item ?? null
}


