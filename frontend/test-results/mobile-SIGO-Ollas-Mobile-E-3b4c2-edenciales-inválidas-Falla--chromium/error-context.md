# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> SIGO-Ollas Mobile E2E Tests (15 escenarios) >> Test 01.1: Login con credenciales inválidas (Falla)
- Location: e2e\mobile.spec.ts:52:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('#login-email')

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
  10  |  * Inicia sesión como admin (TOTP dinámico).
  11  |  * El admin_municipal es redirigido a /workspace/home por el frontend,
  12  |  * pero tiene permisos para acceder a /mobile/* igualmente.
  13  |  */
  14  | async function loginAsAdmin(page: Page) {
  15  |   page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  16  |   page.on('pageerror', err => console.error('BROWSER ERROR:', err.message))
  17  | 
  18  |   await page.goto('/login')
  19  |   await page.waitForLoadState('domcontentloaded')
  20  | 
  21  |   // Llenar credenciales
  22  |   await page.fill('#login-email', TEST_EMAIL)
  23  |   await page.fill('#login-password', TEST_PASSWORD)
  24  |   await page.click('button[type="submit"]')
  25  | 
  26  |   // Esperar a que aparezca la pantalla OTP
  27  |   await expect(page.locator('#otp-code')).toBeVisible({ timeout: 45000 })
  28  | 
  29  |   // Obtener secreto TOTP de la BD y generar código válido
  30  |   const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  31  |   const secret = user?.totpSecret
  32  |   if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')
  33  | 
  34  |   const code = await generate({ secret })
  35  | 
  36  |   // Llenar el código OTP y enviar
  37  |   await page.fill('#otp-code', code)
  38  |   await page.click('button[type="submit"]')
  39  | 
  40  |   // Esperar redirección exitosa (redirige a /workspace/home para admin_municipal o /mobile/inicio para lideresas)
  41  |   await expect(page).toHaveURL(/\/workspace\/home|\/mobile\/inicio/, { timeout: 45000 })
  42  | }
  43  | 
  44  | test.describe('SIGO-Ollas Mobile E2E Tests (15 escenarios)', () => {
  45  | 
  46  |   test.afterAll(async () => {
  47  |     await prisma.$disconnect()
  48  |   })
  49  | 
  50  |   // ─── AUTENTICACIÓN ────────────────────────────────────────────
  51  | 
  52  |   test('Test 01.1: Login con credenciales inválidas (Falla)', async ({ page }) => {
  53  |     await page.goto('/login')
  54  |     await page.waitForLoadState('domcontentloaded')
  55  | 
> 56  |     await page.fill('#login-email', 'incorrecto@ollascomunes.pe')
      |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
  57  |     await page.fill('#login-password', 'wrongpassword')
  58  |     await page.click('button[type="submit"]')
  59  | 
  60  |     // Debe permanecer en login (sin redirección)
  61  |     await page.waitForTimeout(2000)
  62  |     await expect(page).toHaveURL(/\/login/)
  63  |   })
  64  | 
  65  |   test('Test 01.2: MFA con código TOTP inválido (Falla)', async ({ page }) => {
  66  |     await page.goto('/login')
  67  |     await page.waitForLoadState('domcontentloaded')
  68  | 
  69  |     await page.fill('#login-email', TEST_EMAIL)
  70  |     await page.fill('#login-password', TEST_PASSWORD)
  71  |     await page.click('button[type="submit"]')
  72  | 
  73  |     // Esperar OTP
  74  |     await expect(page.locator('#otp-code')).toBeVisible({ timeout: 45000 })
  75  | 
  76  |     // Enviar código incorrecto
  77  |     await page.fill('#otp-code', '000000')
  78  |     await page.click('button[type="submit"]')
  79  | 
  80  |     // Debe permanecer en la pantalla de verificación OTP
  81  |     await page.waitForTimeout(2000)
  82  |     await expect(page.locator('#otp-code')).toBeVisible()
  83  |   })
  84  | 
  85  |   test('Test 01.5: Login con campos vacíos (Falla)', async ({ page }) => {
  86  |     await page.goto('/login')
  87  |     await page.waitForLoadState('domcontentloaded')
  88  | 
  89  |     await page.fill('#login-email', '')
  90  |     await page.fill('#login-password', '')
  91  |     await page.click('button[type="submit"]')
  92  | 
  93  |     await page.waitForTimeout(1000)
  94  |     await expect(page).toHaveURL(/\/login/)
  95  |   })
  96  | 
  97  |   test('Test 01.6: Login con formato de email inválido (Falla)', async ({ page }) => {
  98  |     await page.goto('/login')
  99  |     await page.waitForLoadState('domcontentloaded')
  100 | 
  101 |     await page.fill('#login-email', 'invalido-email')
  102 |     await page.fill('#login-password', 'password123')
  103 |     await page.click('button[type="submit"]')
  104 | 
  105 |     await page.waitForTimeout(1000)
  106 |     await expect(page).toHaveURL(/\/login/)
  107 |   })
  108 | 
  109 |   test('Test 01.3: Login exitoso con TOTP dinámico (Éxito)', async ({ page }) => {
  110 |     await loginAsAdmin(page)
  111 |     // Después de login, el admin va a /workspace/home
  112 |     // Verificamos que ya no está en /login
  113 |     await expect(page).not.toHaveURL(/\/login/)
  114 |   })
  115 | 
  116 |   test('Test 01.4: Redirección automática de ruta móvil protegida sin autenticación (Falla)', async ({ page }) => {
  117 |     // Intentar ir directo a /mobile/inicio
  118 |     await page.goto('/mobile/inicio')
  119 |     await page.waitForLoadState('domcontentloaded')
  120 |     // Debería redirigir a login
  121 |     await expect(page).toHaveURL(/\/login/)
  122 |   })
  123 | 
  124 |   // ─── DASHBOARD Y NAVEGACIÓN ───────────────────────────────────
  125 | 
  126 |   test('Test 02: Dashboard muestra información correcta de la Olla', async ({ page }) => {
  127 |     await loginAsAdmin(page)
  128 |     await page.goto('/mobile/inicio')
  129 |     await page.waitForLoadState('domcontentloaded')
  130 | 
  131 |     // El saludo debe aparecer
  132 |     await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 35000 })
  133 |   })
  134 | 
  135 |   test('Test 03: Barra de navegación inferior cambia de vista', async ({ page }) => {
  136 |     await loginAsAdmin(page)
  137 |     await page.goto('/mobile/inicio')
  138 |     await page.waitForLoadState('domcontentloaded')
  139 | 
  140 |     // Ir a Inventario
  141 |     await page.click('a[href="/mobile/inventario"]')
  142 |     await expect(page).toHaveURL(/\/mobile\/inventario/)
  143 | 
  144 |     // Ir a Padrón
  145 |     await page.click('a[href="/mobile/padron"]')
  146 |     await expect(page).toHaveURL(/\/mobile\/padron/)
  147 | 
  148 |     // Ir a Alertas
  149 |     await page.click('a[href="/mobile/alertas"]')
  150 |     await expect(page).toHaveURL(/\/mobile\/alertas/)
  151 |   })
  152 | 
  153 |   test('Test 04: Botón de Salir cierra la sesión', async ({ page }) => {
  154 |     await loginAsAdmin(page)
  155 |     await page.goto('/mobile/inicio')
  156 |     await page.waitForLoadState('domcontentloaded')
```