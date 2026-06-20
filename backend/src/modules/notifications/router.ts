import { Router, Response } from 'express'
import {
  backupFailedMutation,
  reportDataLoss,
  NotificationsServiceError,
} from './service'

const notificationsRouter = Router()

function handleError(error: unknown, response: Response) {
  if (error instanceof NotificationsServiceError) {
    response.status(error.statusCode).json({ ok: false, message: error.message })
    return
  }

  console.error('[notifications] Error inesperado:', error)
  response.status(500).json({
    ok: false,
    message: 'Error interno del servidor.',
    ...(process.env.NODE_ENV !== 'production' ? { detail: String(error) } : {}),
  })
}

notificationsRouter.get('/health', (_request, response) => {
  response.json({ ok: true, module: 'notifications' })
})

notificationsRouter.post('/report-data-loss', async (request, response) => {
  try {
    const userId = request.user!.userId
    const { pendingCount, failedCount, message } = request.body

    await reportDataLoss({
      userId,
      pendingCount: Number(pendingCount) || 0,
      failedCount: Number(failedCount) || 0,
      message: typeof message === 'string' ? message : 'Pérdida de datos detectada en PWA.',
    })

    response.json({ ok: true, message: 'Reporte de pérdida de datos registrado.' })
  } catch (error) {
    handleError(error, response)
  }
})

notificationsRouter.post('/backup-mutation', async (request, response) => {
  try {
    const userId = request.user!.userId
    const { path, method, body, errorMessage, status } = request.body

    await backupFailedMutation({
      userId,
      path: typeof path === 'string' ? path : '/unknown',
      method: typeof method === 'string' ? method : 'POST',
      body: body || null,
      errorMessage: typeof errorMessage === 'string' ? errorMessage : 'Error de sincronización PWA.',
      statusCode: typeof status === 'number' ? status : 500,
    })

    response.json({ ok: true, message: 'Respaldo de mutación registrado.' })
  } catch (error) {
    handleError(error, response)
  }
})

export { notificationsRouter }
