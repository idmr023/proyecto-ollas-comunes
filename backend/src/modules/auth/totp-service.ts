import { generateSecret, verify as verifyTotp } from 'otplib'
import { prisma } from '../../lib/prisma'
import { AuthError } from './errors'
import { encryptGcm, decryptGcm } from '../../lib/encryption'

const TOTP_SERVICE_NAME = 'SIGO-Ollas'

export async function getOrCreateTotpSecret(userId: string, email: string): Promise<{ secret: string; qrCodeUri: string }> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user) throw new AuthError(404, 'Usuario no encontrado.')

  if (user.totpSecret) {
    const decryptedSecret = decryptGcm(user.totpSecret)
    const qrCodeUri = `otpauth://totp/${encodeURIComponent(TOTP_SERVICE_NAME)}:${encodeURIComponent(email)}?secret=${decryptedSecret}&issuer=${encodeURIComponent(TOTP_SERVICE_NAME)}`
    return { secret: decryptedSecret, qrCodeUri }
  }

  const secret = generateSecret()
  const encryptedSecret = encryptGcm(secret)
  const qrCodeUri = `otpauth://totp/${encodeURIComponent(TOTP_SERVICE_NAME)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(TOTP_SERVICE_NAME)}`

  await prisma.appUser.update({
    where: { id: userId },
    data: { totpSecret: encryptedSecret },
  })

  return { secret, qrCodeUri }
}

export async function verifyTotpCode(userId: string, code: string): Promise<void> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user?.totpSecret) throw new AuthError(400, 'TOTP no configurado. Solicita un nuevo codigo.')

  const decryptedSecret = decryptGcm(user.totpSecret)
  const result = await verifyTotp({ token: code, secret: decryptedSecret, epochTolerance: 60 })
  if (!result.valid) throw new AuthError(401, 'Codigo incorrecto.')
}
