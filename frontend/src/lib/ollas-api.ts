import { Olla, OllaFormValues } from '@/types/olla'
import { apiFetch } from './http'
import { handleUnauthorized } from './session'

async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await apiFetch(path, { ...init, cache: 'no-store' })

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; item?: T; items?: T[] }
    | null

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized()
    throw new Error(payload?.message ?? 'No se pudo completar la solicitud.')
  }

  return payload
}

export async function listOllas(slug: string) {
  const payload = await apiRequest<Olla>(`/api/organizations/${slug}/ollas`)
  return payload?.items ?? []
}

export async function createOlla(slug: string, values: OllaFormValues) {
  const payload = await apiRequest<Olla>(`/api/organizations/${slug}/ollas`, {
    method: 'POST',
    body: JSON.stringify(values),
  })
  return payload?.item ?? null
}
