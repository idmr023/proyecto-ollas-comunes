# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> SIGO-Ollas Mobile E2E Tests >> Test 07.2: Creación exitosa de un beneficiario (Éxito)
- Location: e2e\mobile.spec.ts:221:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=99331888')
Expected: visible
Timeout: 35000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 35000ms
  - waiting for locator('text=99331888')

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
    - text: TestE2E
  - text: Apellidos *
  - textbox "Apellidos *":
    - /placeholder: Apellidos
    - text: Playwright
  - text: DNI *
  - textbox "DNI *":
    - /placeholder: "12345678"
    - text: "99331888"
  - text: Fecha de nacimiento *
  - textbox "Fecha de nacimiento *": 1995-02-20
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
    - option "Olla Común Los Olivos" [selected]
    - option "Olla Común Villa Maria"
    - option "Olla Integración 3431"
  - text: Condiciones de salud
  - button "Adulto mayor"
  - button "Anemia"
  - button "Diabetes"
  - button "Gestante"
  - button "Hipertension"
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
  153 |     await page.waitForURL('**/mobile/alertas/')
  154 |   })
  155 | 
  156 |   test('Test 04: Botón de Salir cierra la sesión', async ({ page }) => {
  157 |     await loginAsAdmin(page)
  158 |     await page.goto('/mobile/inicio')
  159 |     await page.waitForLoadState('domcontentloaded')
  160 | 
  161 |     // Esperar que el contenido cargue
  162 |     await expect(page.locator('text=¡Hola,')).toBeVisible({ timeout: 35000 })
  163 | 
  164 |     // Click en botón Salir de la BottomNav
  165 |     await page.click('button:has-text("Salir")')
  166 | 
  167 |     // Debería redirigir a login (clearAuth + useEffect en layout)
  168 |     await expect(page).toHaveURL(/\/login/, { timeout: 35000 })
  169 |   })
  170 | 
  171 |   // ─── PADRÓN ───────────────────────────────────────────────────
  172 | 
  173 |   test('Test 05: Padrón de beneficiarios carga listado', async ({ page }) => {
  174 |     await loginAsAdmin(page)
  175 |     await page.goto('/mobile/padron')
  176 |     await page.waitForLoadState('domcontentloaded')
  177 | 
  178 |     // El título "Padrón" debe aparecer
  179 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  180 |   })
  181 | 
  182 |   test('Test 06: Búsqueda de beneficiarios filtra resultados', async ({ page }) => {
  183 |     await loginAsAdmin(page)
  184 |     await page.goto('/mobile/padron')
  185 |     await page.waitForLoadState('domcontentloaded')
  186 | 
  187 |     // Esperar a que la lista cargue (desaparece el skeleton)
  188 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  189 |     await page.waitForTimeout(2000) // esperar carga de beneficiarios
  190 | 
  191 |     await page.fill('input[placeholder="Buscar por nombre o DNI…"]', 'NombreInexistente99999XYZ')
  192 | 
  193 |     // Debería mostrar "Sin resultados" (el debounce aplica en el fetchBeneficiaries via useCallback)
  194 |     await expect(page.locator('text=Sin resultados')).toBeVisible({ timeout: 35000 })
  195 |   })
  196 | 
  197 |   test('Test 07.1: Formulario de nuevo beneficiario valida obligatorios (Falla)', async ({ page }) => {
  198 |     await loginAsAdmin(page)
  199 |     await page.goto('/mobile/padron')
  200 |     await page.waitForLoadState('domcontentloaded')
  201 | 
  202 |     // Esperar carga
  203 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  204 | 
  205 |     // Abrir formulario
  206 |     await page.click('button[aria-label="Agregar beneficiario"]')
  207 | 
  208 |     // Esperar que el sheet abra
  209 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  210 | 
  211 |     // Intentar guardar sin datos
  212 |     await page.click('button:has-text("Guardar beneficiario")')
  213 | 
  214 |     // Mensajes de validación (ahora incluye DNI y Olla obligatorios)
  215 |     await expect(page.locator('text=El nombre es obligatorio')).toBeVisible()
  216 |     await expect(page.locator('text=Los apellidos son obligatorios')).toBeVisible()
  217 |     await expect(page.locator('text=El DNI es obligatorio')).toBeVisible()
  218 |     await expect(page.locator('text=La olla común es obligatoria')).toBeVisible()
  219 |   })
  220 | 
  221 |   test('Test 07.2: Creación exitosa de un beneficiario (Éxito)', async ({ page }) => {
  222 |     await loginAsAdmin(page)
  223 |     const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  224 |     await page.goto('/mobile/padron')
  225 |     await page.waitForLoadState('networkidle')
  226 | 
  227 |     // Esperar carga
  228 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  229 | 
  230 |     // Abrir formulario
  231 |     await page.click('button[aria-label="Agregar beneficiario"]')
  232 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  233 | 
  234 |     // Llenar campos obligatorios
  235 |     await page.fill('#firstName', 'TestE2E')
  236 |     await page.fill('#lastName', 'Playwright')
  237 |     await page.fill('#dni', randomDni)
  238 |     await page.fill('#birthDate', '1995-02-20')
  239 | 
  240 |     // Seleccionar olla común (primer option después del placeholder)
  241 |     await page.selectOption('#ollaId', { index: 1 })
  242 | 
  243 |     // Guardar
  244 |     await page.click('button:has-text("Guardar beneficiario")')
  245 | 
  246 |     // Esperar a que el botón de guardado desaparezca (indica que el form procesó)
  247 |     await expect(page.locator('button:has-text("Guardando...")')).toBeHidden({ timeout: 35000 })
  248 | 
  249 |     // Buscar por DNI para confirmar que el beneficiario existe en la lista
  250 |     await page.fill('input[placeholder="Buscar por nombre o DNI…"]', randomDni)
  251 | 
  252 |     // Debe encontrar el beneficiario recién creado
> 253 |     await expect(page.locator(`text=${randomDni}`)).toBeVisible({ timeout: 35000 })
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  254 |   })
  255 | 
  256 |   test('Test 07.3: Registrar beneficiario con DNI existente en el padrón móvil (Falla)', async ({ page }) => {
  257 |     await loginAsAdmin(page)
  258 |     await page.goto('/mobile/padron')
  259 |     await page.waitForLoadState('domcontentloaded')
  260 | 
  261 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  262 |     await page.click('button[aria-label="Agregar beneficiario"]')
  263 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  264 | 
  265 |     // Usar DNI ya existente
  266 |     await page.fill('#firstName', 'Falla')
  267 |     await page.fill('#lastName', 'Registro')
  268 |     await page.fill('#dni', '87654321') // Creado previamente en functional tests
  269 |     await page.fill('#birthDate', '1995-02-20')
  270 | 
  271 |     // Seleccionar olla común
  272 |     await page.selectOption('#ollaId', { index: 1 })
  273 | 
  274 |     await page.click('button:has-text("Guardar beneficiario")')
  275 | 
  276 |     // Debería mostrar un toast de error o permanecer visible indicando error
  277 |     await expect(page.locator('text=Ya existe').or(page.locator('text=Nuevo beneficiario'))).toBeVisible()
  278 |   })
  279 | 
  280 |   test('Test 07.4: Registrar beneficiario con DNI con longitud inválida (menos de 8 dígitos) (Falla)', async ({ page }) => {
  281 |     await loginAsAdmin(page)
  282 |     await page.goto('/mobile/padron')
  283 |     await page.waitForLoadState('domcontentloaded')
  284 | 
  285 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  286 |     await page.click('button[aria-label="Agregar beneficiario"]')
  287 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  288 | 
  289 |     await page.fill('#firstName', 'Dni')
  290 |     await page.fill('#lastName', 'Corto')
  291 |     await page.fill('#dni', '12345')
  292 |     await page.fill('#birthDate', '1995-02-20')
  293 | 
  294 |     await page.selectOption('#ollaId', { index: 1 })
  295 |     await page.click('button:has-text("Guardar beneficiario")')
  296 | 
  297 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible()
  298 |   })
  299 | 
  300 |   test('Test 07.5: Registrar beneficiario con fecha de nacimiento en el futuro (Falla)', async ({ page }) => {
  301 |     await loginAsAdmin(page)
  302 |     await page.goto('/mobile/padron')
  303 |     await page.waitForLoadState('domcontentloaded')
  304 | 
  305 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  306 |     await page.click('button[aria-label="Agregar beneficiario"]')
  307 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 20000 })
  308 | 
  309 |     await page.fill('#firstName', 'Fecha')
  310 |     await page.fill('#lastName', 'Futura')
  311 |     await page.fill('#dni', '12345678')
  312 |     await page.fill('#birthDate', '3026-02-20')
  313 | 
  314 |     await page.selectOption('#ollaId', { index: 1 })
  315 |     await page.click('button:has-text("Guardar beneficiario")')
  316 | 
  317 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible()
  318 |   })
  319 | 
  320 |   // ─── INVENTARIO ───────────────────────────────────────────────
  321 | 
  322 |   test('Test 08: Inventario muestra lista de stock actual', async ({ page }) => {
  323 |     await loginAsAdmin(page)
  324 |     await page.goto('/mobile/inventario')
  325 |     await page.waitForLoadState('domcontentloaded')
  326 | 
  327 |     // El título "Inventario" debe aparecer
  328 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  329 |   })
  330 | 
  331 |   test('Test 09.1: Registro de movimiento de ingreso en Inventario (Éxito)', async ({ page }) => {
  332 |     await loginAsAdmin(page)
  333 |     await page.goto('/mobile/inventario')
  334 |     await page.waitForLoadState('domcontentloaded')
  335 | 
  336 |     // Esperar carga
  337 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  338 | 
  339 |     // Click en "Registrar Entrada"
  340 |     await page.click('button:has-text("Registrar Entrada")')
  341 | 
  342 |     // Esperar que aparezca el stepper (cambia título a "Registrar Entrada")
  343 |     await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 20000 })
  344 | 
  345 |     // Seleccionar un insumo (el primero visible que contenga texto de un insumo)
  346 |     const firstItem = page.locator('button[class*="cursor-pointer"]').first()
  347 |     if (await firstItem.isVisible()) {
  348 |       await firstItem.click()
  349 |     }
  350 | 
  351 |     // Click en "Siguiente Paso ➡️"
  352 |     const nextButton = page.locator('button:has-text("Siguiente Paso")')
  353 |     if (await nextButton.isVisible({ timeout: 15000 }).catch(() => false)) {
```