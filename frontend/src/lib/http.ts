/**
 * Cliente HTTP compartido.
 *
 * La sesión viaja en una cookie `httpOnly` que el navegador adjunta solo. El
 * token ya no se lee de `sessionStorage`, así que no hay cabecera
 * `Authorization` que construir: basta con `credentials: 'include'`.
 *
 * Las peticiones van al mismo origen (`/api/...`) y un rewrite de Next las
 * reenvía al backend. Ver el comentario en `next.config.ts`.
 */

/**
 * Vacío a propósito: mismo origen. Definir `NEXT_PUBLIC_API_URL` apuntando a
 * otro dominio rompería la cookie de sesión, que es de origen propio.
 */
export const apiBaseUrl = ''

export function buildUrl(path: string): string {
  return `${apiBaseUrl}${path}`
}

/** Opciones comunes: sin ellas el navegador no adjunta la cookie de sesión. */
export function withCredentials(init?: RequestInit): RequestInit {
  return {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  }
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(buildUrl(path), withCredentials(init))
}
