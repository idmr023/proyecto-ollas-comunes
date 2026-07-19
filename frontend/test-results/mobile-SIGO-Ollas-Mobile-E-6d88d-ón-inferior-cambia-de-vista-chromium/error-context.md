# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> SIGO-Ollas Mobile E2E Tests (15 escenarios) >> Test 03: Barra de navegación inferior cambia de vista
- Location: e2e\mobile.spec.ts:135:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('a[href="/mobile/inventario"]')

```

# Test source

```ts
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
> 141 |     await page.click('a[href="/mobile/inventario"]')
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
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
  157 | 
  158 |     // Esperar que el contenido cargue
  159 |     await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 35000 })
  160 | 
  161 |     // Click en botón Salir de la BottomNav
  162 |     await page.click('button:has-text("Salir")')
  163 | 
  164 |     // Debería redirigir a login (clearAuth + useEffect en layout)
  165 |     await expect(page).toHaveURL(/\/login/, { timeout: 35000 })
  166 |   })
  167 | 
  168 |   // ─── PADRÓN ───────────────────────────────────────────────────
  169 | 
  170 |   test('Test 05: Padrón de beneficiarios carga listado', async ({ page }) => {
  171 |     await loginAsAdmin(page)
  172 |     await page.goto('/mobile/padron')
  173 |     await page.waitForLoadState('domcontentloaded')
  174 | 
  175 |     // El título "Padrón" debe aparecer
  176 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  177 |   })
  178 | 
  179 |   test('Test 06: Búsqueda de beneficiarios filtra resultados', async ({ page }) => {
  180 |     await loginAsAdmin(page)
  181 |     await page.goto('/mobile/padron')
  182 |     await page.waitForLoadState('domcontentloaded')
  183 | 
  184 |     // Esperar a que la lista cargue (desaparece el skeleton)
  185 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  186 |     await page.waitForTimeout(2000) // esperar carga de beneficiarios
  187 | 
  188 |     await page.fill('input[placeholder="Buscar por nombre o DNI…"]', 'NombreInexistente99999XYZ')
  189 | 
  190 |     // Debería mostrar "Sin resultados" (el debounce aplica en el fetchBeneficiaries via useCallback)
  191 |     await expect(page.locator('text=Sin resultados')).toBeVisible({ timeout: 35000 })
  192 |   })
  193 | 
  194 |   test('Test 07.1: Formulario de nuevo beneficiario valida obligatorios (Falla)', async ({ page }) => {
  195 |     await loginAsAdmin(page)
  196 |     await page.goto('/mobile/padron')
  197 |     await page.waitForLoadState('domcontentloaded')
  198 | 
  199 |     // Esperar carga
  200 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  201 | 
  202 |     // Abrir formulario
  203 |     await page.click('button[aria-label="Agregar beneficiario"]')
  204 | 
  205 |     // Esperar que el sheet abra
  206 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  207 | 
  208 |     // Intentar guardar sin datos
  209 |     await page.click('button:has-text("Guardar beneficiario")')
  210 | 
  211 |     // Mensajes de validación (ahora incluye DNI y Olla obligatorios)
  212 |     await expect(page.locator('text=El nombre es obligatorio')).toBeVisible()
  213 |     await expect(page.locator('text=Los apellidos son obligatorios')).toBeVisible()
  214 |     await expect(page.locator('text=El DNI es obligatorio')).toBeVisible()
  215 |     await expect(page.locator('text=La olla común es obligatoria')).toBeVisible()
  216 |   })
  217 | 
  218 |   test('Test 07.2: Creación exitosa de un beneficiario (Éxito)', async ({ page }) => {
  219 |     await loginAsAdmin(page)
  220 |     const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  221 |     await page.goto('/mobile/padron')
  222 |     await page.waitForLoadState('domcontentloaded')
  223 | 
  224 |     // Esperar carga
  225 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  226 | 
  227 |     // Abrir formulario
  228 |     await page.click('button[aria-label="Agregar beneficiario"]')
  229 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  230 | 
  231 |     // Llenar campos obligatorios
  232 |     await page.fill('#firstName', 'TestE2E')
  233 |     await page.fill('#lastName', 'Playwright')
  234 |     await page.fill('#dni', randomDni)
  235 |     await page.fill('#birthDate', '1995-02-20')
  236 | 
  237 |     // Seleccionar olla común (primer option después del placeholder)
  238 |     await page.selectOption('#ollaId', { index: 1 })
  239 | 
  240 |     // Guardar
  241 |     await page.click('button:has-text("Guardar beneficiario")')
```