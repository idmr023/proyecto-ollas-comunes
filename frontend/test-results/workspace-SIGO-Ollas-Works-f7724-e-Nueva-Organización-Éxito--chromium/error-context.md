# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 22.1: Creación de Nueva Organización (Éxito)
- Location: e2e\workspace.spec.ts:301:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text("Org E2E Test 9066")')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 35000ms
  - waiting for locator('h1:has-text("Org E2E Test 9066")')

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
  - link "Organizaciones":
    - /url: /workspace/home/
  - heading "Nueva organizacion" [level=1]
  - text: Nombre
  - textbox "Nombre":
    - /placeholder: Municipalidad o programa
    - text: Org E2E Test 9066
  - text: Categoria
  - combobox "Categoria":
    - option "Municipalidad" [selected]
    - option "Programa social"
  - text: Ubicacion
  - textbox "Ubicacion":
    - /placeholder: Distrito o referencia
    - text: Lima Norte
  - paragraph: Token no proporcionado.
  - link "Cancelar":
    - /url: /workspace/home/
  - button "Crear organizacion"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  221 | 
  222 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible()
  223 |   })
  224 | 
  225 |   test('Test 18.5: Registrar beneficiario con fecha de nacimiento futura (Falla)', async ({ page }) => {
  226 |     await loginAsAdmin(page)
  227 |     await page.goto('/workspace/beneficiarios')
  228 |     await page.waitForLoadState('domcontentloaded')
  229 | 
  230 |     await page.click('button:has-text("Registrar Beneficiario")')
  231 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  232 | 
  233 |     await page.fill('#firstName', 'AdminTest')
  234 |     await page.fill('#lastName', 'Playwright')
  235 |     await page.fill('#dni', '12345678')
  236 |     await page.fill('#birthDate', '3026-05-15')
  237 | 
  238 |     await page.selectOption('#ollaId', { index: 1 })
  239 |     await page.click('div.z-50 button:has-text("Registrar")')
  240 | 
  241 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible()
  242 |   })
  243 | 
  244 |   test('Test 19: Edición de Beneficiario', async ({ page }) => {
  245 |     await loginAsAdmin(page)
  246 |     await page.goto('/workspace/beneficiarios')
  247 |     await page.waitForLoadState('domcontentloaded')
  248 | 
  249 |     // Esperar a que cargue la lista
  250 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  251 | 
  252 |     // Hacer clic en "Editar" del primer registro disponible
  253 |     const firstRowEdit = page.locator('button:has-text("Editar")').first()
  254 |     await expect(firstRowEdit).toBeVisible({ timeout: 35000 })
  255 |     await firstRowEdit.click()
  256 | 
  257 |     // Esperar que cargue el modal de edición
  258 |     await expect(page.locator('h2:has-text("Editar Beneficiario")')).toBeVisible({ timeout: 20000 })
  259 | 
  260 |     // Modificar nombre
  261 |     await page.fill('#firstName', 'AdminTestModificado')
  262 | 
  263 |     // Guardar
  264 |     await page.click('button:has-text("Actualizar")')
  265 | 
  266 |     // Esperar cierre de modal
  267 |     await expect(page.locator('h2:has-text("Editar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
  268 |   })
  269 | 
  270 |   test('Test 20: Eliminación de Beneficiario', async ({ page }) => {
  271 |     await loginAsAdmin(page)
  272 |     await page.goto('/workspace/beneficiarios')
  273 |     await page.waitForLoadState('domcontentloaded')
  274 | 
  275 |     // Esperar a que cargue la lista
  276 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  277 | 
  278 |     // Obtener la cantidad de botones "Eliminar" antes
  279 |     const deleteButtons = page.locator('button:has-text("Eliminar")')
  280 |     if (await deleteButtons.count() > 0) {
  281 |       const firstDelete = deleteButtons.first()
  282 |       await firstDelete.click()
  283 | 
  284 |       // Esperar a que se procese la eliminación y desaparezca
  285 |       await expect(firstDelete).not.toBeVisible({ timeout: 35000 })
  286 |     }
  287 |   })
  288 | 
  289 |   // ─── GESTIÓN DE ORGANIZACIONES Y OLLAS ────────────────────────
  290 | 
  291 |   test('Test 21: Listado de Organizaciones', async ({ page }) => {
  292 |     await loginAsAdmin(page)
  293 |     await page.goto('/workspace/organizaciones')
  294 |     await page.waitForLoadState('domcontentloaded')
  295 | 
  296 |     // Verificar título principal
  297 |     await expect(page.locator('h1:has-text("Organizaciones")')).toBeVisible({ timeout: 35000 })
  298 |     await expect(page.locator('text=Nueva organización')).toBeVisible()
  299 |   })
  300 | 
  301 |   test('Test 22.1: Creación de Nueva Organización (Éxito)', async ({ page }) => {
  302 |     await loginAsAdmin(page)
  303 |     const orgName = `Org E2E Test ${Math.floor(Math.random() * 10000)}`
  304 | 
  305 |     await page.goto('/workspace/organizaciones')
  306 |     await page.waitForLoadState('domcontentloaded')
  307 | 
  308 |     // Clic en Nueva organización
  309 |     await page.click('text=Nueva organización')
  310 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  311 | 
  312 |     // Llenar formulario
  313 |     await page.fill('#organization-name', orgName)
  314 |     await page.fill('#organization-location', 'Lima Norte')
  315 | 
  316 |     // Enviar formulario
  317 |     await page.click('button:has-text("Crear organizacion")')
  318 | 
  319 |     // Debería redirigir al detalle de la organización recién creada
  320 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\//, { timeout: 45000 })
> 321 |     await expect(page.locator(`h1:has-text("${orgName}")`)).toBeVisible({ timeout: 35000 })
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  322 |   })
  323 | 
  324 |   test('Test 22.2: Crear organización con nombre vacío (Falla)', async ({ page }) => {
  325 |     await loginAsAdmin(page)
  326 |     await page.goto('/workspace/organizaciones')
  327 |     await page.waitForLoadState('domcontentloaded')
  328 | 
  329 |     await page.click('text=Nueva organización')
  330 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  331 | 
  332 |     // Intentar guardar con nombre vacío
  333 |     await page.fill('#organization-name', '')
  334 |     await page.click('button:has-text("Crear organizacion")')
  335 | 
  336 |     // Debería permanecer en la misma vista de creación
  337 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  338 |   })
  339 | 
  340 |   test('Test 22.3: Crear organización con ubicación vacía (Falla)', async ({ page }) => {
  341 |     await loginAsAdmin(page)
  342 |     await page.goto('/workspace/organizaciones')
  343 |     await page.waitForLoadState('domcontentloaded')
  344 | 
  345 |     await page.click('text=Nueva organización')
  346 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  347 | 
  348 |     await page.fill('#organization-name', 'Municipalidad Test')
  349 |     await page.fill('#organization-location', '')
  350 |     await page.click('button:has-text("Crear organizacion")')
  351 | 
  352 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  353 |   })
  354 | 
  355 |   test('Test 23: Creación de Olla Común', async ({ page }) => {
  356 |     await loginAsAdmin(page)
  357 |     await page.goto('/workspace/organizaciones')
  358 |     await page.waitForLoadState('domcontentloaded')
  359 | 
  360 |     // Entrar a la primera organización del listado (excluyendo el botón "nueva")
  361 |     const firstOrgCard = page.locator('a[href^="/workspace/organizaciones/"]:not([href$="/nueva"])').first()
  362 |     await expect(firstOrgCard).toBeVisible({ timeout: 35000 })
  363 |     await firstOrgCard.click()
  364 | 
  365 |     // Verificar que estamos en la vista de detalle
  366 |     await expect(page.locator('h2:has-text("Ollas Comunes")')).toBeVisible({ timeout: 35000 })
  367 | 
  368 |     // Clic en Crear Olla
  369 |     await page.click('button:has-text("Crear Olla")')
  370 |     await expect(page.locator('h2:has-text("Crear Olla Comun")')).toBeVisible({ timeout: 20000 })
  371 | 
  372 |     // Llenar campos
  373 |     const randomOllaName = `Olla E2E ${Math.floor(Math.random() * 10000)}`
  374 |     await page.fill('#olla-name', randomOllaName)
  375 |     await page.fill('#olla-address', 'Dirección E2E 123')
  376 | 
  377 |     // Guardar
  378 |     await page.click('button:has-text("Crear Olla Comun")')
  379 | 
  380 |     // Esperar cierre de modal
  381 |     await expect(page.locator('h2:has-text("Crear Olla Comun")')).not.toBeVisible({ timeout: 35000 })
  382 | 
  383 |     // Verificar que aparezca en la lista de ollas
  384 |     await expect(page.locator(`text=${randomOllaName}`)).toBeVisible({ timeout: 35000 })
  385 |   })
  386 | 
  387 |   test('Test 23.2: Crear Olla Común con nombre vacío (Falla)', async ({ page }) => {
  388 |     await loginAsAdmin(page)
  389 |     await page.goto('/workspace/organizaciones')
  390 |     await page.waitForLoadState('domcontentloaded')
  391 | 
  392 |     const firstOrgCard = page.locator('a[href^="/workspace/organizaciones/"]:not([href$="/nueva"])').first()
  393 |     await expect(firstOrgCard).toBeVisible({ timeout: 35000 })
  394 |     await firstOrgCard.click()
  395 | 
  396 |     await expect(page.locator('h2:has-text("Ollas Comunes")')).toBeVisible({ timeout: 35000 })
  397 |     await page.click('button:has-text("Crear Olla")')
  398 |     await expect(page.locator('h2:has-text("Crear Olla Comun")')).toBeVisible({ timeout: 20000 })
  399 | 
  400 |     await page.fill('#olla-name', '')
  401 |     await page.fill('#olla-address', 'Dirección de prueba')
  402 |     await page.click('button:has-text("Crear Olla Comun")')
  403 | 
  404 |     await expect(page.locator('h2:has-text("Crear Olla Comun")')).toBeVisible()
  405 |   })
  406 | 
  407 |   // ─── CONFIGURACIÓN Y PREFERENCIAS ──────────────────────────────
  408 | 
  409 |   test('Test 24.1: Mi Perfil - Edición de Datos (Mock) (Éxito)', async ({ page }) => {
  410 |     await loginAsAdmin(page)
  411 |     await page.goto('/workspace/perfil')
  412 |     await page.waitForLoadState('domcontentloaded')
  413 | 
  414 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  415 | 
  416 |     // Modificar datos
  417 |     await page.fill('#profile-name', 'Admin Test Playwright Modificado')
  418 |     await page.fill('#profile-email', 'admin-modificado@ollascomunes.pe')
  419 | 
  420 |     // Guardar
  421 |     await page.click('button:has-text("Guardar cambios")')
```