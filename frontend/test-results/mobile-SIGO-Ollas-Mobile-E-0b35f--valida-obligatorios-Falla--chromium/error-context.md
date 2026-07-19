# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> SIGO-Ollas Mobile E2E Tests (15 escenarios) >> Test 07.1: Formulario de nuevo beneficiario valida obligatorios (Falla)
- Location: e2e\mobile.spec.ts:194:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=La olla común es obligatoria')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('text=La olla común es obligatoria')

```

```yaml
- region "Notifications alt+T"
- dialog "Nuevo beneficiario":
  - heading "Nuevo beneficiario" [level=2]
  - paragraph: Completa los datos del beneficiario
  - heading "Datos Personales" [level=3]
  - text: Nombres *
  - textbox "Nombres *":
    - /placeholder: Nombres
  - paragraph: El nombre es obligatorio
  - text: Apellidos *
  - textbox "Apellidos *":
    - /placeholder: Apellidos
  - paragraph: Los apellidos son obligatorios
  - text: DNI *
  - textbox "DNI *":
    - /placeholder: "12345678"
  - paragraph: El DNI es obligatorio
  - text: Fecha de nacimiento *
  - textbox "Fecha de nacimiento *"
  - paragraph: Fecha de nacimiento inválida o futura
  - text: Género
  - combobox "Género":
    - option "No especificado" [selected]
    - option "Masculino"
    - option "Femenino"
    - option "Otro"
  - text: Prioridad
  - combobox "Prioridad":
    - option "Normal" [selected]
    - option "Baja"
    - option "Alta"
  - separator
  - heading "Olla y Salud" [level=3]
  - text: Olla común *
  - combobox "Olla común *":
    - option "-- Seleccionar olla --"
    - option "Olla Integración 1392" [selected]
    - option "Olla Integración 1446"
    - option "Olla Integración 3378"
    - option "Olla Integración 5746"
    - option "Olla Integración 6761"
    - option "Olla Integración 6925"
    - option "Olla Integración 8585"
    - option "Olla Integración 8753"
    - option "Olla Integración 9854"
    - option "Olla Test"
  - text: Condiciones de salud
  - button "Diabetes"
  - button "Hipertension"
  - button "Obesidad"
  - separator
  - heading "Contacto" [level=3]
  - text: Teléfono
  - textbox "Teléfono":
    - /placeholder: 999 999 999
  - text: Dirección
  - textbox "Dirección"
  - button "Guardar beneficiario"
  - button "Close"
```

# Test source

```ts
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
> 215 |     await expect(page.locator('text=La olla común es obligatoria')).toBeVisible()
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
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
  242 | 
  243 |     // Esperar a que el formulario cierre y la lista se actualice
  244 |     await expect(page.locator('text=Nuevo beneficiario')).not.toBeVisible({ timeout: 35000 })
  245 | 
  246 |     // Buscar por DNI
  247 |     await page.fill('input[placeholder="Buscar por nombre o DNI…"]', randomDni)
  248 | 
  249 |     // Debe encontrar el beneficiario recién creado
  250 |     await expect(page.locator(`text=${randomDni}`)).toBeVisible({ timeout: 35000 })
  251 |   })
  252 | 
  253 |   test('Test 07.3: Registrar beneficiario con DNI existente en el padrón móvil (Falla)', async ({ page }) => {
  254 |     await loginAsAdmin(page)
  255 |     await page.goto('/mobile/padron')
  256 |     await page.waitForLoadState('domcontentloaded')
  257 | 
  258 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  259 |     await page.click('button[aria-label="Agregar beneficiario"]')
  260 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  261 | 
  262 |     // Usar DNI ya existente
  263 |     await page.fill('#firstName', 'Falla')
  264 |     await page.fill('#lastName', 'Registro')
  265 |     await page.fill('#dni', '87654321') // Creado previamente en functional tests
  266 |     await page.fill('#birthDate', '1995-02-20')
  267 | 
  268 |     // Seleccionar olla común
  269 |     await page.selectOption('#ollaId', { index: 1 })
  270 | 
  271 |     await page.click('button:has-text("Guardar beneficiario")')
  272 | 
  273 |     // Debería mostrar un toast de error o permanecer visible indicando error
  274 |     await expect(page.locator('text=Ya existe').or(page.locator('text=Nuevo beneficiario'))).toBeVisible()
  275 |   })
  276 | 
  277 |   test('Test 07.4: Registrar beneficiario con DNI con longitud inválida (menos de 8 dígitos) (Falla)', async ({ page }) => {
  278 |     await loginAsAdmin(page)
  279 |     await page.goto('/mobile/padron')
  280 |     await page.waitForLoadState('domcontentloaded')
  281 | 
  282 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  283 |     await page.click('button[aria-label="Agregar beneficiario"]')
  284 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  285 | 
  286 |     await page.fill('#firstName', 'Dni')
  287 |     await page.fill('#lastName', 'Corto')
  288 |     await page.fill('#dni', '12345')
  289 |     await page.fill('#birthDate', '1995-02-20')
  290 | 
  291 |     await page.selectOption('#ollaId', { index: 1 })
  292 |     await page.click('button:has-text("Guardar beneficiario")')
  293 | 
  294 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible()
  295 |   })
  296 | 
  297 |   test('Test 07.5: Registrar beneficiario con fecha de nacimiento en el futuro (Falla)', async ({ page }) => {
  298 |     await loginAsAdmin(page)
  299 |     await page.goto('/mobile/padron')
  300 |     await page.waitForLoadState('domcontentloaded')
  301 | 
  302 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  303 |     await page.click('button[aria-label="Agregar beneficiario"]')
  304 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  305 | 
  306 |     await page.fill('#firstName', 'Fecha')
  307 |     await page.fill('#lastName', 'Futura')
  308 |     await page.fill('#dni', '12345678')
  309 |     await page.fill('#birthDate', '3026-02-20')
  310 | 
  311 |     await page.selectOption('#ollaId', { index: 1 })
  312 |     await page.click('button:has-text("Guardar beneficiario")')
  313 | 
  314 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible()
  315 |   })
```