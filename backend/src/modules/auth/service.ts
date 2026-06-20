import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import { AuthError } from './errors'
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from './validators'
import { generateTotpSecret, getExistingTotpSecret, saveTotpSecret, verifyTotpCode } from './totp-service'
import {
  AuthResponse,
  AuthUser,
  LoginInput,
  MfaPendingResponse,
  RegisterInput,
  TotpSetupRequiredResponse,
  VerifyOtpInput,
} from './types'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'
const JWT_EXPIRES_IN = '24h'
const TEMP_TOKEN_EXPIRES_IN = '5m'
const BCRYPT_ROUNDS = 10

/* ── Utilities ───────────────────────────────────── */

function generateToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, tenantId: user.tenantId, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

function generateTempToken(userId: string, email: string, secret?: string): string {
  return jwt.sign({ userId, email, secret, purpose: 'mfa' }, JWT_SECRET, { expiresIn: TEMP_TOKEN_EXPIRES_IN })
}

function verifyTempToken(token: string): { userId: string; email: string; secret?: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; secret?: string; purpose: string }
    if (payload.purpose !== 'mfa') throw new AuthError(400, 'Token temporal invalido.')
    return { userId: payload.userId, email: payload.email, secret: payload.secret }
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

/* ── Step 1: email + password ────────────────────── */

export async function login(input: LoginInput): Promise<AuthResponse | MfaPendingResponse | TotpSetupRequiredResponse> {
  const parsed = loginSchema.parse(input)
  const { email, password } = parsed

  const user = await prisma.appUser.findUnique({ where: { email } })
  if (!user) throw new AuthError(401, 'Credenciales invalidas.')
  if (user.status === 'inactive') throw new AuthError(403, 'Cuenta desactivada.')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AuthError(401, 'Credenciales invalidas.')

  let totpSecret: string
  let qrCodeUri: string
  let isNewSetup: boolean

  if (!user.totpSecret) {
    const result = await generateTotpSecret(user.email)
    totpSecret = result.secret
    qrCodeUri = result.qrCodeUri
    isNewSetup = true
  } else {
    const existing = await getExistingTotpSecret(user.id, user.email)
    if (!existing) throw new AuthError(500, 'Error al recuperar configuracion TOTP.')
    totpSecret = existing.secret
    qrCodeUri = existing.qrCodeUri
    isNewSetup = false
  }

  const tempToken = generateTempToken(user.id, user.email, totpSecret)

  if (isNewSetup) {
    return { status: 'TOTP_SETUP_REQUIRED', tempToken, secret: totpSecret, qrCodeUri, email: user.email }
  }

  return { status: 'MFA_PENDING', tempToken, email: user.email }
}

/* ── Step 2: TOTP code → JWT ────────────────────── */

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
  const parsed = verifyOtpSchema.parse(input)
  const { email, tempToken, code } = parsed

  const { userId, secret } = verifyTempToken(tempToken)
  if (!secret) throw new AuthError(400, 'Configuracion TOTP no encontrada. Vuelve a iniciar sesion.')

  await verifyTotpCode(secret, code)

  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user || user.status === 'inactive') throw new AuthError(403, 'Cuenta no disponible.')

  if (!user.totpSecret) {
    await saveTotpSecret(userId, secret)
  }

  const authUser = await buildAuthUser(user)
  const token = generateToken(authUser)

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

/* ── Update user profile ──────────────────────────── */

export async function updateProfile(
  userId: string,
  input: { fullName?: string; email?: string; currentPassword?: string; newPassword?: string }
): Promise<{ user: AuthUser; token: string }> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user) throw new AuthError(404, 'Usuario no encontrado.')

  const updateData: any = {}

  if (input.fullName !== undefined) {
    updateData.fullName = input.fullName
  }

  if (input.email !== undefined && input.email !== user.email) {
    const existing = await prisma.appUser.findUnique({ where: { email: input.email } })
    if (existing) throw new AuthError(409, 'Ya existe un usuario con ese email.')
    updateData.email = input.email
  }

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new AuthError(400, 'Debe proporcionar la contraseña actual para cambiarla.')
    }
    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash)
    if (!valid) throw new AuthError(400, 'La contraseña actual es incorrecta.')

    updateData.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS)
  }

  const updatedUser = await prisma.appUser.update({
    where: { id: userId },
    data: updateData,
  })

  const authUser = await buildAuthUser(updatedUser)
  const token = generateToken(authUser)

  return { user: authUser, token }
}
