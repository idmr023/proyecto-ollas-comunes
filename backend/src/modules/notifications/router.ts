import { Router } from 'express'
import { requireAuth } from '../../lib/middleware/auth'
import { backupMutation, reportDataLoss } from './service'

const notificationsRouter = Router()

notificationsRouter.post('/backup-mutation', requireAuth, async (request, response) => {
  try {
    await backupMutation(request.body)
    response.json({ ok: true })
  } catch (error) {
    console.error('[notifications] Error en backup-mutation:', error)
    response.status(500).json({ ok: false, message: 'Error interno del servidor.' })
  }
})

notificationsRouter.post('/report-data-loss', requireAuth, async (request, response) => {
  try {
    await reportDataLoss(request.body)
    response.json({ ok: true })
  } catch (error) {
    console.error('[notifications] Error en report-data-loss:', error)
    response.status(500).json({ ok: false, message: 'Error interno del servidor.' })
  }
})

export { notificationsRouter }
