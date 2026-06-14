import './setup-env'
import { test, expect, type Page } from '@playwright/test'
import { generate } from 'otplib/functional'
import { prisma } from '../../backend/src/lib/prisma'

const TEST_EMAIL = 'admin@ollascomunes.pe'
const TEST_PASSWORD = 'admin123'

async function loginAsAdmin(page: Page) {
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
    await page.waitForTimeout(2000) // esperar a que se active el trigger y ocurra la recarga automática

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
})
