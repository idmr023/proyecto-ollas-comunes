import { prisma } from '../../lib/prisma'
import { AuthError } from './errors'
import { generateSecret, toKeyUri, verify, base32Encode, base32Decode } from '@digitalbazaar/totp'

export async function getOrCreateTotpSecret(
  userId: string,
  email: string,
): Promise<{ secret: string; qrCodeUri: string }> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })

  if (!user?.totpSecret) {
    const { secret: secretBytes } = await generateSecret({ algorithm: 'SHA-1' })
    const encodedSecret = base32Encode(secretBytes)

    const qrCodeUri = toKeyUri({
      type: 'totp',
      secret: encodedSecret,
      label: email,
      issuer: 'SIGO-Ollas',
      accountname: email,
    })

    await prisma.appUser.update({
      where: { id: userId },
      data: { totpSecret: encodedSecret },
    })

    return { secret: encodedSecret, qrCodeUri }
  }

  const qrCodeUri = toKeyUri({
    type: 'totp',
    secret: user.totpSecret,
    label: email,
    issuer: 'SIGO-Ollas',
    accountname: email,
  })

  return { secret: user.totpSecret, qrCodeUri }
}

export async function verifyTotpCode(userId: string, code: string): Promise<void> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user?.totpSecret) {
    throw new AuthError(400, 'TOTP no configurado.')
  }

  const secretBytes = base32Decode(user.totpSecret)
  const isValid = await verify({ secret: secretBytes, token: code, delta: 2 })

  if (!isValid) {
    throw new AuthError(401, 'Código incorrecto.')
  }
}
