import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = 'unit-test-secret'
})

vi.mock('../lib/prisma', () => ({
  prisma: {
    appUser: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '../lib/prisma'
import { AuthError } from '../modules/auth/errors'
import { getOrCreateTotpSecret, verifyTotpCode } from '../modules/auth/totp-service'
import { login, setupTotp, verifyOtp, register, getMe, updateProfile } from '../modules/auth/service'
import { decryptGcm } from '../lib/encryption'
import jwt from 'jsonwebtoken'

const baseUser = {
  id: '11111111-1111-1111-1111-111111111111',
  tenantId: '22222222-2222-2222-2222-222222222222',
  email: 'admin@ollascomunes.pe',
  fullName: 'Admin Principal',
  passwordHash: 'hashed-password',
  role: 'admin_municipal',
  status: 'active',
  totpSecret: 'DAYBALLTIQKVOPAKI2PJYJZCLIIWM2WJ',
  createdAt: new Date(),
}

const appUserFindUnique = vi.mocked(prisma.appUser.findUnique)
const appUserUpdate = vi.mocked(prisma.appUser.update)
const appUserCreate = vi.mocked(prisma.appUser.create)
const tenantFindUnique = vi.mocked(prisma.tenant.findUnique)

beforeEach(() => {
  vi.resetAllMocks()
  process.env.JWT_SECRET = 'unit-test-secret'
})

describe('getOrCreateTotpSecret', () => {
  it('throws AuthError(404) when user not found', async () => {
    appUserFindUnique.mockResolvedValue(null)
    await expect(getOrCreateTotpSecret('u', 'a@b.com')).rejects.toMatchObject({
      statusCode: 404,
      name: 'AuthError',
    })
  })

  it('returns existing secret without persisting again', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser })
    const result = await getOrCreateTotpSecret(baseUser.id, baseUser.email)
    expect(result.secret).toBe(baseUser.totpSecret)
    expect(result.qrCodeUri).toContain('otpauth://totp/')
    expect(appUserUpdate).not.toHaveBeenCalled()
  })

  it('generates a new secret and persists it when missing', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser, totpSecret: null })
    appUserUpdate.mockResolvedValue({ ...baseUser })
    const result = await getOrCreateTotpSecret(baseUser.id, baseUser.email)
    expect(result.secret).toBeTruthy()
    expect(result.secret).not.toBe(baseUser.totpSecret)
    expect(result.qrCodeUri).toContain(encodeURIComponent(result.secret))
    
    expect(appUserUpdate).toHaveBeenCalled()
    const lastCall = appUserUpdate.mock.calls[0][0]
    expect(lastCall.where.id).toBe(baseUser.id)
    const decrypted = decryptGcm(lastCall.data.totpSecret)
    expect(decrypted).toBe(result.secret)
  })
})

describe('verifyTotpCode', () => {
  it('throws when user or secret is missing', async () => {
    appUserFindUnique.mockResolvedValue(null)
    await expect(verifyTotpCode('u', '123456')).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws when the code does not match the secret', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser })
    await expect(verifyTotpCode(baseUser.id, '000000')).rejects.toMatchObject({ statusCode: 401 })
  })

  it('succeeds for a valid code', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser })
    const { generateSync } = await import('otplib')
    const code = generateSync({ secret: baseUser.totpSecret })
    await expect(verifyTotpCode(baseUser.id, code)).resolves.toBeUndefined()
  })
})

