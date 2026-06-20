# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> SIGO-Ollas Mobile E2E Tests (15 escenarios) >> Test 06: Búsqueda de beneficiarios filtra resultados
- Location: e2e\mobile.spec.ts:155:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/workspace\/home|\/mobile\/inicio/
Received string:  "https://proyecto-ollas-comunes.vercel.app/login/otp?email=admin%40ollascomunes.pe&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNzg5NGUxZC0xZTFlLTQxYjItYWMxYy02YzBlODkwY2E1YjAiLCJlbWFpbCI6ImFkbWluQG9sbGFzY29tdW5lcy5wZSIsInNlY3JldCI6IjNDNks3WlNKSU1NNEJRU1hXSTRIN0pSVlozR0xSS1FMIiwicHVycG9zZSI6Im1mYSIsImlhdCI6MTc4MTkxOTkyOSwiZXhwIjoxNzgxOTIwMjI5fQ.kJ-LaVF3K3MNCo9dST6ef_El2fHNkvD8n3oHins0D08"
Timeout: 45000ms

Call log:
  - Expect "toHaveURL" with timeout 45000ms
    92 × unexpected value "https://proyecto-ollas-comunes.vercel.app/login/otp?email=admin%40ollascomunes.pe&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNzg5NGUxZC0xZTFlLTQxYjItYWMxYy02YzBlODkwY2E1YjAiLCJlbWFpbCI6ImFkbWluQG9sbGFzY29tdW5lcy5wZSIsInNlY3JldCI6IjNDNks3WlNKSU1NNEJRU1hXSTRIN0pSVlozR0xSS1FMIiwicHVycG9zZSI6Im1mYSIsImlhdCI6MTc4MTkxOTkyOSwiZXhwIjoxNzgxOTIwMjI5fQ.kJ-LaVF3K3MNCo9dST6ef_El2fHNkvD8n3oHins0D08"

```

```yaml
- main:
  - button
  - heading "Bienvenido de vuelta" [level=1]
  - paragraph: Ingresa el código de 6 dígitos de tu app de autenticación
  - button "Pegar código"
  - paragraph: admin@ollascomunes.pe
  - text: Código de verificación 3 9 2 4 6 1
  - textbox "Código de verificación": "392461"
  - paragraph: 6 dígitos numéricos
  - button "Verificar código"
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
> 41  |   await expect(page).toHaveURL(/\/workspace\/home|\/mobile\/inicio/, { timeout: 45000 })
      |                      ^ Error: expect(page).toHaveURL(expected) failed
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
  56  |     await page.fill('#login-email', 'incorrecto@ollascomunes.pe')
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
  85  |   test('Test 01.3: Login exitoso con TOTP dinámico (Éxito)', async ({ page }) => {
  86  |     await loginAsAdmin(page)
  87  |     // Después de login, el admin va a /workspace/home
  88  |     // Verificamos que ya no está en /login
  89  |     await expect(page).not.toHaveURL(/\/login/)
  90  |   })
  91  | 
  92  |   test('Test 01.4: Redirección automática de ruta móvil protegida sin autenticación (Falla)', async ({ page }) => {
  93  |     // Intentar ir directo a /mobile/inicio
  94  |     await page.goto('/mobile/inicio')
  95  |     await page.waitForLoadState('domcontentloaded')
  96  |     // Debería redirigir a login
  97  |     await expect(page).toHaveURL(/\/login/)
  98  |   })
  99  | 
  100 |   // ─── DASHBOARD Y NAVEGACIÓN ───────────────────────────────────
  101 | 
  102 |   test('Test 02: Dashboard muestra información correcta de la Olla', async ({ page }) => {
  103 |     await loginAsAdmin(page)
  104 |     await page.goto('/mobile/inicio')
  105 |     await page.waitForLoadState('domcontentloaded')
  106 | 
  107 |     // El saludo debe aparecer
  108 |     await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 35000 })
  109 |   })
  110 | 
  111 |   test('Test 03: Barra de navegación inferior cambia de vista', async ({ page }) => {
  112 |     await loginAsAdmin(page)
  113 |     await page.goto('/mobile/inicio')
  114 |     await page.waitForLoadState('domcontentloaded')
  115 | 
  116 |     // Ir a Inventario
  117 |     await page.click('a[href="/mobile/inventario"]')
  118 |     await expect(page).toHaveURL(/\/mobile\/inventario/)
  119 | 
  120 |     // Ir a Padrón
  121 |     await page.click('a[href="/mobile/padron"]')
  122 |     await expect(page).toHaveURL(/\/mobile\/padron/)
  123 | 
  124 |     // Ir a Alertas
  125 |     await page.click('a[href="/mobile/alertas"]')
  126 |     await expect(page).toHaveURL(/\/mobile\/alertas/)
  127 |   })
  128 | 
  129 |   test('Test 04: Botón de Salir cierra la sesión', async ({ page }) => {
  130 |     await loginAsAdmin(page)
  131 |     await page.goto('/mobile/inicio')
  132 |     await page.waitForLoadState('domcontentloaded')
  133 | 
  134 |     // Esperar que el contenido cargue
  135 |     await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 35000 })
  136 | 
  137 |     // Click en botón Salir de la BottomNav
  138 |     await page.click('button:has-text("Salir")')
  139 | 
  140 |     // Debería redirigir a login (clearAuth + useEffect en layout)
  141 |     await expect(page).toHaveURL(/\/login/, { timeout: 35000 })
```