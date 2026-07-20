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
import { JWT_SECRET } from '../../lib/config/secrets'
import {
  ActorContext,
  AuthResponse,
  AuthUser,
  LoginInput,
  MfaPendingResponse,
  RegisterInput,
  RegisterResponse,
  TotpSetupInput,
  TotpSetupRequiredResponse,
  TotpSetupResponse,
  VerifyOtpInput,
} from './types'

const JWT_EXPIRES_IN = '24h'
const TEMP_TOKEN_EXPIRES_IN = '2m'
// 12 rondas es la recomendacion actual. Los hashes existentes con 10 rondas
// siguen verificando sin problema y se re-hashean al vuelo en el login.
const BCRYPT_ROUNDS = 12

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

/**
 * Re-hashea la contrasena si su coste es inferior al actual.
 *
 * Se ejecuta tras validar las credenciales, cuando la contrasena en claro esta
 * disponible, de modo que las cuentas antiguas migran de 10 a 12 rondas sin
 * pedir al usuario que la cambie. Un fallo aqui no debe impedir el login.
 */
async function rehashPasswordIfStale(
  userId: string,
  currentHash: string,
  plainPassword: string,
): Promise<void> {
  try {
    if (bcrypt.getRounds(currentHash) >= BCRYPT_ROUNDS) return

    const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS)
    await prisma.appUser.update({ where: { id: userId }, data: { passwordHash } })
  } catch (error) {
    console.error('[auth] No se pudo re-hashear la contrasena:', error)
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

  await rehashPasswordIfStale(user.id, user.passwordHash, password)

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

/**
 * Que roles puede asignar cada rol. Un rol ausente del mapa no puede dar de
 * alta a nadie. Nadie puede otorgar mas privilegio del que ya posee.
 */
const ROLE_ASSIGNMENT_MATRIX: Record<string, readonly string[]> = {
  admin_municipal: ['admin_municipal', 'supervisor', 'lideresa_olla'],
  supervisor: ['lideresa_olla'],
}

/** Por defecto se asigna el rol de MENOR privilegio, nunca el de mayor. */
const DEFAULT_ROLE = 'lideresa_olla'

export async function register(
  actor: ActorContext,
  input: RegisterInput,
): Promise<RegisterResponse> {
  const parsed = registerSchema.parse(input)
  const { email, password, fullName, ollaId } = parsed
  const requestedRole = parsed.role ?? DEFAULT_ROLE

  const assignableRoles = ROLE_ASSIGNMENT_MATRIX[actor.role] ?? []
  if (!assignableRoles.includes(requestedRole)) {
    throw new AuthError(403, 'No tienes permisos para asignar ese rol.')
  }

  const existing = await prisma.appUser.findUnique({ where: { email } })
  if (existing) throw new AuthError(409, 'Ya existe un usuario con ese email.')

  // El tenant proviene del token del solicitante, nunca del cuerpo de la peticion.
  const tenantId = actor.tenantId
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) throw new AuthError(404, 'El tenant especificado no existe.')

  // Una lideresa sin olla asignada nace sin acceso a ningun dato: el repositorio
  // falla cerrado a proposito antes que devolverle una olla arbitraria.
  if (requestedRole === 'lideresa_olla' && !ollaId) {
    throw new AuthError(400, 'Debes indicar la olla a cargo de la lideresa.')
  }

  if (ollaId) {
    // La olla se valida contra el tenant del solicitante, de modo que no se
    // puede asignar un usuario a una olla de otra organizacion.
    const olla = await prisma.ollaComun.findFirst({ where: { id: ollaId, tenantId } })
    if (!olla) throw new AuthError(404, 'La olla indicada no existe en tu organizacion.')
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const user = await prisma.appUser.create({
    data: { email, passwordHash, fullName, tenantId, role: requestedRole, ollaId: ollaId ?? null },
  })

  // No se emite token: hacerlo abriria sesion saltandose el segundo factor.
  // El usuario creado debe autenticarse por /login y configurar su TOTP.
  return { user: await buildAuthUser(user) }
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