describe('login', () => {
  it('throws 401 when user does not exist', async () => {
    appUserFindUnique.mockResolvedValue(null)
    await expect(
      login({ email: 'nobody@example.com', password: 'x' }),
    ).rejects.toBeInstanceOf(AuthError)
  })

  it('throws 401 with a wrong password', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = bcrypt.hashSync('correct', 10)
    appUserFindUnique.mockResolvedValue({ ...baseUser, passwordHash: hash })
    await expect(
      login({ email: baseUser.email, password: 'wrong' }),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 403 for inactive accounts', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = bcrypt.hashSync('correct', 10)
    appUserFindUnique.mockResolvedValue({ ...baseUser, passwordHash: hash, status: 'inactive' })
    await expect(
      login({ email: baseUser.email, password: 'correct' }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns TOTP_SETUP_REQUIRED when user has no secret', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = bcrypt.hashSync('correct', 10)
    appUserFindUnique.mockResolvedValue({ ...baseUser, passwordHash: hash, totpSecret: null })
    const result = await login({ email: baseUser.email, password: 'correct' })
    expect(result).toMatchObject({ status: 'TOTP_SETUP_REQUIRED', email: baseUser.email })
    if (result.status === 'TOTP_SETUP_REQUIRED') {
      expect(typeof result.tempToken).toBe('string')
    }
  })

  it('returns MFA_PENDING when user has a secret', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = bcrypt.hashSync('correct', 10)
    appUserFindUnique.mockResolvedValue({ ...baseUser, passwordHash: hash })
    const result = await login({ email: baseUser.email, password: 'correct' })
    expect(result).toMatchObject({ status: 'MFA_PENDING', email: baseUser.email })
  })

  it('throws zod error for invalid input', async () => {
    await expect(login({ email: 'not-an-email', password: 'x' } as any)).rejects.toBeTruthy()
  })
})

function makeTempToken(userId = baseUser.id, email = baseUser.email) {
  return jwt.sign({ userId, email, purpose: 'mfa' }, 'unit-test-secret', { expiresIn: '2m' })
}

describe('setupTotp', () => {
  it('throws when tempToken is not mfa-purpose', async () => {
    const token = jwt.sign({ userId: 'u', email: 'a@b.com' }, 'unit-test-secret')
    await expect(setupTotp({ tempToken: token })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 403 for inactive user', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser, status: 'inactive' })
    await expect(setupTotp({ tempToken: makeTempToken() })).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns existing secret when user already has one', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser })
    const result = await setupTotp({ tempToken: makeTempToken() })
    expect(result.secret).toBe(baseUser.totpSecret)
    expect(result.email).toBe(baseUser.email)
  })

  it('persists a new secret and returns it', async () => {
    appUserFindUnique
      .mockResolvedValueOnce({ ...baseUser, totpSecret: null })
      .mockResolvedValueOnce({ ...baseUser, totpSecret: null })
    appUserUpdate.mockResolvedValue({ ...baseUser })
    const result = await setupTotp({ tempToken: makeTempToken() })
    expect(result.secret).toBeTruthy()
    expect(result.qrCodeUri).toContain('otpauth://totp/')
  })
})

describe('verifyOtp', () => {
  it('returns AuthResponse when code is valid', async () => {
    const tempToken = makeTempToken()
    const { generateSync } = await import('otplib')
    const code = generateSync({ secret: baseUser.totpSecret })
    appUserFindUnique
      .mockResolvedValueOnce({ ...baseUser })
      .mockResolvedValueOnce({ ...baseUser })
    tenantFindUnique.mockResolvedValue({ id: baseUser.tenantId, name: 'Tenant 1' })
    const result = await verifyOtp({ email: baseUser.email, tempToken, code })
    expect(result.token).toBeTruthy()
    expect(result.user.email).toBe(baseUser.email)
    expect(result.user.tenantName).toBe('Tenant 1')
  })

  it('throws when code is wrong', async () => {
    const tempToken = makeTempToken()
    appUserFindUnique.mockResolvedValueOnce({ ...baseUser })
    await expect(
      verifyOtp({ email: baseUser.email, tempToken, code: '000000' }),
    ).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('register', () => {
  const validInput = {
    email: 'new@example.com',
    password: 'secret1',
    fullName: 'New User',
    tenantId: '33333333-3333-3333-3333-333333333333',
  }

  it('throws 409 when email already exists', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser })
    await expect(register(validInput)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 404 when tenant does not exist', async () => {
    appUserFindUnique.mockResolvedValue(null)
    tenantFindUnique.mockResolvedValue(null)
    await expect(register(validInput)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('creates a new user and returns token + user', async () => {
    appUserFindUnique.mockResolvedValue(null)
    tenantFindUnique.mockResolvedValue({ id: validInput.tenantId, name: 'T' })
    appUserCreate.mockResolvedValue({ ...baseUser, email: validInput.email, fullName: validInput.fullName })
    const result = await register({ ...validInput, role: 'lideresa_olla' })
    expect(result.token).toBeTruthy()
    expect(result.user.email).toBe(validInput.email)
    expect(appUserCreate).toHaveBeenCalled()
  })
})

describe('getMe', () => {
  it('returns null when user not found', async () => {
    appUserFindUnique.mockResolvedValue(null)
    expect(await getMe(baseUser.id)).toBeNull()
  })

  it('returns null when user is inactive', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser, status: 'inactive' })
    expect(await getMe(baseUser.id)).toBeNull()
  })

  it('returns AuthUser when active', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser })
    tenantFindUnique.mockResolvedValue({ id: baseUser.tenantId, name: 'T' })
    const me = await getMe(baseUser.id)
    expect(me).toMatchObject({ id: baseUser.id, tenantName: 'T' })
  })
})

describe('updateProfile', () => {
  it('throws 404 when user not found', async () => {
    appUserFindUnique.mockResolvedValue(null)
    await expect(updateProfile(baseUser.id, { fullName: 'X' })).rejects.toMatchObject({ statusCode: 404 })
  })

  it('updates fullName only', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser })
    appUserUpdate.mockResolvedValue({ ...baseUser, fullName: 'New Name' })
    tenantFindUnique.mockResolvedValue({ id: baseUser.tenantId, name: 'T' })
    const result = await updateProfile(baseUser.id, { fullName: 'New Name' })
    expect(result.user.fullName).toBe('New Name')
    expect(appUserUpdate).toHaveBeenCalledWith({
      where: { id: baseUser.id },
      data: { fullName: 'New Name' },
    })
  })

  it('throws 409 when changing email to one already in use', async () => {
    appUserFindUnique
      .mockResolvedValueOnce({ ...baseUser })
      .mockResolvedValueOnce({ ...baseUser, id: 'other' })
    await expect(
      updateProfile(baseUser.id, { email: 'taken@example.com' }),
    ).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 400 when changing password without currentPassword', async () => {
    appUserFindUnique.mockResolvedValue({ ...baseUser })
    await expect(
      updateProfile(baseUser.id, { newPassword: 'newpass1' }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when currentPassword is wrong', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = bcrypt.hashSync('correct', 10)
    appUserFindUnique.mockResolvedValue({ ...baseUser, passwordHash: hash })
    await expect(
      updateProfile(baseUser.id, { currentPassword: 'wrong', newPassword: 'newpass1' }),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('updates passwordHash when currentPassword matches', async () => {
    const bcrypt = await import('bcryptjs')
    const hash = bcrypt.hashSync('correct', 10)
    appUserFindUnique.mockResolvedValue({ ...baseUser, passwordHash: hash })
    appUserUpdate.mockResolvedValue({ ...baseUser })
    tenantFindUnique.mockResolvedValue({ id: baseUser.tenantId, name: 'T' })
    await updateProfile(baseUser.id, { currentPassword: 'correct', newPassword: 'newpass1' })
    expect(appUserUpdate).toHaveBeenCalled()
    const call = appUserUpdate.mock.calls[0][0]
    expect(call.data.passwordHash).toMatch(/^\$2[aby]\$/)
  })
})
