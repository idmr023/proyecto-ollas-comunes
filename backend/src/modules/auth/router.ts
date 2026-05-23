import { Router, Response } from 'express'
import { requireAuth } from '../../lib/middleware/auth'
import { AuthError } from './errors'
import { login, register, getMe, verifyOtp, loginWithGoogle, loginWithGoogleCode } from './service'
import { getGoogleOAuthUrl } from './google-oauth'
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
    ...(process.env.NODE_ENV !== 'production' ? { detail: String(error) } : {}),
  })
}

// POST /api/auth/login — Step 1: email + password → MFA_PENDING
authRouter.post('/login', async (request, response) => {
  try {
    const result = await login(request.body)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

// POST /api/auth/verify-otp — Step 2: OTP code → JWT
authRouter.post('/verify-otp', async (request, response) => {
  try {
    const result = await verifyOtp(request.body)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

// POST /api/auth/register — Create new user
authRouter.post('/register', async (request, response) => {
  try {
    const result = await register(request.body)
    response.status(201).json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

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

// GET /api/auth/google/url — Get Google OAuth URL
authRouter.get('/google/url', async (_request, response) => {
  try {
    const url = getGoogleOAuthUrl()
    response.json({ ok: true, url })
  } catch (error) {
    handleError(error, response)
  }
})

// POST /api/auth/google — Verify Google ID token (via GIS) and return JWT
authRouter.post('/google', async (request, response) => {
  try {
    const result = await loginWithGoogle(request.body.credential)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

// POST /api/auth/google/callback — Exchange Google code for JWT (Supabase flow)
authRouter.post('/google/callback', async (request, response) => {
  try {
    const result = await loginWithGoogleCode(request.body.code)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

export { authRouter }
