import { Organization, OrganizationFormValues, OrganizationStatus } from '@/types/organization'

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'

async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
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

  return payload
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
