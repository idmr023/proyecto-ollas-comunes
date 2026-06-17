import crypto from 'node:crypto'
import { prisma } from '../../lib/prisma'
import { sendOtpEmail } from '../../lib/email'
import { AuthError } from './errors'

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 2
const OTP_MAX_ATTEMPTS = 3

async function invalidatePreviousCodes(userId: string): Promise<void> {
  await prisma.otpCode.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date(0) }, // Mark as expired
  })
}

function generateOtpCode(): string {
  const raw = crypto.randomInt(0, 1_000_000)
  return raw.toString().padStart(OTP_LENGTH, '0')
}

export async function createAndSendOtp(
  userId: string,
  email: string,
  fullName: string,
): Promise<string> {
  await invalidatePreviousCodes(userId)

  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.otpCode.create({
    data: {
      userId,
      email,
      code,
      expiresAt,
      maxAttempts: OTP_MAX_ATTEMPTS,
    },
  })

  await sendOtpEmail(email, code, fullName)
  return code
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<{ userId: string }> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      usedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) {
    throw new AuthError(400, 'No hay un codigo pendiente. Solicita uno nuevo.')
  }

  if (otp.usedAt) {
    throw new AuthError(400, 'Este codigo ya fue utilizado.')
  }

  if (new Date() > otp.expiresAt) {
    throw new AuthError(400, 'El codigo ha expirado. Solicita uno nuevo.')
  }

  if (otp.attempts >= otp.maxAttempts) {
    throw new AuthError(429, 'Demasiados intentos fallidos. Solicita un nuevo codigo.')
  }

  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    })

    const remaining = otp.maxAttempts - otp.attempts - 1
    if (remaining <= 0) {
      throw new AuthError(429, 'Codigo bloqueado por demasiados intentos. Solicita uno nuevo.')
    }

    throw new AuthError(401, `Codigo incorrecto. Te quedan ${remaining} intento(s).`)
  }

  // Mark as used (WORM)
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  })

  return { userId: otp.userId }
}
