import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import { AuthError } from './errors'
import { AuthResponse, AuthUser, LoginInput, RegisterInput } from './types'

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'
const JWT_EXPIRES_IN = '24h'
const BCRYPT_ROUNDS = 10

function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input

  if (!email || !password) {
    throw new AuthError(400, 'Email y contrasena son obligatorios.')
  }

  const user = await prisma.appUser.findUnique({ where: { email } })

  if (!user) {
    throw new AuthError(401, 'Credenciales invalidas.')
  }

  if (user.status === 'inactive') {
    throw new AuthError(403, 'Cuenta desactivada.')
  }

  const valid = await bcrypt.compare(password, user.passwordHash)

  if (!valid) {
    throw new AuthError(401, 'Credenciales invalidas.')
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } })

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: tenant?.name ?? '',
  }

  const token = generateToken(authUser)

  return { user: authUser, token }
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, fullName, tenantId, role } = input

  if (!email || !password || !fullName || !tenantId) {
    throw new AuthError(400, 'Email, contrasena, nombre y tenant son obligatorios.')
  }

  if (password.length < 6) {
    throw new AuthError(400, 'La contrasena debe tener al menos 6 caracteres.')
  }

  const existing = await prisma.appUser.findUnique({ where: { email } })

  if (existing) {
    throw new AuthError(409, 'Ya existe un usuario con ese email.')
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

  if (!tenant) {
    throw new AuthError(404, 'El tenant especificado no existe.')
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const user = await prisma.appUser.create({
    data: {
      email,
      passwordHash,
      fullName,
      tenantId,
      role: role ?? 'admin_municipal',
    },
  })

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
    tenantName: tenant.name,
  }

  const token = generateToken(authUser)

  return { user: authUser, token }
}

export async function getMe(userId: string): Promise<AuthUser | null> {
  const user = await prisma.appUser.findUnique({ where: { id: userId } })

  if (!user || user.status === 'inactive') return null

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
