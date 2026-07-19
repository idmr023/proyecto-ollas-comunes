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

  await expect(page.locator('#otp-code')).toBeVisible({ timeout: 45000 })

  const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  const secret = user?.totpSecret
  if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')

  const code = await generate({ secret })

  await page.fill('#otp-code', code)
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(/\/workspace\/home/, { timeout: 45000 })
}

async function restoreNetworkAndFireOnlineEvent(page: Page, context: { setOffline: (v: boolean) => Promise<void> }) {
  await context.setOffline(false)
  await page.waitForFunction(() => navigator.onLine === true, { timeout: 10000 })
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
}

async function pollDb<T>(
  fn: () => Promise<T | null>,
  { timeoutMs = 30_000, intervalMs = 1_000 } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const result = await fn().catch(() => null)
    if (result != null) return result
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`pollDb timed out after ${timeoutMs}ms`)
}

test.describe('SIGO-Ollas Offline-First PWA E2E Tests', () => {

  test.afterAll(async () => {
    await prisma.$disconnect()
  })

  test('Test Offline: Registro offline con sincronización automática', async ({ page, context }) => {
    await loginAsAdmin(page)

    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
    await page.waitForFunction(() => document.querySelectorAll('#filter-olla option').length >= 2, { timeout: 30000 })

    await context.setOffline(true)
    await page.waitForTimeout(1000)

    await expect(page.locator('text=Sin conexión — Modo offline')).toBeVisible({ timeout: 35000 })

    const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
    await page.click('button:has-text("Registrar Beneficiario")')
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })

    await page.fill('#beneficiary-firstName', 'OfflineTest')
    await page.fill('#beneficiary-lastName', 'Playwright')
    await page.fill('#beneficiary-dni', randomDni)
    await page.fill('#beneficiary-birthDate', '1995-08-25')

    await page.selectOption('div.z-50 select', { index: 0 })

    await page.click('div.z-50 button:has-text("Registrar")')

    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 35000 })

    await expect(page.locator('text=(1 local)')).toBeVisible({ timeout: 35000 })

    await restoreNetworkAndFireOnlineEvent(page, context)

    await expect(page.locator('text=Sin conexión — Modo offline')).not.toBeVisible({ timeout: 45000 })

    const dbBeneficiary = await pollDb(() =>
      prisma.beneficiary.findFirst({ where: { firstName: 'OfflineTest', lastName: 'Playwright' } }),
    )

    expect(dbBeneficiary).not.toBeNull()
    expect(dbBeneficiary.firstName).toBe('OfflineTest')

    await prisma.beneficiary.delete({
      where: { id: dbBeneficiary.id }
    }).catch(() => {})
  })

  test('Test Offline: Registro de ración offline con sincronización', async ({ page, context }) => {
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

    const options = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' } as const
    const formatter = new Intl.DateTimeFormat('en-US', options)
    const parts = formatter.formatToParts(new Date())
    const year = parts.find(p => p.type === 'year')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    const dateString = `${year}-${month}-${day}`
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

    await loginAsAdmin(page)

    await page.route('**/api/mobile/dashboard**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          olla: { id: firstOlla.id, name: firstOlla.name, code: firstOlla.code ?? null, address: null },
          summary: {
            planificadas: 50,
            entregadas: 0,
            menu: {
              id: menuPlan!.id,
              dishName: menuPlan!.dishName,
              status: menuPlan!.status,
              maxServingsRemaining: 50,
              recipe: null
            }
          },
          expiring: []
        })
      })
    })

    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
    await page.waitForTimeout(2000)

    await context.setOffline(true)
    await page.waitForTimeout(1000)

    await page.click('button:has-text("Registrar Entrega de Ración")')
    await expect(page.locator('h1:has-text("Entregar Raciones")')).toBeVisible({ timeout: 20000 })

    await page.fill('input[placeholder="Buscar por nombre o DNI…"]', testDni)
    await page.waitForTimeout(500)
    await page.click(`button:has-text("${testDni}")`)

    await expect(page.locator('button:has-text("Confirmar")')).toBeVisible({ timeout: 10000 })
    await page.click('button:has-text("Confirmar")')

    await expect(page).toHaveURL(/\/mobile\/inicio/, { timeout: 35000 })

    await page.unroute('**/api/mobile/dashboard**')

    await restoreNetworkAndFireOnlineEvent(page, context)

    const deliveryDetail = await pollDb(() =>
      prisma.mealDeliveryDetail.findFirst({ where: { beneficiaryId: b.id } }),
    )

    if (deliveryDetail) {
      await prisma.mealDelivery.delete({
        where: { id: deliveryDetail.deliveryId }
      }).catch(() => {})
    }
    await prisma.beneficiary.delete({
      where: { id: b.id }
    }).catch(() => {})
  })

  test('Test Offline: Registro de movimiento de inventario offline con sincronización', async ({ page, context }) => {
    const firstItem = await prisma.supplyItem.findFirst()
    if (!firstItem) throw new Error('No hay insumos registrados en la base de datos')

    await loginAsAdmin(page)

    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
    await page.waitForTimeout(2000)

    await context.setOffline(true)
    await page.waitForTimeout(1000)

    await page.click('button:has-text("Registrar Entrada")')
    await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 20000 })

    await page.fill('input[placeholder="Buscar por nombre..."]', firstItem.name)
    await page.click(`text=${firstItem.name}`)

    await page.click('button:has-text("Escribir número")')
    await page.fill('input[type="number"]', '15')
    await page.click('button:has-text("Siguiente Paso")')

    await page.click('button:has-text("Guardar Registro")')

    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
    await expect(page.locator('text=(1 local)')).toBeVisible({ timeout: 20000 })

    await restoreNetworkAndFireOnlineEvent(page, context)

    const dbMovement = await pollDb(() =>
      prisma.inventoryMovement.findFirst({
        where: {
          supplyItemId: firstItem.id,
          quantity: 15,
          movementType: 'in'
        }
      }),
    )

    try {
      await prisma.inventoryMovement.delete({
        where: { id: dbMovement.id }
      })

      if (dbMovement.ollaId && dbMovement.ollaId !== '' && dbMovement.ollaId !== '""') {
        const olla = await prisma.ollaComun.findFirst({
          where: { id: dbMovement.ollaId }
        })
        if (olla && olla.id && olla.id !== '') {
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
    } catch {
    }
  })

  test('Test Offline: Control de conflictos de sincronización (DNI duplicado)', async ({ page, context }) => {
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

    await loginAsAdmin(page)

    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
    await page.waitForFunction(() => document.querySelectorAll('#filter-olla option').length >= 2, { timeout: 30000 })

    await context.setOffline(true)
    await page.waitForTimeout(1000)

    await page.click('button:has-text("Registrar Beneficiario")')
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })

    await page.fill('#beneficiary-firstName', 'DuplicadoTest')
    await page.fill('#beneficiary-lastName', 'Playwright')
    await page.fill('#beneficiary-dni', duplicateDni)
    await page.fill('#beneficiary-birthDate', '1992-06-12')

    await page.selectOption('div.z-50 select', { index: 0 })

    await page.click('div.z-50 button:has-text("Registrar")')

    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
    await expect(page.locator('text=(1 local)')).toBeVisible({ timeout: 35000 })

    await restoreNetworkAndFireOnlineEvent(page, context)

    await expect(page.locator('text=Conflictos de sincronización')).toBeVisible({ timeout: 45000 })

    await page.click('button:has-text("Revisar")')

    await expect(page.locator('text=duplicados').first()).toBeVisible({ timeout: 20000 })

    await page.click('button:has-text("Descartar todo")')
    await expect(page.locator('[data-slot="sheet-title"]:has-text("Conflictos de Sincronización")')).not.toBeVisible({ timeout: 35000 })

    await prisma.beneficiary.delete({
      where: { id: preBeneficiary.id }
    }).catch(() => {})
  })
})
