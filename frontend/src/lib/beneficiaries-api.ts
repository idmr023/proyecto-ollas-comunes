import { Beneficiary, BeneficiaryFormValues, HealthCondition } from '@/types/beneficiary'

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

async function apiRequest<T>(path: string, init?: RequestInit) {
  const url = `${apiBaseUrl}${path}`

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
    if (response.status === 401) {
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

  return payload
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
