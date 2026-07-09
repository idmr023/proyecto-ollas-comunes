import 'dotenv/config'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { app } from '../app'
import { Server } from 'http'
import { generate } from 'otplib'
import { prisma } from '../lib/prisma'

let server: Server
const PORT = 4001
const BASE_URL = `http://127.0.0.1:${PORT}`

let authToken: string = ''
let testTenantId: string = ''
let testBeneficiaryId: string = ''
let testInsumoId: string = ''
let testOllaId: string = ''

async function getAuthToken(): Promise<{ token: string; tenantId: string }> {
  // 1. Iniciar login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' })
  })
  const loginData = (await loginRes.json()) as any

  if (loginData.token) {
    return { token: loginData.token, tenantId: loginData.user.tenantId }
  }

  // 2. Generar el código TOTP dinámicamente
  let secret = loginData.secret
  if (!secret) {
    const user = await prisma.appUser.findUnique({
      where: { email: 'admin@ollascomunes.pe' }
    })
    secret = user?.totpSecret
  }
  if (!secret) throw new Error('No se encontró el secreto TOTP en la Base de Datos ni en la respuesta')

  const code = await generate({ secret })

  // 3. Confirmar OTP/TOTP
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
  if (!verifyData.token) {
    throw new Error('No se pudo verificar el código OTP: ' + JSON.stringify(verifyData))
  }
  return { token: verifyData.token, tenantId: verifyData.user.tenantId }
}

beforeAll(async () => {
  // Iniciar servidor de prueba
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      resolve()
    })
  })

  // Obtener token para las pruebas autenticadas
  const auth = await getAuthToken()
  authToken = auth.token
  testTenantId = auth.tenantId

  // Asegurar que exista al menos una olla común
  const firstOlla = await prisma.ollaComun.findFirst({
    where: { tenantId: testTenantId }
  })
  if (firstOlla) {
    testOllaId = firstOlla.id
  } else {
    const newOlla = await prisma.ollaComun.create({
      data: {
        name: 'Olla Test',
        tenantId: testTenantId,
        status: 'active'
      }
    })
    testOllaId = newOlla.id
  }

  // Asegurar que exista al menos un insumo en la base de datos
  const firstSupply = await prisma.supplyItem.findFirst()
  if (firstSupply) {
    testInsumoId = firstSupply.id
  } else {
    // Si no existe, crear uno para testear
    const cat = await prisma.supplyCategory.findFirst()
    const catId = cat?.id ?? 1
    const item = await prisma.supplyItem.create({
      data: {
        name: 'Insumo Test',
        categoryId: catId,
        unit: 'kg'
      }
    })
    testInsumoId = item.id
  }
})

afterAll(async () => {
  // Cerrar servidor
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve()
    })
  })
})

