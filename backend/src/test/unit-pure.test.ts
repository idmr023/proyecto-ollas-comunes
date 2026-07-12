import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getPeruDayRange } from '../lib/date-utils'
import { isSupabaseConfigured, getSupabaseConfigStatus, supabase } from '../lib/supabase'
import { requireAuth, optionalAuth } from '../lib/middleware/auth'
import { AuthError } from '../modules/auth/errors'
import {
  loginSchema,
  totpSetupSchema,
  registerSchema,
  verifyOtpSchema,
} from '../modules/auth/validators'
import { BeneficiaryServiceError } from '../modules/beneficiaries/errors'
import { OrganizationServiceError } from '../modules/organizations/errors'
import {
  buildOrganizationSlug,
  buildUniqueOrganizationCode,
  sanitizeOrganizationText,
  mapOrganizationStatus,
  mapDatabaseStatus,
  toOrganization,
} from '../modules/organizations/utils'
import { sanitizeOllaText, mapOllaStatus, toOlla } from '../modules/ollas-comunes/utils'

describe('getPeruDayRange', () => {
  it('returns a 1-day range with start and end 5 hours apart in UTC', () => {
    const { start, end, dateString } = getPeruDayRange()
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000)
    expect(start.getUTCHours()).toBe(5)
    expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('isSupabaseConfigured / getSupabaseConfigStatus', () => {
  it('reflects env vars captured at module load time', () => {
    const status = getSupabaseConfigStatus()
    expect(status).toHaveProperty('isConfigured')
    expect(status).toHaveProperty('hasUrl')
    expect(status).toHaveProperty('hasSecretKey')
    expect(status).toHaveProperty('healthcheckTable')
    expect(status.isConfigured).toBe(isSupabaseConfigured)
    expect(status.hasUrl).toBe(Boolean(process.env.SUPABASE_URL))
    expect(status.hasSecretKey).toBe(Boolean(process.env.SUPABASE_SECRET_KEY))
  })
})

function mockReq(headers: Record<string, string> = {}) {
  return { headers } as any
}
function mockRes() {
  const res: any = {
    statusCode: 200,
    body: undefined as any,
    headers: {} as Record<string, string>,
    status(code: number) { this.statusCode = code; return this },
    json(payload: unknown) { this.body = payload; return this },
  }
  return res
}

describe('requireAuth', () => {
  it('rejects when no Authorization header is present', () => {
    const req = mockReq()
    const res = mockRes()
    const next = () => { throw new Error('next should not be called') }
    requireAuth(req, res, next)
    expect(res.statusCode).toBe(401)
    expect(res.body.message).toBe('Token no proporcionado.')
  })

  it('rejects when header does not start with Bearer', () => {
    const req = mockReq({ authorization: 'Basic abc' })
    const res = mockRes()
    requireAuth(req, res, () => { throw new Error('next should not be called') })
    expect(res.statusCode).toBe(401)
    expect(res.body.message).toBe('Token no proporcionado.')
  })

  it('rejects with invalid token', () => {
    const req = mockReq({ authorization: 'Bearer not-a-jwt' })
    const res = mockRes()
    requireAuth(req, res, () => { throw new Error('next should not be called') })
    expect(res.statusCode).toBe(401)
    expect(res.body.message).toBe('Token invalido o expirado.')
  })

  it('accepts a valid token and attaches user', () => {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken')
    const expectedSecret = process.env.JWT_SECRET ?? 'fallback-secret'
    const token = jwt.sign(
      { userId: 'u1', email: 'a@b.com', tenantId: 't1', role: 'admin', fullName: 'X' },
      expectedSecret,
    )
    const req = mockReq({ authorization: `Bearer ${token}` })
    const res = mockRes()
    let called = false
    requireAuth(req, res, () => { called = true })
    expect(called).toBe(true)
    expect((req as any).user.userId).toBe('u1')
  })
})

describe('optionalAuth', () => {
  it('always calls next even without a token', () => {
    const req = mockReq()
    const res = mockRes()
    let called = false
    optionalAuth(req, res, () => { called = true })
    expect(called).toBe(true)
    expect((req as any).user).toBeUndefined()
  })

  it('attaches user when token is valid, ignores when invalid', () => {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken')
    const expectedSecret = process.env.JWT_SECRET ?? 'fallback-secret'
    const token = jwt.sign({ userId: 'u1', email: 'a@b.com', tenantId: 't1', role: 'r', fullName: 'N' }, expectedSecret)

    const reqOk = mockReq({ authorization: `Bearer ${token}` })
    optionalAuth(reqOk, mockRes(), () => undefined)
    expect((reqOk as any).user.userId).toBe('u1')

    const reqBad = mockReq({ authorization: 'Bearer xxx' })
    optionalAuth(reqBad, mockRes(), () => undefined)
    expect((reqBad as any).user).toBeUndefined()
  })
})

describe('AuthError', () => {
  it('captures statusCode and name', () => {
    const e = new AuthError(401, 'no')
    expect(e).toBeInstanceOf(Error)
    expect(e.statusCode).toBe(401)
    expect(e.name).toBe('AuthError')
    expect(e.message).toBe('no')
  })
})

describe('BeneficiaryServiceError', () => {
  it('captures statusCode and name', () => {
    const e = new BeneficiaryServiceError(404, 'nf')
    expect(e).toBeInstanceOf(Error)
    expect(e.statusCode).toBe(404)
    expect(e.name).toBe('BeneficiaryServiceError')
  })
})

describe('OrganizationServiceError', () => {
  it('captures statusCode and name', () => {
    const e = new OrganizationServiceError(409, 'dup')
    expect(e.statusCode).toBe(409)
    expect(e.name).toBe('OrganizationServiceError')
  })
})

describe('loginSchema', () => {
  it('rejects empty email', () => {
    const r = loginSchema.safeParse({ email: '', password: 'x' })
    expect(r.success).toBe(false)
  })
  it('rejects missing password', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com' })
    expect(r.success).toBe(false)
  })
  it('accepts valid input and trims email', () => {
    const r = loginSchema.safeParse({ email: '  a@b.com  ', password: 'secret' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe('a@b.com')
  })
  it('rejects password too long', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: 'x'.repeat(129) })
    expect(r.success).toBe(false)
  })
})

describe('totpSetupSchema', () => {
  it('rejects empty tempToken', () => {
    expect(totpSetupSchema.safeParse({ tempToken: '' }).success).toBe(false)
  })
  it('accepts non-empty tempToken', () => {
    expect(totpSetupSchema.safeParse({ tempToken: 'abc' }).success).toBe(true)
  })
})

describe('registerSchema', () => {
  const base = {
    email: 'a@b.com',
    password: 'secret1',
    fullName: 'User',
    tenantId: '00000000-0000-0000-0000-000000000001',
  }
  it('rejects password shorter than 6', () => {
    const r = registerSchema.safeParse({ ...base, password: '123' })
    expect(r.success).toBe(false)
  })
  it('rejects invalid uuid tenantId', () => {
    const r = registerSchema.safeParse({ ...base, tenantId: 'not-uuid' })
    expect(r.success).toBe(false)
  })
  it('accepts a valid payload with optional role', () => {
    const r = registerSchema.safeParse({ ...base, role: 'lideresa_olla' })
    expect(r.success).toBe(true)
  })
})

describe('verifyOtpSchema', () => {
  const base = { email: 'a@b.com', tempToken: 't', code: '123456' }
  it('rejects code with wrong length', () => {
    expect(verifyOtpSchema.safeParse({ ...base, code: '12345' }).success).toBe(false)
    expect(verifyOtpSchema.safeParse({ ...base, code: '1234567' }).success).toBe(false)
  })
  it('rejects non-numeric code', () => {
    expect(verifyOtpSchema.safeParse({ ...base, code: 'abcdef' }).success).toBe(false)
  })
  it('accepts a valid payload', () => {
    expect(verifyOtpSchema.safeParse(base).success).toBe(true)
  })
})

describe('buildOrganizationSlug', () => {
  it('lowercases, strips accents and replaces spaces with dashes', () => {
    expect(buildOrganizationSlug('Asociación Municipal')).toBe('asociacion-municipal')
    expect(buildOrganizationSlug('Niños & Niñas')).toBe('ninos-ninas')
  })
  it('trims leading/trailing dashes', () => {
    expect(buildOrganizationSlug('  --Foo--  ')).toBe('foo')
  })
  it('returns empty for empty input', () => {
    expect(buildOrganizationSlug('')).toBe('')
  })
})

describe('buildUniqueOrganizationCode', () => {
  it('returns base code when not taken', () => {
    expect(buildUniqueOrganizationCode('Municipalidad de Lima', [])).toBe('MUNICIPALIDAD-DE-LIMA')
  })
  it('appends -2, -3 ... when taken', () => {
    const taken = ['MUNICIPALIDAD-DE-LIMA']
    const code = buildUniqueOrganizationCode('Municipalidad de Lima', taken)
    expect(code).toBe('MUNICIPALIDAD-DE-LIMA-2')
  })
  it('keeps total length <= 24 even with multi-digit suffix', () => {
    const base = 'AAAAAAAAAAAAAAAAAAAAAAAA'
    const taken = [base]
    const code = buildUniqueOrganizationCode(base, taken)
    expect(code.length).toBeLessThanOrEqual(24)
    expect(code).toBe('AAAAAAAAAAAAAAAAAAAAAA-2')
  })
  it('falls back to timestamp suffix when all -2..-999 candidates are taken', () => {
    const base = 'AAAAAAAAAAAAAAAAAAAAAAAA'
    const taken = [base]
    for (let i = 2; i < 1000; i += 1) {
      taken.push(`${base.slice(0, Math.max(1, 24 - `-${i}`.length))}-${i}`)
    }
    const code = buildUniqueOrganizationCode(base, taken)
    expect(code).toMatch(/-\d{3}$/)
    expect(code.startsWith(base.slice(0, 20))).toBe(true)
  })
})

describe('sanitizeOrganizationText', () => {
  it('returns empty for non-string', () => {
    expect(sanitizeOrganizationText(123, 10)).toBe('')
    expect(sanitizeOrganizationText(undefined, 10)).toBe('')
  })
  it('trims, collapses whitespace and truncates', () => {
    expect(sanitizeOrganizationText('  foo   bar  ', 10)).toBe('foo bar')
    expect(sanitizeOrganizationText('abcdefghijklmn', 5)).toBe('abcde')
  })
})

describe('mapOrganizationStatus / mapDatabaseStatus', () => {
  it('roundtrips active/inactive', () => {
    expect(mapOrganizationStatus('active')).toBe('Activa')
    expect(mapOrganizationStatus('inactive')).toBe('Inactiva')
    expect(mapDatabaseStatus('Activa')).toBe('active')
    expect(mapDatabaseStatus('Inactiva')).toBe('inactive')
    expect(mapDatabaseStatus('inactive')).toBe('inactive')
    expect(mapDatabaseStatus('something-else')).toBe('active')
  })
})

describe('toOrganization', () => {
  it('maps a record into the public Organization shape', () => {
    const result = toOrganization({
      id: 'id-1',
      code: 'CODE-1',
      name: 'Asociación Municipal',
      category: 'municipal',
      location: 'Lima',
      status: 'active',
      created_at: '2026-01-01T00:00:00.000Z',
    })
    expect(result).toEqual({
      id: 'id-1',
      slug: 'asociacion-municipal',
      code: 'CODE-1',
      name: 'Asociación Municipal',
      category: 'municipal',
      location: 'Lima',
      status: 'Activa',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('handles null created_at', () => {
    const result = toOrganization({
      id: 'x', code: 'X', name: 'x', category: 'c', location: 'l', status: 'inactive', created_at: null,
    })
    expect(result.createdAt).toBeNull()
    expect(result.status).toBe('Inactiva')
  })
})

describe('sanitizeOllaText', () => {
  it('returns empty for non-string', () => {
    expect(sanitizeOllaText(null, 5)).toBe('')
  })
  it('trims, collapses and truncates', () => {
    expect(sanitizeOllaText('  olla   comun  ', 8)).toBe('olla com')
  })
})

describe('mapOllaStatus', () => {
  it('maps active/inactive to Spanish labels', () => {
    expect(mapOllaStatus('active')).toBe('Activa')
    expect(mapOllaStatus('inactive')).toBe('Inactiva')
  })
})

describe('toOlla', () => {
  it('maps an OllaRecord into the public Olla shape', () => {
    const result = toOlla({
      id: 'o1',
      code: 'O-1',
      name: 'Olla Centro',
      address: 'Av. 123',
      latitude: -12.0,
      longitude: -77.0,
      contactName: 'Maria',
      contactPhone: '999',
      estimatedDailyCapacity: 150,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result).toEqual({
      id: 'o1',
      code: 'O-1',
      name: 'Olla Centro',
      address: 'Av. 123',
      latitude: -12.0,
      longitude: -77.0,
      contactName: 'Maria',
      contactPhone: '999',
      estimatedDailyCapacity: 150,
      status: 'Activa',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
  })
})
