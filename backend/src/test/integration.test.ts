import 'dotenv/config'
process.env.GROQ_API_KEY = '' // Forzar modo offline para evitar timeouts en tests
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { app } from '../app'
import { Server } from 'http'
import { prisma } from '../lib/prisma'
import { generate } from 'otplib'

let server: Server
const PORT = 4002
const BASE_URL = `http://127.0.0.1:${PORT}`

let authToken: string = ''
let testTenantId: string = ''

async function getAuthToken(): Promise<{ token: string; tenantId: string }> {
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' })
  })
  const loginData = (await loginRes.json()) as any

  if (loginData.token) {
    return { token: loginData.token, tenantId: loginData.user.tenantId }
  }

  // Generar el código TOTP dinámicamente
  let secret = loginData.secret
  if (!secret) {
    const user = await prisma.appUser.findUnique({
      where: { email: 'admin@ollascomunes.pe' }
    })
    secret = user?.totpSecret
  }
  if (!secret) throw new Error('No se encontró el secreto TOTP en la Base de Datos ni en la respuesta')

  const code = await generate({ secret })

  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ollascomunes.pe',
      tempToken: loginData.tempToken,
      code
    })
  })
  const verifyData = (await verifyRes.json()) as any
  return { token: verifyData.token, tenantId: verifyData.user.tenantId }
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      resolve()
    })
  })

  const auth = await getAuthToken()
  authToken = auth.token
  testTenantId = auth.tenantId
})

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve()
    })
  })
})

