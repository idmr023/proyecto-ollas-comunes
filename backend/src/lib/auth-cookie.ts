import { Request, Response } from 'express'

/**
 * Sesion transportada en cookie `httpOnly`, inaccesible desde JavaScript.
 *
 * Antes el JWT vivia en `sessionStorage`, de donde cualquier XSS podia leerlo.
 * Una cookie `httpOnly` no elimina el XSS, pero impide que se lleve la sesion.
 */
export const SESSION_COOKIE_NAME = 'sigo_session'

/** Debe coincidir con la expiracion del JWT para no dejar cookies muertas. */
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

const isProduction = process.env.NODE_ENV === 'production'

function cookieOptions() {
  return {
    httpOnly: true,
    // En produccion la cookie solo viaja por HTTPS. En local se permite HTTP
    // porque el desarrollo no usa TLS.
    secure: isProduction,
    /**
     * `lax` y no `strict` de forma deliberada.
     *
     * `strict` retiene la cookie incluso en navegaciones de nivel superior, de
     * modo que abrir la app desde un enlace externo mostraria la pantalla de
     * login a un usuario con sesion valida. `lax` sigue reteniendola en las
     * peticiones cross-site que no son navegacion (el vector CSRF real).
     */
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  }
}

export function setSessionCookie(response: Response, token: string): void {
  response.cookie(SESSION_COOKIE_NAME, token, cookieOptions())
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined })
}

/**
 * Lee la cookie de sesion sin depender de `cookie-parser`.
 *
 * Es un unico encabezado con formato trivial; se evita asi sumar una
 * dependencia solo para esto.
 */
export function readSessionCookie(request: Request): string | null {
  const header = request.headers.cookie
  if (!header) return null

  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator === -1) continue

    const name = part.slice(0, separator).trim()
    if (name !== SESSION_COOKIE_NAME) continue

    return decodeURIComponent(part.slice(separator + 1).trim()) || null
  }

  return null
}
