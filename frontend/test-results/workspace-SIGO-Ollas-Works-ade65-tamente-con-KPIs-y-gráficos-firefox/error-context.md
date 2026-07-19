# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 13: Dashboard carga correctamente con KPIs y gráficos
- Location: e2e\workspace.spec.ts:51:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Insumos a vencer')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('text=Insumos a vencer')

```

```yaml
- list:
  - listitem:
    - button "OC Ollas Comunes Panel de gestión"
- text: Principal
- list:
  - listitem:
    - link "Inicio":
      - /url: /workspace/home/
  - listitem:
    - link "Organizaciones":
      - /url: /workspace/organizaciones/
  - listitem:
    - link "Beneficiarios":
      - /url: /workspace/beneficiarios/
  - listitem:
    - link "Inventario":
      - /url: /workspace/inventario/
- text: Gestión
- list:
  - listitem:
    - link "Alertas":
      - /url: /workspace/alertas/
  - listitem:
    - link "Configuración":
      - /url: /workspace/configuracion/
- list:
  - listitem:
    - button "OC admin@ollascomunes.pe"
- button "Toggle Sidebar"
- main:
  - button "Toggle Sidebar"
  - text: Ollas Comunes Plataforma de gestion comunitaria
  - heading "¡Bienvenido!" [level=1]
  - paragraph: Resumen general del sistema
  - text: Últimos 30 días
  - button "Exportar reporte"
  - text: Organizaciones
  - paragraph: "10"
  - text: +12% vs mes anterior Ollas comunes
  - paragraph: "10"
  - text: +8% vs mes anterior Beneficiarios
  - paragraph: "480"
  - text: +23% vs mes anterior Insumos
  - paragraph: "5"
  - text: "-5% vs mes anterior"
  - heading "Resumen de inventario" [level=3]
  - img
  - text: Stock adecuado 60% Stock bajo 25% Stock crítico 15%
  - heading "Evolución de beneficiarios" [level=3]
  - text: Mensual
  - img
  - heading "Insumos críticos y bajo stock" [level=3]
  - text: A
  - paragraph: Arroz
  - paragraph: Olla Integración 1392
  - paragraph: ⚠ Sin stock
  - paragraph: 0 kg
  - text: A
  - paragraph: Arroz
  - paragraph: Olla Integración 1446
  - paragraph: ⚠ Sin stock
  - paragraph: 0 kg
  - text: A
  - paragraph: Arroz
  - paragraph: Olla Test
  - paragraph: ⚠ Sin stock
  - paragraph: 0 kg
  - heading "Actividades recientes" [level=3]
  - paragraph: "Nuevo beneficiario registrado: Prioridad Temp (DNI: F031784425119115)"
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Stock insuficiente para: Arroz — Se intentó descontar 0.1 kg pero solo había 0 kg"
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Nuevo beneficiario registrado: Entrega Temporal (DNI: F141784425118986)"
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Insumo agotado: Arroz — Se registró una salida que dejó el stock en 0."
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Intento de registro fallido: Beneficiario con DNI 87654321 ya está registrado."
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Nuevo beneficiario registrado: Beneficiario Prueba Vitest (DNI: 87654321)"
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Nuevo beneficiario registrado: Stress32K2p TestYSCqm (DNI: 71451701)"
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Nuevo beneficiario registrado: StressXY92S Testosshy (DNI: 96158405)"
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Nuevo beneficiario registrado: StressDtylq TestNpq2p (DNI: 50832103)"
  - paragraph: Olla Integración 1392 • Hace 2 h
  - paragraph: "Nuevo beneficiario registrado: Stress0bhNJ TestQBWiV (DNI: 49780343)"
  - paragraph: Olla Integración 1392 • Hace 2 h
