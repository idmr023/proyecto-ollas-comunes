import { prisma } from './prisma'

export async function setAuditUser(userId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.current_user_id', $1, true)`,
    userId,
  )
}

export async function withAudit<T>(
  userId: string,
  fn: () => Promise<T>,
): Promise<T> {
  await setAuditUser(userId)
  return fn()
}
