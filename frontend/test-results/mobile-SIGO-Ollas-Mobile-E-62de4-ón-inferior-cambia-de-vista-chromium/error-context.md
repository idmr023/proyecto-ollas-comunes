# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> SIGO-Ollas Mobile E2E Tests (15 escenarios) >> Test 05: Barra de navegación inferior cambia de vista
- Location: e2e\mobile.spec.ts:103:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#otp-code')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('#otp-code')

```

```yaml
- main:
  - text: OC Ollas Comunes
  - heading "Bienvenida a tu plataforma comunitaria" [level=1]
  - text: Gestiona tus ollas comunes desde un solo lugar Control de inventario y beneficiarios en tiempo real Menús inteligentes para reducir el desperdicio
  - img
  - heading "Iniciar sesión" [level=2]
  - paragraph: Ingresa tus credenciales para continuar
  - text: Correo electrónico o DNI
  - textbox "ej. lideresa@olla.pe": admin@ollascomunes.pe
  - text: Contraseña
  - textbox "••••••••": admin123
  - button
  - button "¿Olvidaste tu contraseña?"
  - button "Ingresando..." [disabled]
- region "Notifications alt+T"
- alert
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
> 27  |   await expect(page.locator('#otp-code')).toBeVisible({ timeout: 15000 })
      |                                           ^ Error: expect(locator).toBeVisible() failed
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
  41  |   await expect(page).toHaveURL(/\/workspace\/home|\/mobile\/inicio/, { timeout: 15000 })
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
  52  |   test('Test 01: Login con credenciales inválidas', async ({ page }) => {
  53  |     await page.goto('/login')
  54  |     await page.waitForLoadState('domcontentloaded')
  55  | 
  56  |     await page.fill('#login-email', 'incorrecto@ollascomunes.pe')
  57  |     await page.fill('#login-password', 'wrongpassword')
  58  |     await page.click('button[type="submit"]')
  59  | 
  60  |     // Debe permanecer en login (sin redirección)
  61  |     await page.waitForTimeout(2000)
  62  |     await expect(page).toHaveURL(/\/login/)
  63  |   })
  64  | 
  65  |   test('Test 02: MFA con código TOTP inválido', async ({ page }) => {
  66  |     await page.goto('/login')
  67  |     await page.waitForLoadState('domcontentloaded')
  68  | 
  69  |     await page.fill('#login-email', TEST_EMAIL)
  70  |     await page.fill('#login-password', TEST_PASSWORD)
  71  |     await page.click('button[type="submit"]')
  72  | 
  73  |     // Esperar OTP
  74  |     await expect(page.locator('#otp-code')).toBeVisible({ timeout: 15000 })
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
  85  |   test('Test 03: Login exitoso con TOTP dinámico', async ({ page }) => {
  86  |     await loginAsAdmin(page)
  87  |     // Después de login, el admin va a /workspace/home
  88  |     // Verificamos que ya no está en /login
  89  |     await expect(page).not.toHaveURL(/\/login/)
  90  |   })
  91  | 
  92  |   // ─── DASHBOARD Y NAVEGACIÓN ───────────────────────────────────
  93  | 
  94  |   test('Test 04: Dashboard muestra información correcta de la Olla', async ({ page }) => {
  95  |     await loginAsAdmin(page)
  96  |     await page.goto('/mobile/inicio')
  97  |     await page.waitForLoadState('domcontentloaded')
  98  | 
  99  |     // El saludo debe aparecer
  100 |     await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 10000 })
  101 |   })
  102 | 
  103 |   test('Test 05: Barra de navegación inferior cambia de vista', async ({ page }) => {
  104 |     await loginAsAdmin(page)
  105 |     await page.goto('/mobile/inicio')
  106 |     await page.waitForLoadState('domcontentloaded')
  107 | 
  108 |     // Ir a Inventario
  109 |     await page.click('a[href="/mobile/inventario"]')
  110 |     await expect(page).toHaveURL(/\/mobile\/inventario/)
  111 | 
  112 |     // Ir a Padrón
  113 |     await page.click('a[href="/mobile/padron"]')
  114 |     await expect(page).toHaveURL(/\/mobile\/padron/)
  115 | 
  116 |     // Ir a Alertas
  117 |     await page.click('a[href="/mobile/alertas"]')
  118 |     await expect(page).toHaveURL(/\/mobile\/alertas/)
  119 |   })
  120 | 
  121 |   test('Test 06: Botón de Salir cierra la sesión', async ({ page }) => {
  122 |     await loginAsAdmin(page)
  123 |     await page.goto('/mobile/inicio')
  124 |     await page.waitForLoadState('domcontentloaded')
  125 | 
  126 |     // Esperar que el contenido cargue
  127 |     await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 10000 })
```