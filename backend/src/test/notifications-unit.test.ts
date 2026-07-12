import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/prisma', () => ({
  prisma: {
    failedSyncBackup: {
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('../lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '../lib/prisma'
import { sendEmail } from '../lib/email'
import { backupMutation, reportDataLoss, processAndNotifyFailedMutations } from '../modules/notifications/service'
import { notificationsRouter } from '../modules/notifications/router'

const failedSyncBackupCreate = vi.mocked(prisma.failedSyncBackup.create)
const failedSyncBackupFindMany = vi.mocked(prisma.failedSyncBackup.findMany)
const failedSyncBackupUpdateMany = vi.mocked(prisma.failedSyncBackup.updateMany)
const sendEmailMock = vi.mocked(sendEmail)

beforeEach(() => {
  vi.resetAllMocks()
  sendEmailMock.mockResolvedValue(undefined)
})

describe('backupMutation', () => {
  it('persists a failedSyncBackup row', async () => {
    failedSyncBackupCreate.mockResolvedValue({} as any)
    await backupMutation({
      path: '/api/foo',
      method: 'POST',
      body: { a: 1 },
      errorMessage: 'boom',
      status: 500,
      originalTimestamp: Date.now(),
    })
    expect(failedSyncBackupCreate).toHaveBeenCalled()
    const arg = failedSyncBackupCreate.mock.calls[0][0]
    expect(arg.data.path).toBe('/api/foo')
    expect(arg.data.method).toBe('POST')
    expect(arg.data.status).toBe(500)
    expect(arg.data.originalTimestamp).toBeInstanceOf(Date)
  })
})

describe('reportDataLoss', () => {
  it('calls sendEmail with a subject and body that includes pendingCount/failedCount', async () => {
    await reportDataLoss({
      pendingCount: 3,
      failedCount: 2,
      message: 'something bad',
    })
    expect(sendEmailMock).toHaveBeenCalledOnce()
    const arg = sendEmailMock.mock.calls[0][0]
    expect(arg.subject).toContain('3 pendientes')
    expect(arg.subject).toContain('2 fallos')
    expect(arg.text).toContain('something bad')
  })
})

describe('processAndNotifyFailedMutations', () => {
  it('does nothing when there are no pending rows', async () => {
    failedSyncBackupFindMany.mockResolvedValue([])
    await processAndNotifyFailedMutations()
    expect(sendEmailMock).not.toHaveBeenCalled()
    expect(failedSyncBackupUpdateMany).not.toHaveBeenCalled()
  })

  it('sends an email and marks rows as emailSent when there are pending', async () => {
    failedSyncBackupFindMany.mockResolvedValue([
      { id: 'r1', method: 'POST', path: '/api/foo', errorMessage: 'X', originalTimestamp: new Date() },
    ] as any)
    failedSyncBackupUpdateMany.mockResolvedValue({ count: 1 })
    await processAndNotifyFailedMutations()
    expect(sendEmailMock).toHaveBeenCalledOnce()
    expect(failedSyncBackupUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['r1'] } },
      data: { emailSent: true },
    })
  })
})

describe('notificationsRouter', () => {
  function makeRes() {
    const res: any = {
      statusCode: 200,
      body: undefined as any,
      status(code: number) { this.statusCode = code; return this },
      json(payload: unknown) { this.body = payload; return this },
    }
    return res
  }

  function getHandler(path: string) {
    const layer = notificationsRouter.stack.find((l: any) => l.route?.path === path)
    if (!layer) throw new Error(`route not found: ${path}`)
    const stack = layer.route.stack
    return stack[stack.length - 1].handle
  }

  it('POST /backup-mutation returns 200 on success', async () => {
    failedSyncBackupCreate.mockResolvedValue({} as any)
    const req = { body: { path: '/a', method: 'POST', body: {}, originalTimestamp: Date.now() } } as any
    const res = makeRes()
    await getHandler('/backup-mutation')(req, res, () => undefined)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('POST /backup-mutation returns 500 on error', async () => {
    failedSyncBackupCreate.mockRejectedValue(new Error('boom'))
    const req = { body: { path: '/a', method: 'POST', body: {}, originalTimestamp: Date.now() } } as any
    const res = makeRes()
    await getHandler('/backup-mutation')(req, res, () => undefined)
    expect(res.statusCode).toBe(500)
  })

  it('POST /report-data-loss returns 200 on success', async () => {
    const req = { body: { pendingCount: 0, failedCount: 0, message: 'x' } } as any
    const res = makeRes()
    await getHandler('/report-data-loss')(req, res, () => undefined)
    expect(res.statusCode).toBe(200)
  })

  it('POST /report-data-loss returns 500 on error', async () => {
    sendEmailMock.mockRejectedValue(new Error('boom'))
    const req = { body: { pendingCount: 0, failedCount: 0, message: 'x' } } as any
    const res = makeRes()
    await getHandler('/report-data-loss')(req, res, () => undefined)
    expect(res.statusCode).toBe(500)
  })
})
