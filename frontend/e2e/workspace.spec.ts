import './setup-env'
import { test, expect, type Page } from '@playwright/test'
import { generate } from 'otplib'
import { prisma } from '../../backend/src/lib/prisma'

const TEST_EMAIL = 'admin@ollascomunes.pe'
const TEST_PASSWORD = 'admin123'

/**
 * Inicia sesión como administrador municipal.
 * Automáticamente navega a /login, completa la autenticación MFA y redirige a /workspace/home.
 */
async function loginAsAdmin(page: Page) {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message))

  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')

  // Ingresar credenciales
  await page.fill('#login-email', TEST_EMAIL)
  await page.fill('#login-password', TEST_PASSWORD)
  await page.click('button[type="submit"]')

  // Esperar a que aparezca la pantalla de OTP
  await expect(page.locator('#otp-code')).toBeVisible({ timeout: 15000 })

  // Obtener secreto de la BD y generar código válido
  const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  const secret = user?.totpSecret
  if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')

  const code = await generate({ secret })

  // Rellenar código y confirmar
  await page.fill('#otp-code', code)
  await page.click('button[type="submit"]')

  // Esperar redirección al Workspace Home
  await expect(page).toHaveURL(/\/workspace\/home/, { timeout: 15000 })
}

test.describe('SIGO-Ollas Workspace Admin E2E Tests (15 escenarios)', () => {

  test.afterAll(async () => {
    await prisma.$disconnect()
  })

  // ─── DASHBOARD E INTERFAZ GENERAL ────────────────────────────

  test('Test 16: Dashboard carga correctamente con KPIs y gráficos', async ({ page }) => {
    await loginAsAdmin(page)

    // Verificar secciones del Dashboard
    await expect(page.locator('text=Resumen de inventario')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Evolución de beneficiarios')).toBeVisible()
    await expect(page.locator('text=Insumos a vencer')).toBeVisible()
    await expect(page.locator('text=Actividades recientes')).toBeVisible()

    // Verificar que los KPIs principales estén presentes
    await expect(page.locator('main').locator('text=Organizaciones').first()).toBeVisible()
    await expect(page.locator('main').locator('text=Ollas comunes').first()).toBeVisible()
    await expect(page.locator('main').locator('text=Beneficiarios').first()).toBeVisible()
    await expect(page.locator('main').locator('text=Insumos').first()).toBeVisible()
  })

  test('Test 17: Navegación del Sidebar', async ({ page }) => {
    await loginAsAdmin(page)

    // Navegar a Padrón de Beneficiarios
    await page.click('span:has-text("Beneficiarios")')
    await expect(page).toHaveURL(/\/workspace\/beneficiarios/)

    // Navegar a Organizaciones
    await page.click('span:has-text("Organizaciones")')
    await expect(page).toHaveURL(/\/workspace\/organizaciones/)

    // Navegar a Configuración
    await page.click('span:has-text("Configuración")')
    await expect(page).toHaveURL(/\/workspace\/configuracion/)
  })

  // ─── PADRÓN DE BENEFICIARIOS ──────────────────────────────────

  test('Test 18: Listado de Beneficiarios', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')

    // Verificar que cargue la vista de padrón
    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Registrar Beneficiario")')).toBeVisible()
  })

  test('Test 19: Búsqueda de Beneficiarios', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })

    // Ingresar búsqueda aleatoria sin coincidencia
    await page.fill('#search', 'PersonaTotalmenteInexistenteXYZ123')

    // Debería salir el empty state
    await expect(page.locator('text=No se encontraron beneficiarios.')).toBeVisible({ timeout: 10000 })
  })

  test('Test 20: Filtro de Beneficiarios por Olla Común', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })

    // Seleccionar filtro por olla común (el primer option después de "Todas")
    await page.selectOption('#filter-olla', { index: 1 })

    // Validar que la tabla reaccione (no haya fallado la interfaz)
    await page.waitForTimeout(1000)
    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible()
  })

  test('Test 21: Formulario de Beneficiario - Validación', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })

    // Abrir modal
    await page.click('button:has-text("Registrar Beneficiario")')
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 5000 })

    // Intentar guardar sin completar datos obligatorios
    await page.click('div.z-50 button:has-text("Registrar")')

    // Validar toast de error (los mensajes se unen en uno solo)
    await expect(page.locator('text=El nombre es obligatorio.')).toBeVisible()
  })

  test('Test 22: Registro Exitoso de Beneficiario', async ({ page }) => {
    await loginAsAdmin(page)
    const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()

    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')

    // Abrir formulario
    await page.click('button:has-text("Registrar Beneficiario")')
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 5000 })

    // Rellenar campos obligatorios
    await page.fill('#firstName', 'AdminTest')
    await page.fill('#lastName', 'Playwright')
    await page.fill('#dni', randomDni)
    await page.fill('#birthDate', '1990-05-15')

    // Guardar
    await page.click('div.z-50 button:has-text("Registrar")')

    // Esperar cierre de modal
    await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 10000 })

    // Validar que aparezca en el listado haciendo una búsqueda
    await page.fill('#search', randomDni)
    await expect(page.locator(`td:has-text("${randomDni}")`).first()).toBeVisible({ timeout: 10000 })
  })

  test('Test 23: Edición de Beneficiario', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')

    // Esperar a que cargue la lista
    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })

    // Hacer clic en "Editar" del primer registro disponible
    const firstRowEdit = page.locator('button:has-text("Editar")').first()
    await expect(firstRowEdit).toBeVisible({ timeout: 10000 })
    await firstRowEdit.click()

    // Esperar que cargue el modal de edición
    await expect(page.locator('h2:has-text("Editar Beneficiario")')).toBeVisible({ timeout: 5000 })

    // Modificar nombre
    await page.fill('#firstName', 'AdminTestModificado')

    // Guardar
    await page.click('button:has-text("Actualizar")')

    // Esperar cierre de modal
    await expect(page.locator('h2:has-text("Editar Beneficiario")')).not.toBeVisible({ timeout: 10000 })
  })

  test('Test 24: Eliminación de Beneficiario', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/beneficiarios')
    await page.waitForLoadState('domcontentloaded')

    // Esperar a que cargue la lista
    await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })

    // Obtener la cantidad de botones "Eliminar" antes
    const deleteButtons = page.locator('button:has-text("Eliminar")')
    if (await deleteButtons.count() > 0) {
      const firstDelete = deleteButtons.first()
      await firstDelete.click()

      // Esperar a que se procese la eliminación y desaparezca
      await expect(firstDelete).not.toBeVisible({ timeout: 10000 })
    }
  })

  // ─── GESTIÓN DE ORGANIZACIONES Y OLLAS ────────────────────────

  test('Test 25: Listado de Organizaciones', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/organizaciones')
    await page.waitForLoadState('domcontentloaded')

    // Verificar título principal
    await expect(page.locator('h1:has-text("Organizaciones")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Nueva organización')).toBeVisible()
  })

  test('Test 26: Creación de Nueva Organización', async ({ page }) => {
    await loginAsAdmin(page)
    const orgName = `Org E2E Test ${Math.floor(Math.random() * 10000)}`

    await page.goto('/workspace/organizaciones')
    await page.waitForLoadState('domcontentloaded')

    // Clic en Nueva organización
    await page.click('text=Nueva organización')
    await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)

    // Llenar formulario
    await page.fill('#organization-name', orgName)
    await page.fill('#organization-location', 'Lima Norte')

    // Enviar formulario
    await page.click('button:has-text("Crear organizacion")')

    // Debería redirigir al detalle de la organización recién creada
    await expect(page).toHaveURL(/\/workspace\/organizaciones\//, { timeout: 15000 })
    await expect(page.locator(`h1:has-text("${orgName}")`)).toBeVisible({ timeout: 10000 })
  })

  test('Test 27: Creación de Olla Común', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/organizaciones')
    await page.waitForLoadState('domcontentloaded')

    // Entrar a la primera organización del listado (excluyendo el botón "nueva")
    const firstOrgCard = page.locator('a[href^="/workspace/organizaciones/"]:not([href$="/nueva"])').first()
    await expect(firstOrgCard).toBeVisible({ timeout: 10000 })
    await firstOrgCard.click()

    // Verificar que estamos en la vista de detalle
    await expect(page.locator('h2:has-text("Ollas Comunes")')).toBeVisible({ timeout: 10000 })

    // Clic en Crear Olla
    await page.click('button:has-text("Crear Olla")')
    await expect(page.locator('h2:has-text("Crear Olla Comun")')).toBeVisible({ timeout: 5000 })

    // Llenar campos
    const randomOllaName = `Olla E2E ${Math.floor(Math.random() * 10000)}`
    await page.fill('#olla-name', randomOllaName)
    await page.fill('#olla-address', 'Dirección E2E 123')

    // Guardar
    await page.click('button:has-text("Crear Olla Comun")')

    // Esperar cierre de modal
    await expect(page.locator('h2:has-text("Crear Olla Comun")')).not.toBeVisible({ timeout: 10000 })

    // Verificar que aparezca en la lista de ollas
    await expect(page.locator(`text=${randomOllaName}`)).toBeVisible({ timeout: 10000 })
  })

  // ─── CONFIGURACIÓN Y PREFERENCIAS ──────────────────────────────

  test('Test 28: Mi Perfil - Edición de Datos (Mock)', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/perfil')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 10000 })

    // Modificar datos
    await page.fill('#profile-name', 'Admin Test Playwright Modificado')
    await page.fill('#profile-email', 'admin-modificado@ollascomunes.pe')

    // Guardar
    await page.click('button:has-text("Guardar cambios")')

    // Validar mensaje de éxito de mock
    await expect(page.locator('text=Datos actualizados correctamente.')).toBeVisible({ timeout: 5000 })
  })

  test('Test 29: Preferencias - Cambio de Tema', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/preferencias')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Preferencias")')).toBeVisible({ timeout: 10000 })

    // Interactuar con el menú de aspecto (dropdown)
    await page.click('button:has-text("Sistema"), button:has-text("Claro"), button:has-text("Oscuro")')

    // Seleccionar "Oscuro" del menú
    await page.click('div[role="menuitemradio"]:has-text("Oscuro")')

    // El dropdown debería actualizar su etiqueta a "Oscuro"
    await expect(page.locator('button:has-text("Oscuro")')).toBeVisible({ timeout: 5000 })
  })

  test('Test 30: Configuración - Enlaces de Acceso', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/workspace/configuracion')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1:has-text("Configuración")')).toBeVisible({ timeout: 10000 })

    // Clic en "Abrir preferencias"
    await page.click('a:has-text("Abrir preferencias")')
    await expect(page).toHaveURL(/\/workspace\/preferencias/)

    // Volver a Configuración
    await page.goto('/workspace/configuracion')

    // Clic en "Abrir perfil"
    await page.click('a:has-text("Abrir perfil")')
    await expect(page).toHaveURL(/\/workspace\/perfil/)
  })
})
