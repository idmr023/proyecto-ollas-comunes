import { Router } from 'express'
import { requireAuth } from '../../lib/middleware/auth'

const notificationsRouter = Router()

notificationsRouter.get('/health', (_request, response) => {
  response.json({ ok: true, module: 'notifications' })
})

export { notificationsRouter }
