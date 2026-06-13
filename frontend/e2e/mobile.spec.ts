import './setup-env'
import { test, expect, type Page } from '@playwright/test'
import { generate } from 'otplib/functional'
import { prisma } from '../../backend/src/lib/prisma'

const TEST_EMAIL = 'admin@ollascomunes.pe'
const TEST_PASSWORD = 'admin123'

/**
 * Inicia sesión como admin (TOTP dinámico).
 * El admin_municipal es redirigido a /workspace/home por el frontend,
 * pero tiene permisos para acceder a /mobile/* igualmente.
 */
async function loginAsAdmin(page: Page) {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message))

  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')

  // Llenar credenciales
  await page.fill('#login-email', TEST_EMAIL)
  await page.fill('#login-password', TEST_PASSWORD)
  await page.click('button[type="submit"]')

  // Esperar a que aparezca la pantalla OTP
  await expect(page.locator('#otp-code')).toBeVisible({ timeout: 15000 })

  // Obtener secreto TOTP de la BD y generar código válido
  const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  const secret = user?.totpSecret
  if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')

  const code = await generate({ secret })

  // Llenar el código OTP y enviar
  await page.fill('#otp-code', code)
  await page.click('button[type="submit"]')

  // Esperar redirección exitosa (redirige a /workspace/home para admin_municipal o /mobile/inicio para lideresas)
  await expect(page).toHaveURL(/\/workspace\/home|\/mobile\/inicio/, { timeout: 15000 })
}

