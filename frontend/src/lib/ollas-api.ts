import { Olla, OllaFormValues } from '@/types/olla'

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'

function getAuthHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem('auth-storage')
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
        const store = JSON.parse(sessionStorage.getItem('auth-storage') ?? '{}')
        if (store.state?.isAuthenticated) {
          sessionStorage.removeItem('auth-storage')
          window.location.href = '/login'
        }
      } catch {}
    }
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
