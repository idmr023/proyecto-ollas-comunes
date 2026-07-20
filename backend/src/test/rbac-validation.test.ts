import { describe, it, expect } from 'vitest'

import { requireRole } from '../lib/middleware/auth'
import { validate } from '../lib/middleware/validate'
import { ADMINISTRATIVE_ROLES, ALL_ROLES, PERMISSIONS, ROLES } from '../lib/permissions'
import { passwordSchema } from '../modules/auth/validators'
import {
  backupMutationSchema,
  reportDataLossSchema,
} from '../modules/notifications/validators'
import {
  createMovementSchema,
  uploadDocumentSchema,
} from '../modules/mobile/validators'
import { updateAlertSchema } from '../modules/organizations/validators'

function mockRes() {
  const res: any = {
    statusCode: 200,
    body: undefined as any,
    status(code: number) { this.statusCode = code; return this },
    json(payload: unknown) { this.body = payload; return this },
  }
  return res
}

/* ── A-5: control de acceso por rol ─────────────────────── */

describe('requireRole', () => {
  it('lets an allowed role through', () => {
    const req: any = { user: { role: ROLES.ADMIN } }
    let called = false
    requireRole(ROLES.ADMIN)(req, mockRes(), () => { called = true })
    expect(called).toBe(true)
  })

  it('answers 403 for a role outside the allow-list', () => {
    const req: any = { user: { role: ROLES.LIDERESA } }
    const res = mockRes()
    requireRole(ROLES.ADMIN)(req, res, () => { throw new Error('next should not run') })
    expect(res.statusCode).toBe(403)
  })

  it('answers 401 when there is no authenticated user', () => {
    const res = mockRes()
    requireRole(ROLES.ADMIN)({} as any, res, () => { throw new Error('next should not run') })
    expect(res.statusCode).toBe(401)
  })
})

describe('matriz de permisos', () => {
  it('reserva la gestion del tenant al administrador', () => {
    expect(PERMISSIONS.organizations.create).toEqual([ROLES.ADMIN])
    expect(PERMISSIONS.organizations.update).toEqual([ROLES.ADMIN])
    expect(PERMISSIONS.organizations.changeStatus).toEqual([ROLES.ADMIN])
  })

  it('impide que una lideresa de alta a otros usuarios', () => {
    expect(PERMISSIONS.users.create).toEqual(ADMINISTRATIVE_ROLES)
    expect(PERMISSIONS.users.create).not.toContain(ROLES.LIDERESA)
  })

  it('mantiene la operacion diaria abierta a los tres roles', () => {
    expect(PERMISSIONS.deliveries.create).toEqual(ALL_ROLES)
    expect(PERMISSIONS.inventory.createMovement).toEqual(ALL_ROLES)
  })
})

/* ── A-6: validacion de esquema ─────────────────────────── */

describe('validate middleware', () => {
  it('replaces the body with the parsed value', () => {
    const req: any = { body: { status: 'resolved' } }
    let called = false
    validate(updateAlertSchema)(req, mockRes(), () => { called = true })
    expect(called).toBe(true)
    expect(req.body.status).toBe('resolved')
  })

  it('answers 400 naming the offending field', () => {
    const req: any = { body: { status: 'no-existe' } }
    const res = mockRes()
    validate(updateAlertSchema)(req, res, () => { throw new Error('next should not run') })
    expect(res.statusCode).toBe(400)
    expect(res.body.message).toContain('status')
  })
})

describe('validadores de notifications', () => {
  it('acepta un respaldo bien formado', () => {
    const r = backupMutationSchema.safeParse({
      path: '/api/beneficiaries',
      method: 'POST',
      body: { a: 1 },
      originalTimestamp: 1_700_000_000_000,
    })
    expect(r.success).toBe(true)
  })

  it('rechaza un metodo HTTP arbitrario', () => {
    const r = backupMutationSchema.safeParse({
      path: '/x', method: 'TRACE', originalTimestamp: 1,
    })
    expect(r.success).toBe(false)
  })

  it('neutraliza saltos de linea en el mensaje que se envia por correo', () => {
    const r = reportDataLossSchema.safeParse({
      pendingCount: 1,
      failedCount: 0,
      message: 'linea1\nBcc: atacante@example.com\r\nlinea2',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.message).not.toMatch(/[\r\n]/)
    }
  })
})

describe('validadores de mobile', () => {
  it('rechaza una cantidad negativa', () => {
    const r = createMovementSchema.safeParse({
      supplyItemId: '11111111-1111-4111-8111-111111111111',
      movementType: 'in',
      quantity: -5,
    })
    expect(r.success).toBe(false)
  })

  it('rechaza un tipo de movimiento fuera del catalogo', () => {
    const r = createMovementSchema.safeParse({
      supplyItemId: '11111111-1111-4111-8111-111111111111',
      movementType: 'robo',
      quantity: 1,
    })
    expect(r.success).toBe(false)
  })

  it('rechaza un nombre de archivo con recorrido de directorios', () => {
    const r = uploadDocumentSchema.safeParse({
      fileName: '../../etc/passwd',
      documentType: 'acta',
      title: 'x',
      base64Data: 'AAAA',
    })
    expect(r.success).toBe(false)
  })

  it('rechaza un archivo por encima del tamano maximo', () => {
    const r = uploadDocumentSchema.safeParse({
      fileName: 'foto.png',
      documentType: 'acta',
      title: 'x',
      base64Data: 'A'.repeat(7_000_001),
    })
    expect(r.success).toBe(false)
  })
})

/* ── M-3: politica de contrasenas ───────────────────────── */

describe('passwordSchema', () => {
  it('rechaza contrasenas por debajo de 12 caracteres', () => {
    expect(passwordSchema.safeParse('Secret123').success).toBe(false)
  })

  it('exige mayuscula, minuscula y digito', () => {
    expect(passwordSchema.safeParse('todominusculas').success).toBe(false)
    expect(passwordSchema.safeParse('TODOMAYUSCULAS1').success).toBe(false)
    expect(passwordSchema.safeParse('SinDigitosAqui').success).toBe(false)
  })

  it('rechaza un unico caracter repetido', () => {
    expect(passwordSchema.safeParse('aaaaaaaaaaaaaa').success).toBe(false)
  })

  it('acepta una contrasena conforme', () => {
    expect(passwordSchema.safeParse('SecretPass123').success).toBe(true)
  })
})