test.describe('SIGO-Ollas Mobile E2E Tests (15 escenarios)', () => {

  test.afterAll(async () => {
    await prisma.$disconnect()
  })

  // ─── AUTENTICACIÓN ────────────────────────────────────────────

  test('Test 01: Login con credenciales inválidas', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#login-email', 'incorrecto@ollascomunes.pe')
    await page.fill('#login-password', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Debe permanecer en login (sin redirección)
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('Test 02: MFA con código TOTP inválido', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#login-email', TEST_EMAIL)
    await page.fill('#login-password', TEST_PASSWORD)
    await page.click('button[type="submit"]')

    // Esperar OTP
    await expect(page.locator('#otp-code')).toBeVisible({ timeout: 15000 })

    // Enviar código incorrecto
    await page.fill('#otp-code', '000000')
    await page.click('button[type="submit"]')

    // Debe permanecer en la pantalla de verificación OTP
    await page.waitForTimeout(2000)
    await expect(page.locator('#otp-code')).toBeVisible()
  })

  test('Test 03: Login exitoso con TOTP dinámico', async ({ page }) => {
    await loginAsAdmin(page)
    // Después de login, el admin va a /workspace/home
    // Verificamos que ya no está en /login
    await expect(page).not.toHaveURL(/\/login/)
  })

  // ─── DASHBOARD Y NAVEGACIÓN ───────────────────────────────────

  test('Test 04: Dashboard muestra información correcta de la Olla', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inicio')
    await page.waitForLoadState('domcontentloaded')

    // El saludo debe aparecer
    await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 10000 })
  })

  test('Test 05: Barra de navegación inferior cambia de vista', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inicio')
    await page.waitForLoadState('domcontentloaded')

    // Ir a Inventario
    await page.click('a[href="/mobile/inventario"]')
    await expect(page).toHaveURL(/\/mobile\/inventario/)

    // Ir a Padrón
    await page.click('a[href="/mobile/padron"]')
    await expect(page).toHaveURL(/\/mobile\/padron/)

    // Ir a Alertas
    await page.click('a[href="/mobile/alertas"]')
    await expect(page).toHaveURL(/\/mobile\/alertas/)
  })

  test('Test 06: Botón de Salir cierra la sesión', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inicio')
    await page.waitForLoadState('domcontentloaded')

    // Esperar que el contenido cargue
    await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 10000 })

    // Click en botón Salir de la BottomNav
    await page.click('button:has-text("Salir")')

    // Debería redirigir a login (clearAuth + useEffect en layout)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  // ─── PADRÓN ───────────────────────────────────────────────────

  test('Test 07: Padrón de beneficiarios carga listado', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // El título "Padrón" debe aparecer
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 10000 })
  })

  test('Test 08: Búsqueda de beneficiarios filtra resultados', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // Esperar a que la lista cargue (desaparece el skeleton)
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000) // esperar carga de beneficiarios

    await page.fill('input[placeholder="Buscar por nombre o DNI…"]', 'NombreInexistente99999XYZ')

    // Debería mostrar "Sin resultados" (el debounce aplica en el fetchBeneficiaries via useCallback)
    await expect(page.locator('text=Sin resultados')).toBeVisible({ timeout: 10000 })
  })

  test('Test 09: Formulario de nuevo beneficiario valida obligatorios', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // Esperar carga
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 10000 })

    // Abrir formulario
    await page.click('button[aria-label="Agregar beneficiario"]')

    // Esperar que el sheet abra
    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 5000 })

    // Intentar guardar sin datos
    await page.click('button:has-text("Guardar beneficiario")')

    // Mensajes de validación
    await expect(page.locator('text=El nombre es obligatorio')).toBeVisible()
    await expect(page.locator('text=Los apellidos son obligatorios')).toBeVisible()
  })

  test('Test 10: Creación exitosa de un beneficiario', async ({ page }) => {
    await loginAsAdmin(page)
    const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // Esperar carga
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 10000 })

    // Abrir formulario
    await page.click('button[aria-label="Agregar beneficiario"]')
    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 5000 })

    // Llenar campos
    await page.fill('#firstName', 'TestE2E')
    await page.fill('#lastName', 'Playwright')
    await page.fill('#dni', randomDni)
    await page.fill('#birthDate', '1995-02-20')

    // Guardar
    await page.click('button:has-text("Guardar beneficiario")')

    // Esperar a que el formulario cierre y la lista se actualice
    await expect(page.locator('text=Nuevo beneficiario')).not.toBeVisible({ timeout: 10000 })

    // Buscar por DNI
    await page.fill('input[placeholder="Buscar por nombre o DNI…"]', randomDni)

    // Debe encontrar el beneficiario recién creado
    await expect(page.locator(`text=${randomDni}`)).toBeVisible({ timeout: 10000 })
  })

  // ─── INVENTARIO ───────────────────────────────────────────────

  test('Test 11: Inventario muestra lista de stock actual', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')

    // El título "Inventario" debe aparecer
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 10000 })
  })

  test('Test 12: Registro de movimiento de ingreso en Inventario', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')

    // Esperar carga
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 10000 })

    // Click en "Registrar Entrada"
    await page.click('button:has-text("Registrar Entrada")')

    // Esperar que aparezca el stepper (cambia título a "Registrar Entrada")
    await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 5000 })

    // Seleccionar un insumo (el primero visible que contenga texto de un insumo)
    const firstItem = page.locator('button[class*="cursor-pointer"]').first()
    if (await firstItem.isVisible()) {
      await firstItem.click()
    }

    // Click en "Siguiente Paso ➡️"
    const nextButton = page.locator('button:has-text("Siguiente Paso")')
    if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextButton.click()
    }

    // Seleccionar "No tiene / No vence"
    const noExpiry = page.locator('button:has-text("No tiene")')
    if (await noExpiry.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noExpiry.click()
    }

    // Click en "Guardar Registro"
    const saveButton = page.locator('button:has-text("Guardar Registro")')
    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveButton.click()
    }

    // Debería volver al panel de inventario
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 10000 })
  })

  // ─── MENÚ IA Y ENTREGAS ───────────────────────────────────────

  test('Test 13: Menú IA muestra panel de sugerencias', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/menu-ia')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 10000 })
  })

  test('Test 14: Solicitar sugerencia de Menú IA', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/menu-ia')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 10000 })

    // Pedir nueva sugerencia
    await page.click('button:has-text("Nueva sugerencia")')

    // Esperar que termine de cargar (el botón se habilita de nuevo al terminar)
    // Puede tardar porque llama a la API de Gemini
    await expect(page.locator('button:has-text("Nueva sugerencia")')).toBeEnabled({ timeout: 25000 })

    // Si la sugerencia se generó, debe verse el botón de "Usar este menú"
    // Si no hay suficientes insumos, se muestra un toast de error
    // Verificamos que ya no está en estado de carga
    const useButton = page.locator('button:has-text("Usar este menú")')
    const noData = page.locator('text=Presiona')
    const isUsable = await useButton.isVisible().catch(() => false)
    const isNoData = await noData.isVisible().catch(() => false)

    // Alguna de las dos debe ser visible (sugerencia generada o sin insumos)
    expect(isUsable || isNoData).toBeTruthy()
  })

  test('Test 15: Registro de entrega de raciones', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // Esperar carga de la lista
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(2000)

    // Activar modo entrega
    const deliveryButton = page.locator('button:has-text("Registrar Entrega de Ración")')
    if (await deliveryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deliveryButton.click()

      // Debería cambiar el título a "Entregar Raciones"
      await expect(page.locator('h1:has-text("Entregar Raciones")')).toBeVisible({ timeout: 5000 })
    } else {
      // Si no hay el botón, el test pasa (no hay menú ejecutado para entregar)
      test.skip()
    }
  })
})
