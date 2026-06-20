import { prisma } from '../../lib/prisma'

export class NotificationsServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'NotificationsServiceError'
  }
}

export async function reportDataLoss(payload: {
  userId: string
  pendingCount: number
  failedCount: number
  message: string
}) {
  await (prisma as any).failedSyncBackup.create({
    data: {
      userId: payload.userId,
      path: '/pwa/data-loss-report',
      method: 'POST',
      body: {
        pendingCount: payload.pendingCount,
        failedCount: payload.failedCount,
        detectedAt: new Date().toISOString(),
      },
      errorMessage: payload.message,
      status: 'reported',
    },
  })

  console.warn(
    `[notifications] Data loss report: pendientes=${payload.pendingCount}, fallidos=${payload.failedCount}`,
  )
}

export async function backupFailedMutation(payload: {
  userId: string
  path: string
  method: string
  body: unknown
  errorMessage: string
  statusCode: number
}) {
  const db: any = prisma

  await db.failedSyncBackup.create({
    data: {
      userId: payload.userId,
      path: payload.path,
      method: payload.method,
      body: payload.body || {},
      errorMessage: payload.errorMessage,
      status: payload.statusCode >= 500 ? 'pending_retry' : 'failed',
      reportedAt: new Date(),
    },
  })

  console.warn(
    `[notifications] Backed up failed mutation: ${payload.method} ${payload.path} (${payload.statusCode})`,
  )
}
