import { generateSecret, verify as verifyTotp } from 'otplib'
import { prisma } from '../../lib/prisma'
import { AuthError } from './errors'

const TOTP_SERVICE_NAME = 'SIGO-Ollas'

export async function getOrCreateTotpSecret(userId: string, email: string): Promise<{ secret: string; qrCodeUri: string }> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user) throw new AuthError(404, 'Usuario no encontrado.')

  if (user.totpSecret) {
    const qrCodeUri = `otpauth://totp/${encodeURIComponent(TOTP_SERVICE_NAME)}:${encodeURIComponent(email)}?secret=${user.totpSecret}&issuer=${encodeURIComponent(TOTP_SERVICE_NAME)}`
    return { secret: user.totpSecret, qrCodeUri }
  }

  const secret = generateSecret()
  const qrCodeUri = `otpauth://totp/${encodeURIComponent(TOTP_SERVICE_NAME)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(TOTP_SERVICE_NAME)}`

  await prisma.appUser.update({
    where: { id: userId },
    data: { totpSecret: secret },
  })

  return { secret, qrCodeUri }
}

export async function verifyTotpCode(userId: string, code: string): Promise<void> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user?.totpSecret) throw new AuthError(400, 'TOTP no configurado. Solicita un nuevo codigo.')

  const result = await verifyTotp({ token: code, secret: user.totpSecret, epochTolerance: 60 })
  if (!result.valid) throw new AuthError(401, 'Codigo incorrecto.')
}