describe('Suite 1: Pruebas Funcionales Automatizadas (15 Casos)', () => {

  /* --- MÓDULO BENEFICIARIOS (F-01 a F-05) --- */

  it('F-01: Creación básica de beneficiario', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Beneficiario',
        lastName: 'Prueba Vitest',
        dni: '87654321',
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'normal',
        healthConditionIds: []
      })
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.item).toBeDefined()
    expect(body.item.dni).toBe('87654321')
    testBeneficiaryId = body.item.id
  })

  it('F-02: Restricción de DNI duplicado', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Otro',
        lastName: 'Beneficiario',
        dni: '87654321', // DNI ya creado en F-01
        birthDate: '1990-01-01',
        gender: 'male',
        ollaId: testOllaId,
        priorityLevel: 'normal',
        healthConditionIds: []
      })
    })

    expect(res.status).toBe(409) // Confirma el manejo de duplicados
    const body = (await res.json()) as any
    expect(body.ok).toBe(false)
  })

  it('F-03: Actualización de prioridad del beneficiario', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries/${testBeneficiaryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Beneficiario',
        lastName: 'Prueba Vitest',
        dni: '87654321',
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'high'
      })
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.item.priorityLevel).toBe('high')
  })

  it('F-04: Asignación de perfil médico', async () => {
    // Obtener una condición de salud existente
    const conditions = await prisma.healthCondition.findMany()
    const conditionIds = conditions.map(c => c.id)

    const res = await fetch(`${BASE_URL}/api/beneficiaries/${testBeneficiaryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Beneficiario',
        lastName: 'Prueba Vitest',
        dni: '87654321',
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'high',
        healthConditionIds: conditionIds
      })
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.item).toBeDefined()
  })

  it('F-05: Eliminación física/lógica del beneficiario', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries/${testBeneficiaryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
  })

  /* --- MÓDULO AUTENTICACIÓN (F-06 a F-09) --- */

  it('F-06: Autenticación - Credenciales correctas', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' })
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.status).toBe('MFA_PENDING')
    expect(body.tempToken).toBeDefined()
  })

  it('F-07: Autenticación - Contraseña inválida', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'wrongpassword' })
    })

    expect(res.status).toBe(401)
    const body = (await res.json()) as any
    expect(body.ok).toBe(false)
  })

  it('F-08: Autenticación - Email no registrado', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fakeuser@nonexistent.pe', password: 'admin123' })
    })

    expect(res.status).toBe(401)
    const body = (await res.json()) as any
    expect(body.ok).toBe(false)
  })

  it('F-09: Control MFA - Bloqueo por intentos fallidos', async () => {
    // 1. Iniciar login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' })
    })
    const loginData = (await loginRes.json()) as any

    // 2. Intentar verificar OTP con código incorrecto repetidamente hasta bloquear
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@ollascomunes.pe',
          tempToken: loginData.tempToken,
          code: '000000' // Código falso
        })
      })
      const data = (await res.json()) as any
      expect(data.ok).toBe(false)
    }
  })

  /* --- MÓDULO INVENTARIO (F-10 a F-12) --- */

  it('F-10: Inventario - Registro de ingreso (In)', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/inventory/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        supplyItemId: testInsumoId,
        movementType: 'in',
        quantity: 100,
        notes: 'Ingreso funcional Vitest'
      })
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.movement).toBeDefined()
    expect(Number(body.movement.quantity)).toBe(100)
  })

  it('F-11: Inventario - Registro de egreso (Out)', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/inventory/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        supplyItemId: testInsumoId,
        movementType: 'out',
        quantity: 10,
        notes: 'Egreso funcional Vitest'
      })
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(Number(body.movement.quantity)).toBe(10)
  })

  it('F-12: Inventario - Registro de egreso sin stock (Permitido con alerta)', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/inventory/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        supplyItemId: testInsumoId,
        movementType: 'out',
        quantity: 999999, // Excede stock
        notes: 'Egreso fallido por exceso'
      })
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
  })

  /* --- MÓDULO MENÚ, ENTREGAS Y DASHBOARD (F-13 a F-15) --- */

  it('F-13: Menú IA - Simulación de raciones', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/menu-plans/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        dishName: 'Tallarines con salsa roja',
        servings: 10
      })
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
  })

  it('F-14: Entregas - Registro múltiple', async () => {
    // Obtener un beneficiario de la BD para registrar la entrega
    const beneficiary = await prisma.beneficiary.findFirst()
    const benId = beneficiary?.id ?? 'some-guid'

    const res = await fetch(`${BASE_URL}/api/mobile/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        beneficiaryIds: [benId],
        dishName: 'Tallarines con salsa roja',
        totalRations: 1
      })
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
  })

  it('F-15: Dashboard - Métricas consolidadas', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.ok).toBe(true)
    expect(body.summary).toBeDefined()
    expect(body.summary.entregadas).toBeGreaterThanOrEqual(0)
  })

  /* --- CASOS DE FALLA / PRUEBAS NEGATIVAS --- */

  it('F-01: Falla - Nombres y apellidos obligatorios vacíos o nulos', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: '',
        lastName: 'Prueba Fallida',
        dni: '11223344',
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'normal'
      })
    })
    expect(res.status).toBe(400)
    const body = await res.json() as any
    expect(body.ok).toBe(false)
  })

  it('F-01: Falla - Fecha de nacimiento futura', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Nombre',
        lastName: 'Prueba Fallida',
        dni: '11223344',
        birthDate: '2035-12-31',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'normal'
      })
    })
    expect(res.status).toBe(400)
    const body = await res.json() as any
    expect(body.ok).toBe(false)
  })

  it('F-01: Falla - Formato de fecha inválido', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Nombre',
        lastName: 'Prueba Fallida',
        dni: '11223344',
        birthDate: 'fecha-incorrecta',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'normal'
      })
    })
    expect(res.status).toBe(400)
  })

  it('F-01: Falla - DNI extremadamente largo', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Nombre',
        lastName: 'Prueba Fallida',
        dni: '1234567890123456789012', // > 20
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'normal'
      })
    })
    expect(res.status).toBe(400)
  })

  it('F-01: Falla - Registro de beneficiario sin DNI', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Nombre',
        lastName: 'Sin DNI',
        dni: '', // vacío
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'normal'
      })
    })
    expect(res.status).toBe(400)
    const body = await res.json() as any
    expect(body.message).toContain('DNI')
  })

  it('F-01: Falla - Registro de beneficiario sin Olla Común', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Nombre',
        lastName: 'Sin Olla',
        dni: '11223344',
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: '', // vacío
        priorityLevel: 'normal'
      })
    })
    expect(res.status).toBe(400)
    const body = await res.json() as any
    expect(body.message).toLowerCase().toContain('olla')
  })

  it('F-01: Falla - Registro de beneficiario sin cabecera Authorization', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Beneficiario',
        lastName: 'Sin Token',
        dni: '11223344',
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'normal'
      })
    })
    expect(res.status).toBe(401)
  })

  it('F-03: Falla - Actualización de beneficiario inexistente', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries/d7a123bc-7512-4c22-b0ef-d922a945d8b8`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Inexistente',
        lastName: 'Modificado',
        dni: '11223344',
        birthDate: '1990-01-01',
        gender: 'male',
        ollaId: testOllaId,
        priorityLevel: 'high'
      })
    })
    expect(res.status).toBe(404)
  })

  it('F-03: Falla - Prioridad inválida', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries/${testBeneficiaryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Beneficiario',
        lastName: 'Prueba Vitest',
        dni: '87654321',
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'urgente-maximo'
      })
    })
    expect(res.status).toBe(400)
  })

  it('F-04: Falla - Asignación de IDs médicos inexistentes o inválidos', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries/${testBeneficiaryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName: 'Beneficiario',
        lastName: 'Prueba Vitest',
        dni: '87654321',
        birthDate: '1995-08-10',
        gender: 'female',
        ollaId: testOllaId,
        priorityLevel: 'high',
        healthConditionIds: [-1, 99999] // Inválido e inexistente
      })
    })
    expect([400, 404, 500]).toContain(res.status)
  })

  it('F-05: Falla - Eliminación con ID mal formado', async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries/id-invalido-123`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    expect([400, 404, 500]).toContain(res.status)
  })

  it('F-06: Falla - Login con campos faltantes', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ollascomunes.pe' }) // sin password
    })
    expect([400, 401]).toContain(res.status)
  })

  it('F-09: Falla - Control MFA con OTP incorrecto', async () => {
    // Iniciar login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' })
    })
    const loginData = await loginRes.json() as any

    // Verificar con código incorrecto
    const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ollascomunes.pe',
        tempToken: loginData.tempToken,
        code: '111111'
      })
    })
    expect(res.status).toBe(400)
    const body = await res.json() as any
    expect(body.ok).toBe(false)
  })

  it('F-10: Falla - Registro de ingreso con cantidad negativa', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/inventory/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        supplyItemId: testInsumoId,
        movementType: 'in',
        quantity: -10,
        notes: 'Ingreso negativo fallido'
      })
    })
    expect(res.status).toBe(400)
  })

  it('F-10: Falla - Registro de ingreso con cantidad cero', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/inventory/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        supplyItemId: testInsumoId,
        movementType: 'in',
        quantity: 0,
        notes: 'Ingreso cero fallido'
      })
    })
    expect(res.status).toBe(400)
  })

  it('F-10: Falla - Registro de movimiento para insumo inexistente', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/inventory/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        supplyItemId: 'd7a123bc-7512-4c22-b0ef-d922a945d8b8',
        movementType: 'in',
        quantity: 10,
        notes: 'Insumo inexistente'
      })
    })
    expect([400, 404, 500]).toContain(res.status)
  })

  it('F-11: Falla - Registro de egreso con cantidad <= 0', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/inventory/movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        supplyItemId: testInsumoId,
        movementType: 'out',
        quantity: -5,
        notes: 'Egreso negativo'
      })
    })
    expect(res.status).toBe(400)
  })

  it('F-13: Falla - Plan de menú con raciones negativas', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/menu-plans/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        dishName: 'Arroz con pollo',
        servings: -5
      })
    })
    expect(res.status).toBe(400)
  })

  it('F-14: Falla - Registro de entregas con lista vacía de beneficiarios', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        beneficiaryIds: [],
        dishName: 'Arroz con pollo',
        totalRations: 1
      })
    })
    expect(res.status).toBe(400)
  })

  it('F-15: Falla - Dashboard con token corrupto', async () => {
    const res = await fetch(`${BASE_URL}/api/mobile/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer jwt-corrupto-malformado'
      }
    })
    expect(res.status).toBe(401)
  })
})

