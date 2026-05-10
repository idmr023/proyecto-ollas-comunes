import { Organization, OrganizationFormValues, OrganizationStatus } from '@/types/organization'

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'

const CACHE_PREFIX = 'api-cache:'

async function apiRequest<T>(path: string, init?: RequestInit) {
  const url = `${apiBaseUrl}${path}`
  const method = (init?.method ?? 'GET').toUpperCase()
  const cacheKey = `${CACHE_PREFIX}${path}`

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    })

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; item?: T; items?: T[] }
      | null

    if (!response.ok) {
      throw new Error(payload?.message ?? 'No se pudo completar la solicitud.')
    }

    // Cache GET responses (simple localStorage cache). Use IndexedDB for production.
    if (method === 'GET') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }))
      } catch {}
    }

    return payload
  } catch (err) {
    // On network error, return cached GET if available
    if (method === 'GET') {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached) as { ts: number; payload: any }
          return parsed.payload
        }
      } catch {}
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