- region "Notifications alt+T"
- alert: Ollas Comunes
```

# Test source

```ts
  1   | import './setup-env'
  2   | import { test, expect, type Page } from '@playwright/test'
  3   | import { generate } from 'otplib'
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
  26  |   await expect(page.locator('#otp-code')).toBeVisible({ timeout: 45000 })
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
  40  |   await expect(page).toHaveURL(/\/workspace\/home/, { timeout: 45000 })
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
  51  |   test('Test 13: Dashboard carga correctamente con KPIs y gráficos', async ({ page }) => {
  52  |     await loginAsAdmin(page)
  53  | 
  54  |     // Verificar secciones del Dashboard
  55  |     await expect(page.locator('text=Resumen de inventario')).toBeVisible({ timeout: 35000 })
  56  |     await expect(page.locator('text=Evolución de beneficiarios')).toBeVisible()
> 57  |     await expect(page.locator('text=Insumos a vencer')).toBeVisible()
      |                                                         ^ Error: expect(locator).toBeVisible() failed
  58  |     await expect(page.locator('text=Actividades recientes')).toBeVisible()
  59  | 
  60  |     // Verificar que los KPIs principales estén presentes
  61  |     await expect(page.locator('main').locator('text=Organizaciones').first()).toBeVisible()
  62  |     await expect(page.locator('main').locator('text=Ollas comunes').first()).toBeVisible()
  63  |     await expect(page.locator('main').locator('text=Beneficiarios').first()).toBeVisible()
  64  |     await expect(page.locator('main').locator('text=Insumos').first()).toBeVisible()
  65  |   })
  66  | 
  67  |   test('Test 14.1: Navegación del Sidebar (Éxito)', async ({ page }) => {
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
  83  |   test('Test 14.2: Redirección de ruta de workspace protegida sin autenticación (Falla)', async ({ page }) => {
  84  |     // Intentar ir directo a /workspace/home
  85  |     await page.goto('/workspace/home')
  86  |     await page.waitForLoadState('domcontentloaded')
  87  |     // Debería redirigir a login
  88  |     await expect(page).toHaveURL(/\/login/)
  89  |   })
  90  | 
  91  |   // ─── PADRÓN DE BENEFICIARIOS ──────────────────────────────────
  92  | 
  93  |   test('Test 15: Listado de Beneficiarios', async ({ page }) => {
  94  |     await loginAsAdmin(page)
  95  |     await page.goto('/workspace/beneficiarios')
  96  |     await page.waitForLoadState('domcontentloaded')
  97  | 
  98  |     // Verificar que cargue la vista de padrón
  99  |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  100 |     await expect(page.locator('button:has-text("Registrar Beneficiario")')).toBeVisible()
  101 |   })
  102 | 
  103 |   test('Test 16: Búsqueda de Beneficiarios', async ({ page }) => {
  104 |     await loginAsAdmin(page)
  105 |     await page.goto('/workspace/beneficiarios')
  106 |     await page.waitForLoadState('domcontentloaded')
  107 | 
  108 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  109 | 
  110 |     // Ingresar búsqueda aleatoria sin coincidencia
  111 |     await page.fill('#search', 'PersonaTotalmenteInexistenteXYZ123')
  112 | 
  113 |     // Debería salir el empty state
  114 |     await expect(page.locator('text=No se encontraron beneficiarios.')).toBeVisible({ timeout: 35000 })
  115 |   })
  116 | 
  117 |   test('Test 17: Filtro de Beneficiarios por Olla Común', async ({ page }) => {
  118 |     await loginAsAdmin(page)
  119 |     await page.goto('/workspace/beneficiarios')
  120 |     await page.waitForLoadState('domcontentloaded')
  121 | 
  122 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  123 | 
  124 |     // Seleccionar filtro por olla común (el primer option después de "Todas")
  125 |     await page.selectOption('#filter-olla', { index: 1 })
  126 | 
  127 |     // Validar que la tabla reaccione (no haya fallado la interfaz)
  128 |     await page.waitForTimeout(1000)
  129 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible()
  130 |   })
  131 | 
  132 |   test('Test 18.1: Formulario de Beneficiario - Validación (Falla)', async ({ page }) => {
  133 |     await loginAsAdmin(page)
  134 |     await page.goto('/workspace/beneficiarios')
  135 |     await page.waitForLoadState('domcontentloaded')
  136 | 
  137 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  138 | 
  139 |     // Abrir modal
  140 |     await page.click('button:has-text("Registrar Beneficiario")')
  141 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  142 | 
  143 |     // Intentar guardar sin completar datos obligatorios
  144 |     await page.click('div.z-50 button:has-text("Registrar")')
  145 | 
  146 |     // Validar toast de error (los mensajes se unen en uno solo)
  147 |     await expect(page.locator('text=El nombre es obligatorio.')).toBeVisible()
  148 |   })
  149 | 
  150 |   test('Test 18.2: Registro Exitoso de Beneficiario (Éxito)', async ({ page }) => {
  151 |     await loginAsAdmin(page)
  152 |     const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  153 | 
  154 |     await page.goto('/workspace/beneficiarios')
  155 |     await page.waitForLoadState('domcontentloaded')
  156 | 
  157 |     // Abrir formulario
```