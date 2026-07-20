import { Router } from 'express'
import { requireAuth, requireRole } from '../../lib/middleware/auth'
import { validate } from '../../lib/middleware/validate'
import { PERMISSIONS } from '../../lib/permissions'
import { backupMutation, reportDataLoss } from './service'
import { backupMutationSchema, reportDataLossSchema } from './validators'

const notificationsRouter = Router()

notificationsRouter.post(
  '/backup-mutation',
  requireAuth,
  requireRole(...PERMISSIONS.notifications.backup),
  validate(backupMutationSchema),
  async (request, response) => {
    try {
      await backupMutation(request.body)
      response.json({ ok: true })
    } catch (error) {
      console.error('[notifications] Error en backup-mutation:', error)
      response.status(500).json({ ok: false, message: 'Error interno del servidor.' })
    }
  },
)

notificationsRouter.post(
  '/report-data-loss',
  requireAuth,
  requireRole(...PERMISSIONS.notifications.reportDataLoss),
  validate(reportDataLossSchema),
  async (request, response) => {
    try {
      await reportDataLoss(request.body)
      response.json({ ok: true })
    } catch (error) {
      console.error('[notifications] Error en report-data-loss:', error)
      response.status(500).json({ ok: false, message: 'Error interno del servidor.' })
    }
  },
)

export { notificationsRouter }
