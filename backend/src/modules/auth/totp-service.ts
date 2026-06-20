import { prisma } from '../../lib/prisma'
import { AuthError } from './errors'
import { generateSecret, toKeyUri, verify, base32Encode, base32Decode } from '@digitalbazaar/totp'

export async function generateTotpSecret(
  email: string,
): Promise<{ secret: string; qrCodeUri: string }> {
  const { secret: secretBytes } = await generateSecret({ algorithm: 'SHA-1' })
  const encodedSecret = base32Encode(secretBytes)

  const qrCodeUri = toKeyUri({
    type: 'totp',
    secret: encodedSecret,
    label: email,
    issuer: 'SIGO-Ollas',
    accountname: email,
  })

  return { secret: encodedSecret, qrCodeUri }
}

export async function saveTotpSecret(userId: string, secret: string): Promise<void> {
  await prisma.appUser.update({
    where: { id: userId },
    data: { totpSecret: secret },
  })
}

export async function getExistingTotpSecret(
  userId: string,
  email: string,
): Promise<{ secret: string; qrCodeUri: string } | null> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user?.totpSecret) return null

  const qrCodeUri = toKeyUri({
    type: 'totp',
    secret: user.totpSecret,
    label: email,
    issuer: 'SIGO-Ollas',
    accountname: email,
  })

  return { secret: user.totpSecret, qrCodeUri }
}

export async function verifyTotpCode(secret: string, code: string): Promise<void> {
  const secretBytes = base32Decode(secret)
  const isValid = await verify({ secret: secretBytes, token: code, delta: 2 })

  if (!isValid) {
    throw new AuthError(401, 'Código incorrecto.')
  }
}
