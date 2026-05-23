import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../../lib/prisma'
import { sendLoginAlertEmail } from '../../lib/email'
import { AuthError } from './errors'
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  googleCallbackSchema,
  googleCredentialSchema,
} from './validators'
import { createAndSendOtp, verifyOtp as verifyOtpCode } from './otp-service'
import { exchangeGoogleCode } from './google-oauth'
import {
  AuthResponse,
  AuthUser,
  LoginInput,
  MfaPendingResponse,
  RegisterInput,
  VerifyOtpInput,
} from './types'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'
const JWT_EXPIRES_IN = '24h'
const TEMP_TOKEN_EXPIRES_IN = '2m'
const BCRYPT_ROUNDS = 10

/* ── Utilities ───────────────────────────────────── */

function generateToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, tenantId: user.tenantId, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

function generateTempToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, purpose: 'mfa' }, JWT_SECRET, { expiresIn: TEMP_TOKEN_EXPIRES_IN })
}

function verifyTempToken(token: string): { userId: string; email: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; purpose: string }
    if (payload.purpose !== 'mfa') throw new AuthError(400, 'Token temporal invalido.')
    return { userId: payload.userId, email: payload.email }
  } catch (err) {
    if (err instanceof AuthError) throw err
    throw new AuthError(400, 'Token temporal invalido o expirado.')
  }
}

async function buildAuthUser(user: { id: string; email: string; fullName: string; role: string; tenantId: string }): Promise<AuthUser> {
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } })
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: tenant?.name ?? '',
  }
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

async function verifyGoogleIdToken(credential: string): Promise<{ email: string; fullName: string; googleId: string }> {
  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })
  const payload = ticket.getPayload()
  if (!payload || !payload.email) throw new AuthError(400, 'Google no proporciono un email valido.')
  return { email: payload.email, fullName: payload.name ?? payload.email.split('@')[0], googleId: payload.sub }
}

/* ── Step 1: email + password → MFA_PENDING ──────── */

export async function login(input: LoginInput): Promise<AuthResponse | MfaPendingResponse> {
  const parsed = loginSchema.parse(input)
  const { email, password } = parsed

  const user = await prisma.appUser.findUnique({ where: { email } })
  if (!user) throw new AuthError(401, 'Credenciales invalidas.')
  if (user.status === 'inactive') throw new AuthError(403, 'Cuenta desactivada.')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AuthError(401, 'Credenciales invalidas.')

  await createAndSendOtp(user.id, user.email, user.fullName)
  const tempToken = generateTempToken(user.id, user.email)

  return { status: 'MFA_PENDING', tempToken, email: user.email }
}

/* ── Step 2: OTP code → JWT ──────────────────────── */

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
  const parsed = verifyOtpSchema.parse(input)
  const { email, tempToken, code } = parsed

  const { userId } = verifyTempToken(tempToken)
  const { userId: otpUserId } = await verifyOtpCode(email, code)
  if (otpUserId !== userId) throw new AuthError(401, 'Discrepancia en la verificacion del usuario.')

  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user || user.status === 'inactive') throw new AuthError(403, 'Cuenta no disponible.')

  const authUser = await buildAuthUser(user)
  const token = generateToken(authUser)

  sendLoginAlertEmail(user.email, user.fullName).catch(() => {})

  return { user: authUser, token }
}

/* ── Registro ────────────────────────────────────── */

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const parsed = registerSchema.parse(input)
  const { email, password, fullName, tenantId, role } = parsed

  const existing = await prisma.appUser.findUnique({ where: { email } })
  if (existing) throw new AuthError(409, 'Ya existe un usuario con ese email.')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new AuthError(404, 'El tenant especificado no existe.')

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const user = await prisma.appUser.create({
    data: { email, passwordHash, fullName, tenantId, role: role ?? 'admin_municipal' },
  })

  const authUser = await buildAuthUser(user)
  const token = generateToken(authUser)

  return { user: authUser, token }
}

/* ── Get current user ────────────────────────────── */

export async function getMe(userId: string): Promise<AuthUser | null> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user || user.status === 'inactive') return null
  return buildAuthUser(user)
}

/* ── Google OAuth (ID token via GIS) ─────────────── */

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const parsed = googleCredentialSchema.parse({ credential })
  const { email, fullName } = await verifyGoogleIdToken(parsed.credential)

  let user = await prisma.appUser.findUnique({ where: { email } })

  if (user) {
    const authUser = await buildAuthUser(user)
    const token = generateToken(authUser)
    sendLoginAlertEmail(user.email, user.fullName).catch(() => {})
    return { user: authUser, token }
  }

  const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!firstTenant) throw new AuthError(400, 'No hay tenants disponibles. Contacta al administrador.')

  user = await prisma.appUser.create({
    data: { email, passwordHash: '', fullName, tenantId: firstTenant.id, role: 'operador_olla' },
  })

  const authUser = await buildAuthUser(user)
  const token = generateToken(authUser)

  sendLoginAlertEmail(user.email, user.fullName).catch(() => {})

  return { user: authUser, token }
}

/* ── Legacy: Supabase GoTrue code exchange ───────── */

export async function loginWithGoogleCode(code: string): Promise<AuthResponse> {
  const parsed = googleCallbackSchema.parse({ code })
  const { email, fullName } = await exchangeGoogleCode(parsed.code)

  let user = await prisma.appUser.findUnique({ where: { email } })

  if (user) {
    const authUser = await buildAuthUser(user)
    const token = generateToken(authUser)
    return { user: authUser, token }
  }

  const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!firstTenant) throw new AuthError(400, 'No hay tenants disponibles. Contacta al administrador.')

  user = await prisma.appUser.create({
    data: { email, passwordHash: '', fullName, tenantId: firstTenant.id, role: 'operador_olla' },
  })

  const authUser = await buildAuthUser(user)
  const token = generateToken(authUser)

  return { user: authUser, token }
}
