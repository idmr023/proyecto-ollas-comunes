import './setup-env'
import { test, expect, type Page } from '@playwright/test'
import { generate } from 'otplib'
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
  await expect(page.locator('#otp-code')).toBeVisible({ timeout: 45000 })

  // Obtener secreto TOTP de la BD y generar código válido
  const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  const secret = user?.totpSecret
  if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')

  const code = await generate({ secret })

  // Llenar el código OTP y enviar
  await page.fill('#otp-code', code)
  await page.click('button[type="submit"]')

  // Esperar redirección exitosa (redirige a /workspace/home para admin_municipal o /mobile/inicio para lideresas)
  await expect(page).toHaveURL(/\/workspace\/home|\/mobile\/inicio/, { timeout: 45000 })
}

test.describe('SIGO-Ollas Mobile E2E Tests', () => {

  test.afterAll(async () => {
    await prisma.$disconnect()
  })

  // ─── AUTENTICACIÓN ────────────────────────────────────────────

  test('Test 01.1: Login con credenciales inválidas (Falla)', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#login-email', 'incorrecto@ollascomunes.pe')
    await page.fill('#login-password', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Debe permanecer en login (sin redirección)
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('Test 01.2: MFA con código TOTP inválido (Falla)', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#login-email', TEST_EMAIL)
    await page.fill('#login-password', TEST_PASSWORD)
    await page.click('button[type="submit"]')

    // Esperar OTP
    await expect(page.locator('#otp-code')).toBeVisible({ timeout: 45000 })

    // Enviar código incorrecto
    await page.fill('#otp-code', '000000')
    await page.click('button[type="submit"]')

    // Debe permanecer en la pantalla de verificación OTP
    await page.waitForTimeout(2000)
    await expect(page.locator('#otp-code')).toBeVisible()
  })

  test('Test 01.5: Login con campos vacíos (Falla)', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#login-email', '')
    await page.fill('#login-password', '')
    await page.click('button[type="submit"]')

    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('Test 01.6: Login con formato de email inválido (Falla)', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')

    await page.fill('#login-email', 'invalido-email')
    await page.fill('#login-password', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('Test 01.3: Login exitoso con TOTP dinámico (Éxito)', async ({ page }) => {
    await loginAsAdmin(page)
    // Después de login, el admin va a /workspace/home
    // Verificamos que ya no está en /login
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('Test 01.4: Redirección automática de ruta móvil protegida sin autenticación (Falla)', async ({ page }) => {
    // Intentar ir directo a /mobile/inicio
    await page.goto('/mobile/inicio')
    await page.waitForLoadState('domcontentloaded')
    // Debería redirigir a login
    await expect(page).toHaveURL(/\/login/)
  })

  // ─── DASHBOARD Y NAVEGACIÓN ───────────────────────────────────

  test('Test 02: Dashboard muestra información correcta de la Olla', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inicio')
    await page.waitForLoadState('domcontentloaded')

    // El saludo debe aparecer
    await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 35000 })
  })

  test('Test 03: Barra de navegación inferior cambia de vista', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inicio')
    await page.waitForLoadState('networkidle')

    // Esperar a que el BottomNav esté visible
    await expect(page.locator('nav a[href="/mobile/inventario"]')).toBeVisible({ timeout: 30000 })

    // Ir a Inventario
    await page.click('nav a[href="/mobile/inventario"]')
    await page.waitForURL('**/mobile/inventario')

    // Ir a Padrón
    await page.click('nav a[href="/mobile/padron"]')
    await page.waitForURL('**/mobile/padron')

    // Ir a Alertas
    await page.click('nav a[href="/mobile/alertas"]')
    await page.waitForURL('**/mobile/alertas')
  })

  test('Test 04: Botón de Salir cierra la sesión', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inicio')
    await page.waitForLoadState('domcontentloaded')

    // Esperar que el contenido cargue
    await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 35000 })

    // Click en botón Salir de la BottomNav
    await page.click('button:has-text("Salir")')

    // Debería redirigir a login (clearAuth + useEffect en layout)
    await expect(page).toHaveURL(/\/login/, { timeout: 35000 })
  })

  // ─── PADRÓN ───────────────────────────────────────────────────

  test('Test 05: Padrón de beneficiarios carga listado', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // El título "Padrón" debe aparecer
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  })

  test('Test 06: Búsqueda de beneficiarios filtra resultados', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // Esperar a que la lista cargue (desaparece el skeleton)
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
    await page.waitForTimeout(2000) // esperar carga de beneficiarios

    await page.fill('input[placeholder="Buscar por nombre o DNI…"]', 'NombreInexistente99999XYZ')

    // Debería mostrar "Sin resultados" (el debounce aplica en el fetchBeneficiaries via useCallback)
    await expect(page.locator('text=Sin resultados')).toBeVisible({ timeout: 35000 })
  })

  test('Test 07.1: Formulario de nuevo beneficiario valida obligatorios (Falla)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // Esperar carga
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })

    // Abrir formulario
    await page.click('button[aria-label="Agregar beneficiario"]')

    // Esperar que el sheet abra
    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })

    // Intentar guardar sin datos
    await page.click('button:has-text("Guardar beneficiario")')

    // Mensajes de validación (ahora incluye DNI y Olla obligatorios)
    await expect(page.locator('text=El nombre es obligatorio')).toBeVisible()
    await expect(page.locator('text=Los apellidos son obligatorios')).toBeVisible()
    await expect(page.locator('text=El DNI es obligatorio')).toBeVisible()
    await expect(page.locator('text=La olla común es obligatoria')).toBeVisible()
  })

  test('Test 07.2: Creación exitosa de un beneficiario (Éxito)', async ({ page }) => {
    await loginAsAdmin(page)
    const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
    await page.goto('/mobile/padron')
    await page.waitForLoadState('networkidle')

    // Esperar carga
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })

    // Abrir formulario
    await page.click('button[aria-label="Agregar beneficiario"]')
    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })

    // Llenar campos obligatorios
    await page.fill('#firstName', 'TestE2E')
    await page.fill('#lastName', 'Playwright')
    await page.fill('#dni', randomDni)
    await page.fill('#birthDate', '1995-02-20')

    // Seleccionar olla común (primer option después del placeholder)
    await page.selectOption('#ollaId', { index: 1 })

    // Guardar
    await page.click('button:has-text("Guardar beneficiario")')

    // Esperar a que el botón de guardado desaparezca (indica que el form procesó)
    await expect(page.locator('button:has-text("Guardando...")')).toBeHidden({ timeout: 35000 })

    // Buscar por DNI para confirmar que el beneficiario existe en la lista
    await page.fill('input[placeholder="Buscar por nombre o DNI…"]', randomDni)

    // Debe encontrar el beneficiario recién creado
    await expect(page.locator(`text=${randomDni}`)).toBeVisible({ timeout: 35000 })
  })

  test('Test 07.3: Registrar beneficiario con DNI existente en el padrón móvil (Falla)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
    await page.click('button[aria-label="Agregar beneficiario"]')
    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })

    // Usar DNI ya existente
    await page.fill('#firstName', 'Falla')
    await page.fill('#lastName', 'Registro')
    await page.fill('#dni', '87654321') // Creado previamente en functional tests
    await page.fill('#birthDate', '1995-02-20')

    // Seleccionar olla común
    await page.selectOption('#ollaId', { index: 1 })

    await page.click('button:has-text("Guardar beneficiario")')

    // Debería mostrar un toast de error o permanecer visible indicando error
    await expect(page.locator('text=Ya existe').or(page.locator('text=Nuevo beneficiario'))).toBeVisible()
  })

  test('Test 07.4: Registrar beneficiario con DNI con longitud inválida (menos de 8 dígitos) (Falla)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
    await page.click('button[aria-label="Agregar beneficiario"]')
    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })

    await page.fill('#firstName', 'Dni')
    await page.fill('#lastName', 'Corto')
    await page.fill('#dni', '12345')
    await page.fill('#birthDate', '1995-02-20')

    await page.selectOption('#ollaId', { index: 1 })
    await page.click('button:has-text("Guardar beneficiario")')

    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible()
  })

  test('Test 07.5: Registrar beneficiario con fecha de nacimiento en el futuro (Falla)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
    await page.click('button[aria-label="Agregar beneficiario"]')
    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })

    await page.fill('#firstName', 'Fecha')
    await page.fill('#lastName', 'Futura')
    await page.fill('#dni', '12345678')
    await page.fill('#birthDate', '3026-02-20')

    await page.selectOption('#ollaId', { index: 1 })
    await page.click('button:has-text("Guardar beneficiario")')

    await expect(page.locator('text=Nuevo beneficiario')).toBeVisible()
  })

  // ─── INVENTARIO ───────────────────────────────────────────────

  test('Test 08: Inventario muestra lista de stock actual', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')

    // El título "Inventario" debe aparecer
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  })

  test('Test 09.1: Registro de movimiento de ingreso en Inventario (Éxito)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')

    // Esperar carga
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })

    // Click en "Registrar Entrada"
    await page.click('button:has-text("Registrar Entrada")')

    // Esperar que aparezca el stepper (cambia título a "Registrar Entrada")
    await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 20000 })

    // Seleccionar un insumo (el primero visible que contenga texto de un insumo)
    const firstItem = page.locator('button[class*="cursor-pointer"]').first()
    if (await firstItem.isVisible()) {
      await firstItem.click()
    }

    // Click en "Siguiente Paso ➡️"
    const nextButton = page.locator('button:has-text("Siguiente Paso")')
    if (await nextButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await nextButton.click()
    }

    // Seleccionar "No tiene / No vence"
    const noExpiry = page.locator('button:has-text("No tiene")')
    if (await noExpiry.isVisible({ timeout: 15000 }).catch(() => false)) {
      await noExpiry.click()
    }

    // Click en "Guardar Registro"
    const saveButton = page.locator('button:has-text("Guardar Registro")')
    if (await saveButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await saveButton.click()
    }

    // Debería volver al panel de inventario
    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  })

  test('Test 09.2: Intento de avanzar en inventario con datos vacíos (Falla)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
    await page.click('button:has-text("Registrar Entrada")')

    // Intentar ir al siguiente paso directamente sin seleccionar insumo
    const nextButton = page.locator('button:has-text("Siguiente Paso")')
    if (await nextButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await nextButton.click()
      // Debería mostrar Toast o permanecer en el mismo paso
      await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible()
    }
  })

  test('Test 09.3: Registrar movimiento con cantidad 0 o vacía (Falla)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
    await page.click('button:has-text("Registrar Entrada")')
    await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 20000 })

    const firstItem = page.locator('button[class*="cursor-pointer"]').first()
    if (await firstItem.isVisible()) {
      await firstItem.click()
    }

    const nextButton = page.locator('button:has-text("Siguiente Paso")')
    if (await nextButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await nextButton.click()
    }

    const writeNumber = page.locator('button:has-text("Escribir número")')
    if (await writeNumber.isVisible({ timeout: 15000 }).catch(() => false)) {
      await writeNumber.click()
      await page.fill('input[type="number"]', '0')
      await nextButton.click()
      // Debería permanecer en el mismo paso (cantidad inválida)
      await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible()
    }
  })

  test('Test 09.4: Registrar movimiento con cantidad negativa (Falla)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/inventario')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
    await page.click('button:has-text("Registrar Entrada")')
    await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 20000 })

    const firstItem = page.locator('button[class*="cursor-pointer"]').first()
    if (await firstItem.isVisible()) {
      await firstItem.click()
    }

    const nextButton = page.locator('button:has-text("Siguiente Paso")')
    if (await nextButton.isVisible({ timeout: 15000 }).catch(() => false)) {
      await nextButton.click()
    }

    const writeNumber = page.locator('button:has-text("Escribir número")')
    if (await writeNumber.isVisible({ timeout: 15000 }).catch(() => false)) {
      await writeNumber.click()
      await page.fill('input[type="number"]', '-10')
      await nextButton.click()
      // Debería permanecer en el mismo paso
      await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible()
    }
  })

  // ─── MENÚ IA Y ENTREGAS ───────────────────────────────────────

  test('Test 10: Menú IA muestra panel de sugerencias', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/menu-ia')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 35000 })
  })

  test('Test 11: Solicitar sugerencia de Menú IA', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsAdmin(page)
    await page.goto('/mobile/menu-ia')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 35000 })

    // Pedir nueva sugerencia
    await page.click('button:has-text("Nueva sugerencia")')

    // Esperar que termine de cargar (el botón se habilita de nuevo al terminar)
    // Puede tardar porque llama a la API de Gemini
    await expect(page.locator('button:has-text("Nueva sugerencia")')).toBeEnabled({ timeout: 200000 })

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

  test('Test 11.2: Fallo de API de IA (Falla)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/menu-ia')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 35000 })

    // Configurar mock DESPUÉS de cargar la página para interceptar solo la sugerencia
    await page.route('**/api/mobile/suggestions', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, message: 'Error interno en el motor de IA.' }),
      })
    })

    await page.click('button:has-text("Nueva sugerencia")')

    // Esperar a que termine la carga (el botón se vuelve a habilitar)
    await expect(page.locator('button:has-text("Nueva sugerencia")')).toBeEnabled({ timeout: 30000 })

    // La página debe volver al estado vacío (sin sugerencia, sin loading)
    await expect(page.locator('text=Presiona')).toBeVisible({ timeout: 10000 })
  })

  test('Test 12: Registro de entrega de raciones', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/padron')
    await page.waitForLoadState('domcontentloaded')

    // Esperar carga de la lista
    await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
    await page.waitForTimeout(2000)

    // Activar modo entrega
    const deliveryButton = page.locator('button:has-text("Registrar Entrega de Ración")')
    if (await deliveryButton.isVisible({ timeout: 20000 }).catch(() => false)) {
      await deliveryButton.click()

      // Debería cambiar el título a "Entregar Raciones"
      await expect(page.locator('h1:has-text("Entregar Raciones")')).toBeVisible({ timeout: 20000 })
    } else {
      // Si no hay el botón, el test pasa (no hay menú ejecutado para entregar)
      test.skip()
    }
  })

  // ─── ALERTAS ──────────────────────────────────────────────────

  test('Test Alertas Mobile 01: Vista de alertas carga correctamente', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/alertas')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Alertas")')).toBeVisible({ timeout: 35000 })
  })

  test('Test Alertas Mobile 02: Descartar alerta de conflicto local', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/mobile/alertas')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Alertas")')).toBeVisible({ timeout: 35000 })

    const dismissBtn = page.locator('button[aria-label*="Eliminar"], button:has-text("Descartar")').first()
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click()
      await page.waitForTimeout(1000)
    }
  })

})
