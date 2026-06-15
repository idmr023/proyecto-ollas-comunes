import './setup-env'
import { test, expect, type Page } from '@playwright/test'
import { generate } from 'otplib'
import { prisma } from '../../backend/src/lib/prisma'

const TEST_EMAIL = 'admin@ollascomunes.pe'
const TEST_PASSWORD = 'admin123'

async function loginAsAdmin(page: Page) {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message))

  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')

  await page.fill('#login-email', TEST_EMAIL)
  await page.fill('#login-password', TEST_PASSWORD)
  await page.click('button[type="submit"]')

  await expect(page.locator('#otp-code')).toBeVisible({ timeout: 15000 })

  const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  const secret = user?.totpSecret
  if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')

  const code = await generate({ secret })

  await page.fill('#otp-code', code)
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(/\/workspace\/home/, { timeout: 15000 })
}

test.describe('SIGO-Ollas Offline-First PWA E2E Tests', () => {

  test.afterAll(async () => {
    await prisma.$disconnect()
  })

  test('Test Offline: Registro offline con sincronización automática', async ({ page, context }) => {
    // 1. Iniciar sesión online
    await loginAsAdmin(page)

    // 2. Navegar a beneficiarios para cargar la caché inicial
    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })

    // 3. Simular desconexión completa (modo offline)
    await context.setOffline(true)
    await page.waitForTimeout(1000) // esperar propagación del evento offline

    // 4. Verificar que el banner offline esté presente
    await expect(page.locator('text=Sin conexión — Modo offline activo')).toBeVisible({ timeout: 10000 })

    // 5. Generar DNI aleatorio y registrar un beneficiario offline
    const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
    await page.click('button:has-text("Registrar Beneficiario")')
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 5000 })

    await page.fill('#firstName', 'OfflineTest')
    await page.fill('#lastName', 'Playwright')
    await page.fill('#dni', randomDni)
    await page.fill('#birthDate', '1995-08-25')

    // Confirmar registro (se guardará en la cola IndexedDB)
    await page.click('div.z-50 button:has-text("Registrar")')

    // El modal debería cerrarse e inyectar el cambio localmente
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 10000 })

    // 6. Verificar que el banner ahora indica que hay un cambio guardado localmente
    await expect(page.locator('text=(1 guardado(s) local)')).toBeVisible({ timeout: 10000 })

    // 7. Simular reconexión de red (modo online)
    await context.setOffline(false)
    await page.waitForTimeout(4000) // esperar a que se active el trigger y ocurra la recarga automática

    // 8. El banner de sincronizando/offline debería desaparecer tras la recarga y la sincronización exitosa
    await expect(page.locator('text=Sin conexión — Modo offline activo')).not.toBeVisible({ timeout: 15000 })

    // 9. Verificar en la base de datos Postgres real que el beneficiario haya sido persistido por la sincronización
    const dbBeneficiary = await prisma.beneficiary.findUnique({
      where: { dni: randomDni }
    })

    expect(dbBeneficiary).not.toBeNull()
    expect(dbBeneficiary?.firstName).toBe('OfflineTest')

    // Limpieza: eliminar el beneficiario de pruebas de la base de datos
    if (dbBeneficiary) {
      await prisma.beneficiary.delete({
        where: { id: dbBeneficiary.id }
      })
    }
  })

  test('Test Offline: Registro de ración offline con sincronización', async ({ page, context }) => {
    // 1. Crear un beneficiario de prueba en la base de datos para esta prueba
    const testDni = Math.floor(10000000 + Math.random() * 90000000).toString()
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) throw new Error('No hay tenants en base de datos para las pruebas')
    const firstOlla = await prisma.ollaComun.findFirst({
      where: { tenantId: tenant.id, status: 'active' },
      orderBy: { name: 'asc' }
    })
    if (!firstOlla) throw new Error('No hay ollas activas en base de datos para las pruebas')
    
    const b = await prisma.beneficiary.create({
      data: {
        firstName: 'RacionTest',
        lastName: 'Playwright',
        dni: testDni,
        birthDate: new Date('1990-01-01'),
        ollaId: firstOlla.id,
        tenantId: tenant.id
      }
    })

    // Asegurar que exista un plan de menú hoy para evitar el fallback del recomendador IA offline
    const options = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' } as const
    const formatter = new Intl.DateTimeFormat('en-US', options)
    const parts = formatter.formatToParts(new Date())
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    const dateString = `${year}-${month}-${day}` // "YYYY-MM-DD"
    const operationDate = new Date(dateString)

    let menuPlan = await prisma.menuPlan.findFirst({
      where: {
        ollaId: firstOlla.id,
        operationDate
      }
    })
    if (!menuPlan) {
      menuPlan = await prisma.menuPlan.create({
        data: {
          ollaId: firstOlla.id,
          operationDate,
          dishName: 'Tallarines con salsa',
          plannedServings: 50,
          status: 'approved',
          suggestedByType: 'user',
          createdBy: (await prisma.appUser.findFirst())?.id
        }
      })
    }

    // 2. Iniciar sesión online
    await loginAsAdmin(page)

    // 3. Ir a la vista móvil del padrón para cargar la caché local
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000) // permitir que IndexedDB guarde la caché de beneficiarios

    // 4. Simular desconexión
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    // 5. Activar modo entrega e ingresar la entrega offline
    await page.click('button:has-text("Registrar Entrega de Ración")')
    await expect(page.locator('h1:has-text("Entregar Raciones")')).toBeVisible({ timeout: 5000 })

    // Seleccionar nuestro beneficiario de prueba
    await page.fill('input[placeholder="Buscar por nombre o DNI…"]', testDni)
    await page.waitForTimeout(500)
    await page.click(`text=${testDni}`) // hacer clic en la tarjeta

    // Confirmar entrega (esto encola la mutación offline e inyecta hasEatenToday = true)
    await page.click('button:has-text("Confirmar")')
    
    // Verificamos toast de éxito offline y redirección a inicio
    await expect(page).toHaveURL(/\/mobile\/inicio/, { timeout: 10000 })

    // 6. Simular reconexión
    await context.setOffline(false)
    await page.waitForTimeout(4000) // esperar sincronización y recarga automática

    // 7. Verificar en la base de datos Postgres real que se haya creado la entrega (MealDeliveryDetail)
    const deliveryDetail = await prisma.mealDeliveryDetail.findFirst({
      where: { beneficiaryId: b.id }
    })
    expect(deliveryDetail).not.toBeNull()

    // Limpieza
    if (deliveryDetail) {
      await prisma.mealDelivery.delete({
        where: { id: deliveryDetail.deliveryId }
      })
    }
    await prisma.beneficiary.delete({
      where: { id: b.id }
    })
  })

  test('Test Offline: Registro de movimiento de inventario offline con sincronización', async ({ page, context }) => {
    // 1. Obtener un insumo válido de la base de datos
    const firstItem = await prisma.supplyItem.findFirst()
    if (!firstItem) throw new Error('No hay insumos registrados en la base de datos')

    // 2. Iniciar sesión online
    await loginAsAdmin(page)

    // 3. Cargar la vista de inventario móvil para cachear
    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000) // esperar caché

    // 4. Simular desconexión
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    // 5. Realizar el movimiento de Entrada
    await page.click('button:has-text("Registrar Entrada")')
    await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 5000 })

    // Buscar y seleccionar el insumo
    await page.fill('input[placeholder="Buscar por nombre..."]', firstItem.name)
    await page.click(`text=${firstItem.name}`)

    // Llenar cantidad
    await page.click('button:has-text("Escribir número")')
    await page.fill('input[type="number"]', '15')
    await page.click('button:has-text("Siguiente Paso")')

    // Guardar
    await page.click('button:has-text("Guardar Registro")')

    // Debe volver al panel de inventario y mostrar toast/banner offline con 1 cambio guardado
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=(1 guardado(s) local)')).toBeVisible({ timeout: 5000 })

    // 6. Simular reconexión
    await context.setOffline(false)
    await page.waitForTimeout(4000)

    // 7. Verificar en la base de datos Postgres real que el movimiento de inventario fue creado
    const dbMovement = await prisma.inventoryMovement.findFirst({
      where: {
        supplyItemId: firstItem.id,
        quantity: 15,
        movementType: 'in'
      }
    })
    expect(dbMovement).not.toBeNull()

    // Limpieza
    if (dbMovement) {
      await prisma.inventoryMovement.delete({
        where: { id: dbMovement.id }
      })
      // Descontar del stock para no perturbar otros tests
      const olla = await prisma.ollaComun.findFirst({
        where: { id: dbMovement.ollaId }
      })
      if (olla) {
        const stock = await prisma.inventoryStock.findUnique({
          where: { ollaId_supplyItemId: { ollaId: olla.id, supplyItemId: firstItem.id } }
        })
        if (stock) {
          await prisma.inventoryStock.update({
            where: { ollaId_supplyItemId: { ollaId: olla.id, supplyItemId: firstItem.id } },
            data: { quantity: Math.max(0, Number(stock.quantity) - 15) }
          })
        }
      }
    }
  })

  test('Test Offline: Control de conflictos de sincronización (DNI duplicado)', async ({ page, context }) => {
    // 1. Crear un beneficiario previo en la base de datos
    const duplicateDni = Math.floor(10000000 + Math.random() * 90000000).toString()
    const firstOlla = await prisma.ollaComun.findFirst()
    const tenant = await prisma.tenant.findFirst()
    if (!firstOlla || !tenant) throw new Error('No hay organizacion disponible')

    const preBeneficiary = await prisma.beneficiary.create({
      data: {
        firstName: 'Original',
        lastName: 'Playwright',
        dni: duplicateDni,
        birthDate: new Date('1990-01-01'),
        ollaId: firstOlla.id,
        tenantId: tenant.id
      }
    })

    // 2. Iniciar sesión online
    await loginAsAdmin(page)

    // 3. Ir a beneficiarios para cargar caché
    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })

    // 4. Simular desconexión
    await context.setOffline(true)
    await page.waitForTimeout(1000)

    // 5. Registrar un beneficiario offline con el MISMO DNI
    await page.click('button:has-text("Registrar Beneficiario")')
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 5000 })

    await page.fill('#firstName', 'DuplicadoTest')
    await page.fill('#lastName', 'Playwright')
    await page.fill('#dni', duplicateDni)
    await page.fill('#birthDate', '1992-06-12')
    await page.click('div.z-50 button:has-text("Registrar")')

    // El modal debería cerrarse e inyectar el cambio localmente
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=(1 guardado(s) local)')).toBeVisible({ timeout: 10000 })

    // 6. Simular reconexión (esta mutación fallará con 409 debido al DNI duplicado)
    await context.setOffline(false)
    await page.waitForTimeout(4000) // esperar sync, fallo y recarga automática

    // 7. Debería mostrarse la alerta visual de conflictos en pantalla
    await expect(page.locator('text=conflicto(s) de sincronización')).toBeVisible({ timeout: 15000 })

    // 8. Hacer clic en "Revisar" para abrir el panel detallado
    await page.click('button:has-text("Revisar")')
    
    // El panel desplegable debe mostrar el error lógico descriptivo
    await expect(page.locator('text=Ya existe un beneficiario con ese DNI')).toBeVisible({ timeout: 5000 })

    // 9. Descartar el conflicto para limpiar la UI
    await page.click('button:has-text("Descartar todo")')
    await expect(page.locator('text=conflicto(s) de sincronización')).not.toBeVisible({ timeout: 10000 })

    // Limpieza
    await prisma.beneficiary.delete({
      where: { id: preBeneficiary.id }
    })
  })
})
