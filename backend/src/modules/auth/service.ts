import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import { AuthError } from './errors'
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from './validators'
import { getOrCreateTotpSecret, verifyTotpCode } from './totp-service'
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
const TEMP_TOKEN_EXPIRES_IN = '2m'
const BCRYPT_ROUNDS = 10
const DEBUG_AUTH_EMAIL = process.env.DEBUG_AUTH_EMAIL ?? 'debug.mobile@sigo.local'
const DEBUG_AUTH_PASSWORD = process.env.DEBUG_AUTH_PASSWORD ?? 'DebugMobile123!'
const DEBUG_AUTH_OTP = process.env.DEBUG_AUTH_OTP ?? '000000'
const DEBUG_AUTH_USER_EMAIL = process.env.DEBUG_AUTH_USER_EMAIL?.trim()
const DEBUG_AUTH_ALLOW_MEMORY_USER = process.env.DEBUG_AUTH_ALLOW_MEMORY_USER === 'true'
const DEBUG_MEMORY_USER: AuthUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'debug.user@sigo.local',
  fullName: 'Usuario Debug Movil',
  role: 'lideresa_olla',
  tenantId: '00000000-0000-4000-8000-000000000101',
  tenantName: 'Olla Debug',
}

/* ── Utilities ───────────────────────────────────── */

function generateToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, tenantId: user.tenantId, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

type TempTokenPurpose = 'mfa' | 'dev-mfa'

function isDebugAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEBUG_AUTH_ENABLED === 'true'
}

function isDebugCredentials(email: string, password: string): boolean {
  return isDebugAuthEnabled() && email === DEBUG_AUTH_EMAIL && password === DEBUG_AUTH_PASSWORD
}

function generateTempToken(userId: string, email: string, purpose: TempTokenPurpose = 'mfa'): string {
  return jwt.sign({ userId, email, purpose }, JWT_SECRET, { expiresIn: TEMP_TOKEN_EXPIRES_IN })
}

function verifyTempToken(token: string): { userId: string; email: string; purpose: TempTokenPurpose } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; purpose: string }
    if (payload.purpose !== 'mfa' && payload.purpose !== 'dev-mfa') throw new AuthError(400, 'Token temporal invalido.')
    return { userId: payload.userId, email: payload.email, purpose: payload.purpose }
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

async function findDebugAuthUser(): Promise<AuthUser> {
  if (DEBUG_AUTH_ALLOW_MEMORY_USER) return DEBUG_MEMORY_USER

  const user = DEBUG_AUTH_USER_EMAIL
    ? await prisma.appUser.findUnique({ where: { email: DEBUG_AUTH_USER_EMAIL } })
    : await prisma.appUser.findFirst({ where: { status: 'active' }, orderBy: { createdAt: 'asc' } })

  if (!user || user.status === 'inactive') {
    throw new AuthError(404, 'DEBUG_AUTH_ENABLED activo, pero no hay usuario activo para asociar la sesion.')
  }

  return buildAuthUser(user)
}

export async function login(input: LoginInput): Promise<AuthResponse | MfaPendingResponse | TotpSetupRequiredResponse> {
  const parsed = loginSchema.parse(input)
  const { email, password } = parsed

  if (isDebugCredentials(email, password)) {
    const debugUser = await findDebugAuthUser()
    const tempToken = generateTempToken(debugUser.id, debugUser.email, 'dev-mfa')
    return { status: 'MFA_PENDING', tempToken, email: debugUser.email, devOtp: DEBUG_AUTH_OTP }
  }

  const user = await prisma.appUser.findUnique({ where: { email } })
  if (!user) throw new AuthError(401, 'Credenciales invalidas.')
  if (user.status === 'inactive') throw new AuthError(403, 'Cuenta desactivada.')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new AuthError(401, 'Credenciales invalidas.')

  if (!user.totpSecret) {
    const { secret, qrCodeUri } = await getOrCreateTotpSecret(user.id, user.email)
    const tempToken = generateTempToken(user.id, user.email)
    return { status: 'TOTP_SETUP_REQUIRED', tempToken, secret, qrCodeUri, email: user.email }
  }

  const tempToken = generateTempToken(user.id, user.email)
  return { status: 'MFA_PENDING', tempToken, email: user.email }
}

/* ── Step 2: TOTP code → JWT ────────────────────── */

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
  const parsed = verifyOtpSchema.parse(input)
  const { email, tempToken, code } = parsed

  const { userId, email: tokenEmail, purpose } = verifyTempToken(tempToken)
  if (email !== tokenEmail) throw new AuthError(400, 'Email no coincide con el token temporal.')

  if (purpose === 'dev-mfa') {
    if (!isDebugAuthEnabled()) throw new AuthError(400, 'Login de depuracion deshabilitado.')
    if (code !== DEBUG_AUTH_OTP) throw new AuthError(401, 'Codigo de depuracion invalido.')
    if (DEBUG_AUTH_ALLOW_MEMORY_USER && userId === DEBUG_MEMORY_USER.id) {
      return { user: DEBUG_MEMORY_USER, token: generateToken(DEBUG_MEMORY_USER) }
    }
  } else {
    await verifyTotpCode(userId, code)
  }

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
  if (isDebugAuthEnabled() && DEBUG_AUTH_ALLOW_MEMORY_USER && userId === DEBUG_MEMORY_USER.id) {
    return DEBUG_MEMORY_USER
  }

  const user = await prisma.appUser.findUnique({ where: { id: userId } })
  if (!user || user.status === 'inactive') return null
  return buildAuthUser(user)
}
