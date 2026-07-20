import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { userContextStorage } from '../user-context'
import { JWT_SECRET, isUuid } from '../config/secrets'
import { readSessionCookie } from '../auth-cookie'

export interface AuthPayload {
  userId: string
  email: string
  tenantId: string
  role: string
  fullName: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

/**
 * Un token con firma valida puede aun asi traer un payload malformado (p. ej.
 * emitido por una version anterior). Se valida antes de propagarlo al contexto,
 * porque userId acaba en una sentencia SQL y tenantId gobierna el aislamiento.
 */
function isValidPayload(payload: unknown): payload is AuthPayload {
  if (!payload || typeof payload !== 'object') return false
  const candidate = payload as Record<string, unknown>
  return (
    isUuid(candidate.userId) &&
    isUuid(candidate.tenantId) &&
    typeof candidate.role === 'string' &&
    candidate.role.length > 0
  )
}

/**
 * Extrae el token de la cookie de sesion o, en su defecto, del encabezado
 * `Authorization`.
 *
 * La cookie es el mecanismo del cliente web. El `Bearer` se mantiene para los
 * clientes que no pueden usar cookies: la app movil nativa y las pruebas de
 * integracion. La cookie tiene prioridad para que una cabecera manipulada no
 * pueda desplazar a una sesion legitima.
 */
function extractToken(request: Request): string | null {
  const fromCookie = readSessionCookie(request)
  if (fromCookie) return fromCookie

  const header = request.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)

  return null
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = extractToken(request)

  if (!token) {
    response.status(401).json({ ok: false, message: 'Token no proporcionado.' })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)

    if (!isValidPayload(payload)) {
      response.status(401).json({ ok: false, message: 'Token invalido o expirado.' })
      return
    }

    request.user = payload
    userContextStorage.run({ userId: payload.userId }, () => {
      next()
    })
  } catch {
    response.status(401).json({ ok: false, message: 'Token invalido o expirado.' })
  }
}

/**
 * Restringe una ruta a un conjunto explicito de roles.
 * Sustituye los condicionales dispersos por una decision declarativa.
 */
export function requireRole(...allowed: string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const role = request.user?.role

    if (!role) {
      response.status(401).json({ ok: false, message: 'Token no proporcionado.' })
      return
    }

    if (!allowed.includes(role)) {
      response.status(403).json({
        ok: false,
        message: 'No tienes permisos para realizar esta accion.',
      })
      return
    }

    next()
  }
}

export function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const token = extractToken(request)

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      if (isValidPayload(payload)) {
        request.user = payload
        userContextStorage.run({ userId: payload.userId }, () => {
          next()
        })
        return
      }
    } catch {
      // token invalido, simplemente no hay user
    }
  }

  next()
}
