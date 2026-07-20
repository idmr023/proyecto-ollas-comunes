import { Router, Response } from 'express'
import { requireAuth, requireRole } from '../../lib/middleware/auth'
import { PERMISSIONS } from '../../lib/permissions'
import { debugDetail } from '../../lib/debug'
import { clearSessionCookie, setSessionCookie } from '../../lib/auth-cookie'
import { AuthError } from './errors'
import { login, register, getMe, verifyOtp, updateProfile, setupTotp } from './service'
import { ZodError } from 'zod'

const authRouter = Router()

function handleError(error: unknown, response: Response) {
  if (error instanceof ZodError) {
    const first = error.errors[0]
    response.status(400).json({
      ok: false,
      message: first?.message ?? 'Datos de entrada invalidos.',
    })
    return
  }

  if (error instanceof AuthError) {
    response.status(error.statusCode).json({ ok: false, message: error.message })
    return
  }

  console.error('[auth] Error inesperado:', error)
  response.status(500).json({
    ok: false,
    message: 'Error interno del servidor.',
    ...debugDetail(error),
  })
}

// POST /api/auth/login — email + password → TOTP setup / MFA_PENDING
authRouter.post('/login', async (request, response) => {
  try {
    const result = await login(request.body)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

// POST /api/auth/totp/setup — recibe el tempToken del paso 1 y genera/persiste
// el TOTP secret en BD, devolviendo el QR. Es idempotente.
authRouter.post('/totp/setup', async (request, response) => {
  try {
    const result = await setupTotp(request.body)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

// POST /api/auth/verify-otp — TOTP code → sesion
authRouter.post('/verify-otp', async (request, response) => {
  try {
    const result = await verifyOtp(request.body)

    // La sesion del cliente web viaja en cookie httpOnly. El token sigue en el
    // cuerpo para los clientes que no usan cookies (app movil nativa); el
    // frontend web lo ignora y no lo persiste en ningun almacen accesible a JS.
    setSessionCookie(response, result.token)

    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

// POST /api/auth/logout — invalida la sesion del navegador.
// No requiere sesion valida: cerrar sesion con un token ya expirado debe
// limpiar la cookie igualmente en lugar de devolver 401.
authRouter.post('/logout', (_request, response) => {
  clearSessionCookie(response)
  response.json({ ok: true })
})

// POST /api/auth/register — Alta de usuario dentro de la organizacion del
// solicitante. No es un registro publico: exige sesion y rol administrativo,
// y el tenant se deriva del token (nunca del body).
authRouter.post(
  '/register',
  requireAuth,
  requireRole(...PERMISSIONS.users.create),
  async (request, response) => {
    try {
      const actor = {
        tenantId: request.user!.tenantId,
        role: request.user!.role,
      }
      const result = await register(actor, request.body)
      response.status(201).json({ ok: true, ...result })
    } catch (error) {
      handleError(error, response)
    }
  },
)

// GET /api/auth/me — Current user info
authRouter.get('/me', requireAuth, async (request, response) => {
  try {
    const user = await getMe(request.user!.userId)
    if (!user) {
      response.status(404).json({ ok: false, message: 'Usuario no encontrado.' })
      return
    }
    response.json({ ok: true, user })
  } catch (error) {
    handleError(error, response)
  }
})

// PATCH /api/auth/profile — Update current user profile
authRouter.patch('/profile', requireAuth, async (request, response) => {
  try {
    const result = await updateProfile(request.user!.userId, request.body)

    // El perfil reemite el JWT (cambia email/nombre): la cookie debe seguirlo,
    // o el navegador quedaria con una sesion desincronizada hasta expirar.
    setSessionCookie(response, result.token)

    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

export { authRouter }
