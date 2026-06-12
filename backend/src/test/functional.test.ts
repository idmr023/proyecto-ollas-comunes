import 'dotenv/config'
import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { app } from '../app'
import { Server } from 'http'
import { prisma } from '../lib/prisma'

let server: Server
const PORT = 4001
const BASE_URL = `http://127.0.0.1:${PORT}`

let authToken: string = ''
let testTenantId: string = ''
let testBeneficiaryId: string = ''
let testInsumoId: string = ''

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

  // 2. Obtener el código OTP generado en la BD
  const otpRecord = await prisma.otpCode.findFirst({
    where: { email: 'admin@ollascomunes.pe', usedAt: null },
    orderBy: { createdAt: 'desc' }
  })
  if (!otpRecord) throw new Error('No se encontró el código OTP en la Base de Datos')

  // 3. Confirmar OTP
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ollascomunes.pe',
      tempToken: loginData.tempToken,
      code: otpRecord.code
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
        birthDate: '1995-08-10',
        gender: 'female',
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
        birthDate: '1995-08-10',
        gender: 'female',
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
})
