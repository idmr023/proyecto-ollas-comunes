import { prisma } from '../../lib/prisma'
import { sendEmail } from '../../lib/email'
import { BackupMutationInput, ReportDataLossInput } from './types'

const ADMIN_EMAIL_TO = 'jparatupcya@gmail.com'
const ADMIN_EMAIL_CC = 'francescorivar@gmail.com'

export async function backupMutation(input: BackupMutationInput): Promise<void> {
  await prisma.failedSyncBackup.create({
    data: {
      path: input.path,
      method: input.method,
      body: input.body as any,
      errorMessage: input.errorMessage ?? null,
      status: input.status ?? null,
      originalTimestamp: new Date(input.originalTimestamp),
    },
  })
}

export async function reportDataLoss(input: ReportDataLossInput): Promise<void> {
  const subject = `SIGO-Ollas: Datos perdidos en cliente (${input.pendingCount} pendientes, ${input.failedCount} fallos)`
  const text = [
    `Se ha detectado una posible pérdida de datos en un cliente offline.`,
    ``,
    `Mutaciones pendientes antes de la pérdida: ${input.pendingCount}`,
    `Fallos anteriores: ${input.failedCount}`,
    `Mensaje: ${input.message}`,
    ``,
    `Timestamp: ${new Date().toISOString()}`,
  ].join('\n')

  await sendEmail({
    to: ADMIN_EMAIL_TO,
    cc: ADMIN_EMAIL_CC,
    subject,
    text,
  })
}

export async function processAndNotifyFailedMutations(): Promise<void> {
  const pending = await prisma.failedSyncBackup.findMany({
    where: { emailSent: false },
    orderBy: { reportedAt: 'asc' },
    take: 50,
  })

  if (pending.length === 0) return

  const subject = `SIGO-Ollas: ${pending.length} respaldo(s) de mutaciones pendientes`

  const rows = pending.map((p) =>
    `  - [${p.method}] ${p.path} | Error: ${p.errorMessage ?? 'N/A'} | Timestamp: ${p.originalTimestamp.toISOString()}`
  ).join('\n')

  const text = [
    `Se encontraron ${pending.length} registro(s) de mutaciones que no pudieron completarse.`,
    ``,
    `Detalles:`,
    rows,
    ``,
    `Timestamp: ${new Date().toISOString()}`,
  ].join('\n')

  await sendEmail({
    to: ADMIN_EMAIL_TO,
    cc: ADMIN_EMAIL_CC,
    subject,
    text,
  })

  await prisma.failedSyncBackup.updateMany({
    where: { id: { in: pending.map((p) => p.id) } },
    data: { emailSent: true },
  })
}
