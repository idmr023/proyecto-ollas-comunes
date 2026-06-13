# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 18: Listado de Beneficiarios
- Location: e2e\workspace.spec.ts:85:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/workspace\/home/
Received string:  "http://localhost:3000/login/otp?email=admin%40ollascomunes.pe"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    33 × unexpected value "http://localhost:3000/login/otp?email=admin%40ollascomunes.pe"

```

```yaml
- main:
  - button
  - heading "Verificación en dos pasos" [level=1]
  - paragraph: Ingresa el código de 6 dígitos de tu aplicación de autenticación
  - paragraph: admin@ollascomunes.pe
  - text: 7 9 6 0 8 4
  - textbox: "796084"
  - button "Verificar código"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import './setup-env'
  2   | import { test, expect, type Page } from '@playwright/test'
  3   | import { generate } from 'otplib/functional'
  4   | import { prisma } from '../../backend/src/lib/prisma'
  5   | 
  6   | const TEST_EMAIL = 'admin@ollascomunes.pe'
  7   | const TEST_PASSWORD = 'admin123'
  8   | 
  9   | /**
  10  |  * Inicia sesión como administrador municipal.
  11  |  * Automáticamente navega a /login, completa la autenticación MFA y redirige a /workspace/home.
  12  |  */
  13  | async function loginAsAdmin(page: Page) {
  14  |   page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  15  |   page.on('pageerror', err => console.error('BROWSER ERROR:', err.message))
  16  | 
  17  |   await page.goto('/login')
  18  |   await page.waitForLoadState('domcontentloaded')
  19  | 
  20  |   // Ingresar credenciales
  21  |   await page.fill('#login-email', TEST_EMAIL)
  22  |   await page.fill('#login-password', TEST_PASSWORD)
  23  |   await page.click('button[type="submit"]')
  24  | 
  25  |   // Esperar a que aparezca la pantalla de OTP
  26  |   await expect(page.locator('#otp-code')).toBeVisible({ timeout: 15000 })
  27  | 
  28  |   // Obtener secreto de la BD y generar código válido
  29  |   const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  30  |   const secret = user?.totpSecret
  31  |   if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')
  32  | 
  33  |   const code = await generate({ secret })
  34  | 
  35  |   // Rellenar código y confirmar
  36  |   await page.fill('#otp-code', code)
  37  |   await page.click('button[type="submit"]')
  38  | 
  39  |   // Esperar redirección al Workspace Home
> 40  |   await expect(page).toHaveURL(/\/workspace\/home/, { timeout: 15000 })
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  41  | }
  42  | 
  43  | test.describe('SIGO-Ollas Workspace Admin E2E Tests (15 escenarios)', () => {
  44  | 
  45  |   test.afterAll(async () => {
  46  |     await prisma.$disconnect()
  47  |   })
  48  | 
  49  |   // ─── DASHBOARD E INTERFAZ GENERAL ────────────────────────────
  50  | 
  51  |   test('Test 16: Dashboard carga correctamente con KPIs y gráficos', async ({ page }) => {
  52  |     await loginAsAdmin(page)
  53  | 
  54  |     // Verificar secciones del Dashboard
  55  |     await expect(page.locator('text=Resumen de inventario')).toBeVisible({ timeout: 10000 })
  56  |     await expect(page.locator('text=Evolución de beneficiarios')).toBeVisible()
  57  |     await expect(page.locator('text=Insumos a vencer')).toBeVisible()
  58  |     await expect(page.locator('text=Actividades recientes')).toBeVisible()
  59  | 
  60  |     // Verificar que los KPIs principales estén presentes
  61  |     await expect(page.locator('main').locator('text=Organizaciones').first()).toBeVisible()
  62  |     await expect(page.locator('main').locator('text=Ollas comunes').first()).toBeVisible()
  63  |     await expect(page.locator('main').locator('text=Beneficiarios').first()).toBeVisible()
  64  |     await expect(page.locator('main').locator('text=Insumos').first()).toBeVisible()
  65  |   })
  66  | 
  67  |   test('Test 17: Navegación del Sidebar', async ({ page }) => {
  68  |     await loginAsAdmin(page)
  69  | 
  70  |     // Navegar a Padrón de Beneficiarios
  71  |     await page.click('span:has-text("Beneficiarios")')
  72  |     await expect(page).toHaveURL(/\/workspace\/beneficiarios/)
  73  | 
  74  |     // Navegar a Organizaciones
  75  |     await page.click('span:has-text("Organizaciones")')
  76  |     await expect(page).toHaveURL(/\/workspace\/organizaciones/)
  77  | 
  78  |     // Navegar a Configuración
  79  |     await page.click('span:has-text("Configuración")')
  80  |     await expect(page).toHaveURL(/\/workspace\/configuracion/)
  81  |   })
  82  | 
  83  |   // ─── PADRÓN DE BENEFICIARIOS ──────────────────────────────────
  84  | 
  85  |   test('Test 18: Listado de Beneficiarios', async ({ page }) => {
  86  |     await loginAsAdmin(page)
  87  |     await page.goto('/workspace/beneficiarios')
  88  |     await page.waitForLoadState('domcontentloaded')
  89  | 
  90  |     // Verificar que cargue la vista de padrón
  91  |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })
  92  |     await expect(page.locator('button:has-text("Registrar Beneficiario")')).toBeVisible()
  93  |   })
  94  | 
  95  |   test('Test 19: Búsqueda de Beneficiarios', async ({ page }) => {
  96  |     await loginAsAdmin(page)
  97  |     await page.goto('/workspace/beneficiarios')
  98  |     await page.waitForLoadState('domcontentloaded')
  99  | 
  100 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })
  101 | 
  102 |     // Ingresar búsqueda aleatoria sin coincidencia
  103 |     await page.fill('#search', 'PersonaTotalmenteInexistenteXYZ123')
  104 | 
  105 |     // Debería salir el empty state
  106 |     await expect(page.locator('text=No se encontraron beneficiarios.')).toBeVisible({ timeout: 10000 })
  107 |   })
  108 | 
  109 |   test('Test 20: Filtro de Beneficiarios por Olla Común', async ({ page }) => {
  110 |     await loginAsAdmin(page)
  111 |     await page.goto('/workspace/beneficiarios')
  112 |     await page.waitForLoadState('domcontentloaded')
  113 | 
  114 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })
  115 | 
  116 |     // Seleccionar filtro por olla común (el primer option después de "Todas")
  117 |     await page.selectOption('#filter-olla', { index: 1 })
  118 | 
  119 |     // Validar que la tabla reaccione (no haya fallado la interfaz)
  120 |     await page.waitForTimeout(1000)
  121 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible()
  122 |   })
  123 | 
  124 |   test('Test 21: Formulario de Beneficiario - Validación', async ({ page }) => {
  125 |     await loginAsAdmin(page)
  126 |     await page.goto('/workspace/beneficiarios')
  127 |     await page.waitForLoadState('domcontentloaded')
  128 | 
  129 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 10000 })
  130 | 
  131 |     // Abrir modal
  132 |     await page.click('button:has-text("Registrar Beneficiario")')
  133 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 5000 })
  134 | 
  135 |     // Intentar guardar sin completar datos obligatorios
  136 |     await page.click('div.z-50 button:has-text("Registrar")')
  137 | 
  138 |     // Validar toast de error (los mensajes se unen en uno solo)
  139 |     await expect(page.locator('text=El nombre es obligatorio.')).toBeVisible()
  140 |   })
```