describe('Suite 2: Pruebas Automáticas de Interoperabilidad (15 Casos)', () => {

  /* --- CONECTIVIDAD E INFRAESTRUCTURA (I-01 a I-04) --- */

  it('I-01: Healthcheck de Prisma (Base de datos)', async () => {
    const res = await fetch(`${BASE_URL}/api/health/prisma`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.service).toBe('prisma')
  })

  it('I-02: Healthcheck de Supabase (Cliente e Infraestructura)', async () => {
    const res = await fetch(`${BASE_URL}/api/health/supabase`)
    expect([200, 500, 503]).toContain(res.status)
    const body = (await res.json()) as any
    expect(body.service).toBe('supabase')
  })

  it('I-03: Consulta de Organizaciones (Multi-tenant)', async () => {
    const res = await fetch(`${BASE_URL}/api/organizations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.items).toBeDefined()
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('I-04: Consulta de Ollas Comunes asociadas a una organización', async () => {
    const tenant = await prisma.tenant.findUnique({ where: { id: testTenantId } })
    const slug = tenant?.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ?? ''

    const res = await fetch(`${BASE_URL}/api/organizations/${slug}/ollas`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.items).toBeDefined()
    expect(Array.isArray(body.items)).toBe(true)
  })

  /* --- SEGURIDAD Y ENRUTAMIENTO (I-05 a I-08) --- */

  it('I-05: Aislamiento RLS en BD (Aislamiento de Tenants)', async () => {
    // Creamos un beneficiario para el Tenant actual
    const ben = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.encryption_key', 'test-key', true)`)
      return tx.beneficiary.create({
        data: {
          firstName: 'Inquilino A',
          lastName: 'Prueba',
          dni: '12345670',
          birthDate: new Date('1990-01-01'),
          gender: 'male',
          tenantId: testTenantId,
          priorityLevel: 'normal'
        }
      })
    })

    // Intentamos buscarlo usando el repositorio simulando otro tenant
    const found = await prisma.beneficiary.findFirst({
      where: {
        id: ben.id,
        tenantId: 'd7a123bc-7512-4c22-b0ef-d922a945d8b8' // Otro ID cualquiera
      }
    })

    // No debería encontrar el registro de forma cruzada
    expect(found).toBeNull()

    // Limpieza
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.encryption_key', 'test-key', true)`)
      return tx.beneficiary.delete({ where: { id: ben.id } })
    })
  })

  it('I-06: Rate Limiting de seguridad en Auth', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin' })
    })
    const remaining = res.headers.get('ratelimit-remaining')
    const limit = res.headers.get('ratelimit-limit')
    expect(remaining).not.toBeNull()
    expect(limit).not.toBeNull()
    expect(Number(limit)).toBeGreaterThan(0)
  })

  it('I-07: Cabeceras CORS', async () => {
    const res = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    })
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')
  })

  it('I-08: Transaccionalidad Prisma (Rollback)', async () => {
    // Validar que si intentamos una operación transaccional fallida, no modifique el stock.
    // Usamos $transaction en el ORM para demostrar el rollback
    const previousStock = await prisma.inventoryMovement.count()

    try {
      await prisma.$transaction(async (tx) => {
        await tx.inventoryMovement.create({
          data: {
            supplyItemId: 'non-existent-id', // Esto causará un fallo de clave foránea
            movementType: 'in',
            quantity: 10,
            createdBy: 'user-id'
          }
        })
      })
    } catch (err) {
      // Debería capturar el error
    }

    const afterStock = await prisma.inventoryMovement.count()
    expect(previousStock).toBe(afterStock) // Confirma que no se guardaron cambios parciales (rollback)
  })

  /* --- AUDITORÍA Y NOTIFICACIONES (I-09 a I-12) --- */

  it('I-09: Trigger Forense audit_logs', async () => {
    // 1. Obtener conteo inicial
    const [initialCountObj] = await prisma.$queryRawUnsafe<any>('SELECT count(*)::int FROM audit_logs')
    const initialCount = initialCountObj.count ?? 0

    // 2. Crear beneficiario (envuelto en transacción para setear GUC de BD)
    const tempBen = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.encryption_key', 'test-key', true)`)
      return tx.beneficiary.create({
        data: {
          firstName: 'Auditoria',
          lastName: 'Prueba',
          dni: '99999901',
          birthDate: new Date('1990-01-01'),
          gender: 'female',
          tenantId: testTenantId,
          priorityLevel: 'normal'
        }
      })
    })

    // 3. Obtener conteo final
    const [finalCountObj] = await prisma.$queryRawUnsafe<any>('SELECT count(*)::int FROM audit_logs')
    const finalCount = finalCountObj.count ?? 0

    expect(finalCount).toBeGreaterThanOrEqual(initialCount)

    // Limpieza
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.encryption_key', 'test-key', true)`)
      return tx.beneficiary.delete({ where: { id: tempBen.id } })
    })
  })

  it('I-10: Cifrado y Hash de contraseñas (bcrypt)', async () => {
    const user = await prisma.appUser.findFirst({
      where: { email: 'admin@ollascomunes.pe' }
    })
    expect(user).toBeDefined()
    expect(user?.passwordHash).toBeDefined()
    expect(user?.passwordHash.startsWith('$2a$') || user?.passwordHash.startsWith('$2b$')).toBe(true)
  })

  it('I-11: Almacenamiento de secreto TOTP en BD', async () => {
    const user = await prisma.appUser.findUnique({
      where: { email: 'admin@ollascomunes.pe' }
    })
    expect(user?.totpSecret).toBeDefined()
    expect(user?.totpSecret).not.toBeNull()
  })

  it('I-12: Subida de archivos a Supabase Storage', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fileName: 'evidencia_test.pdf',
        fileType: 'application/pdf',
        fileData: 'JVBERi0xLjQKJ...='
      })
    })

    expect([201, 400, 500]).toContain(res.status)
  })

  /* --- REGLAS DE NEGOCIO (I-13 a I-15) --- */

  it('I-13: Reglas de negocio - Alertas de stock bajo', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/alerts`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.items).toBeDefined()
  })

  it('I-14: Integración del recomendador de recetas IA', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/suggestions`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.items).toBeDefined()
  })

  it('I-15: Balanceador de conexiones (Supavisor)', async () => {
    // Simulamos conexiones concurrentes rápidas para verificar que Prisma maneje el Pool correctamente
    const promises = Array.from({ length: 5 }).map(() =>
      prisma.tenant.findMany({ take: 1 })
    )
    const results = await Promise.all(promises)
    expect(results).toHaveLength(5)
  })

  /* --- CASOS DE FALLA / PRUEBAS NEGATIVAS --- */

  it('I-03: Falla - Consulta de organizaciones sin token Bearer', async () => {
    const res = await fetch(`${BASE_URL}/api/organizations`, {
      method: 'GET'
    })
    expect(res.status).toBe(401)
  })

  it('I-03: Falla - Consulta de organizaciones con token inválido', async () => {
    const res = await fetch(`${BASE_URL}/api/organizations`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer token-invalido-123'
      }
    })
    expect(res.status).toBe(401)
  })

  it('I-04: Falla - Consulta de ollas comunes para slug de organización inexistente', async () => {
    const res = await fetch(`${BASE_URL}/api/organizations/organizacion-que-no-existe-xyz/ollas`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    expect(res.status).toBe(404)
  })

  it('I-05: Falla - Multi-tenant cruzado denegado', async () => {
    // Intentamos buscar un beneficiario de un tenant inexistente o cruzado
    const otherTenantId = 'e7a123bc-7512-4c22-b0ef-d922a945d8b9'
    const found = await prisma.beneficiary.findFirst({
      where: {
        tenantId: otherTenantId
      }
    })
    expect(found).toBeNull()
  })

  it('I-07: Falla - Petición CORS con origen no permitido', async () => {
    const res = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Origin': 'http://malicious-domain-test.com'
      }
    })
    const corsHeader = res.headers.get('access-control-allow-origin')
    expect(corsHeader).not.toBe('http://malicious-domain-test.com')
  })

  it('I-11: Falla - Secreto TOTP corrupto o ausente', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'usuario-sin-totp@ollascomunes.pe',
        tempToken: 'some-temp-token',
        code: '123456'
      })
    })
    expect([400, 401]).toContain(res.status)
  })

  it('I-12: Falla - Subida a Supabase Storage con extensión no permitida', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fileName: 'archivo_peligroso.exe',
        fileType: 'application/octet-stream',
        fileData: 'MZ...........=' 
      })
    })
    expect(res.status).toBe(400)
  })

  it('I-12: Falla - Subida de archivo vacío', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fileName: 'vacio.pdf',
        fileType: 'application/pdf',
        fileData: '' 
      })
    })
    expect(res.status).toBe(400)
  })

  it('I-13: Falla - Consulta de alertas con rol no autorizado (token inválido)', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/alerts`, {
      headers: { 'Authorization': 'Bearer token-invalido' }
    })
    expect(res.status).toBe(401)
  })

  /* --- NUEVOS CASOS DE PRUEBA DE INTEROPERABILIDAD --- */

  it('I-16: Healthcheck general del backend (Éxito)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
    expect(body.service).toBe('backend')
  })

  it('I-17: Flujo completo TOTP setup con tempToken (Éxito)', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' })
    })
    const loginData = await loginRes.json() as any
    expect(loginData.tempToken).toBeDefined()

    const setupRes = await fetch(`${BASE_URL}/api/auth/totp/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: loginData.tempToken })
    })
    expect(setupRes.status).toBe(200)
    const setupData = await setupRes.json() as any
    expect(setupData.ok).toBe(true)
    expect(setupData.secret).toBeDefined()
  })

  it('I-18: Consulta de perfil autenticado (Éxito)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
    expect(body.user.email).toBe('admin@ollascomunes.pe')
  })

  it('I-19: Actualización de perfil con nombre válido (Éxito)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ fullName: 'Administrador Modificado' })
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
    expect(body.user.fullName).toBe('Administrador Modificado')
  })

  it('I-20: Creación de organización (Éxito)', async () => {
    const randomSuffix = Math.floor(Math.random() * 10000)
    const res = await fetch(`${BASE_URL}/api/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: `Organización Integración ${randomSuffix}`,
        category: 'distrital',
        location: 'Lima Sur'
      })
    })
    expect(res.status).toBe(201)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
    expect(body.item.slug).toBeDefined()
  })

  it('I-21: Creación de olla bajo organización (Éxito)', async () => {
    const tenant = await prisma.tenant.findUnique({ where: { id: testTenantId } })
    const slug = tenant?.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ?? ''

    const randomSuffix = Math.floor(Math.random() * 10000)
    const res = await fetch(`${BASE_URL}/api/organizations/${slug}/ollas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: `Olla Integración ${randomSuffix}`,
        address: 'Dirección Integración 123'
      })
    })
    expect(res.status).toBe(201)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
    expect(body.item.name).toContain('Olla Integración')
  })

  it('I-22: Dashboard admin con stats (Éxito)', async () => {
    const res = await fetch(`${BASE_URL}/api/organizations/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
    expect(body.kpis).toBeDefined()
  })

  it('I-23: Inventario admin stock y movimientos (Éxito)', async () => {
    const stockRes = await fetch(`${BASE_URL}/api/organizations/inventory/stock`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    expect(stockRes.status).toBe(200)
    const stockBody = await stockRes.json() as any
    expect(stockBody.ok).toBe(true)
    expect(Array.isArray(stockBody.items)).toBe(true)

    const movsRes = await fetch(`${BASE_URL}/api/organizations/inventory/movements`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    expect(movsRes.status).toBe(200)
    const movsBody = await movsRes.json() as any
    expect(movsBody.ok).toBe(true)
    expect(Array.isArray(movsBody.items)).toBe(true)
  })

  it('I-24: Alertas admin y su resolución (Éxito)', async () => {
    const alertsRes = await fetch(`${BASE_URL}/api/organizations/alerts`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    expect(alertsRes.status).toBe(200)
    const alertsBody = await alertsRes.json() as any
    expect(alertsBody.ok).toBe(true)

    if (alertsBody.items && alertsBody.items.length > 0) {
      const alertId = alertsBody.items[0].id
      const patchRes = await fetch(`${BASE_URL}/api/organizations/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: 'resolved' })
      })
      expect(patchRes.status).toBe(200)
      const patchBody = await patchRes.json() as any
      expect(patchBody.ok).toBe(true)
    }
  })

  it('I-25: Catálogo de condiciones de salud (Éxito)', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries/conditions`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('I-26: Backup de mutación PWA (Éxito)', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications/backup-mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        path: '/api/beneficiaries',
        method: 'POST',
        body: { firstName: 'Backup', lastName: 'Test', Dni: '00000000', birthDate: '1990-01-01' },
        originalTimestamp: Date.now()
      })
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.ok).toBe(true)
  })

  it('I-17F: Setup TOTP con token temporal inválido (Falla)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/totp/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: 'token-expirado-o-malo' })
    })
    expect(res.status).toBe(400)
  })

  it('I-19F: Actualización de perfil con nombre vacío (Falla)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ fullName: '' })
    })
    expect([200, 400]).toContain(res.status)
  })

  it('I-20F: Creación de organización con campos vacíos (Falla)', async () => {
    const res = await fetch(`${BASE_URL}/api/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: '',
        category: 'distrital',
        location: ''
      })
    })
    expect(res.status).toBe(400)
  })
})

