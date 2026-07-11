import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import { AuthError } from './errors'
import {
  loginSchema,
  registerSchema,
  totpSetupSchema,
  verifyOtpSchema,
} from './validators'
import { getOrCreateTotpSecret, verifyTotpCode } from './totp-service'
import {
  AuthResponse,
  AuthUser,
  LoginInput,
  MfaPendingResponse,
  RegisterInput,
  TotpSetupInput,
  TotpSetupRequiredResponse,
  TotpSetupResponse,
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

/* ── Step 1: email + password ────────────────────── */

export async function login(input: LoginInput): Promise<AuthResponse | MfaPendingResponse | TotpSetupRequiredResponse> {
  const parsed = loginSchema.parse(input)
  const { email, password } = parsed

  const user = await prisma.appUser.findUnique({ where: { email } })
  if (!user) throw new AuthError(401, 'Credenciales invalidas.')
  if (user.status === 'inactive') throw new AuthError(403, 'Cuenta desactivada.')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AuthError(401, 'Credenciales invalidas.')

  if (!user.totpSecret) {
    // Sin side-effect: NO creamos/guardamos el secret aqui. Eso sucede en /api/auth/totp/setup,
    // que el frontend llama solo cuando ya esta listo para mostrar el QR al usuario.
    const tempToken = generateTempToken(user.id, user.email)
    return { status: 'TOTP_SETUP_REQUIRED', tempToken, email: user.email }
  }

  const tempToken = generateTempToken(user.id, user.email)
  return { status: 'MFA_PENDING', tempToken, email: user.email }
}

/* ── Step 1b: setup TOTP (crea/persiste el secret) ── */

export async function setupTotp(input: TotpSetupInput): Promise<TotpSetupResponse> {
  const parsed = totpSetupSchema.parse(input)
  const { userId, email } = verifyTempToken(parsed.tempToken)

  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user || user.status === 'inactive') throw new AuthError(403, 'Cuenta no disponible.')

  // getOrCreateTotpSecret es idempotente: si el usuario ya tiene secret, devuelve ese mismo.
  // La persistencia ocurre aqui, no en /login.
  const { secret, qrCodeUri } = await getOrCreateTotpSecret(user.id, user.email)
  return { secret, qrCodeUri, email }
}

/* ── Step 2: TOTP code → JWT ────────────────────── */

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
  const parsed = verifyOtpSchema.parse(input)
  const { tempToken, code } = parsed

  const { userId } = verifyTempToken(tempToken)

  await verifyTotpCode(userId, code)

  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user || user.status === 'inactive') throw new AuthError(403, 'Cuenta no disponible.')

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
