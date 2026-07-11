import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'

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

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    response.status(401).json({ ok: false, message: 'Token no proporcionado.' })
    return
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    request.user = payload
    next()
  } catch {
    response.status(401).json({ ok: false, message: 'Token invalido o expirado.' })
  }
}

export function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization

  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7)
    try {
      request.user = jwt.verify(token, JWT_SECRET) as AuthPayload
    } catch {
      // token invalido, simplemente no hay user
    }
  }

  next()
}
