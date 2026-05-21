import { Router, Response } from 'express'
import { requireAuth } from '../../lib/middleware/auth'
import { AuthError } from './errors'
import { login, register, getMe } from './service'

const authRouter = Router()

function handleError(error: unknown, response: Response) {
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

authRouter.post('/login', async (request, response) => {
  try {
    const result = await login(request.body)
    response.json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

authRouter.post('/register', async (request, response) => {
  try {
    const result = await register(request.body)
    response.status(201).json({ ok: true, ...result })
  } catch (error) {
    handleError(error, response)
  }
})

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

export { authRouter }
