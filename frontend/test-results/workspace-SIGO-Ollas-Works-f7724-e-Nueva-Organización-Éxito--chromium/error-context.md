# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 22.1: Creación de Nueva Organización (Éxito)
- Location: e2e\workspace.spec.ts:300:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1:has-text("Org E2E Test 5937")')
Expected: visible
Timeout: 35000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 35000ms
  - waiting for locator('h1:has-text("Org E2E Test 5937")')
    - waiting for" http://localhost:3000/workspace/organizaciones/org-e2e-test-5937/" navigation to finish...
    - navigated to "http://localhost:3000/workspace/organizaciones/org-e2e-test-5937/"

```

```yaml
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- link "Next.js 16.2.4 (stale) Turbopack":
  - /url: https://nextjs.org/docs/messages/version-staleness
  - img
  - text: Next.js 16.2.4 (stale) Turbopack
- img
- dialog "Runtime Error":
  - text: Runtime Error
  - button "Copy Error Info":
    - img
  - button "No related documentation found" [disabled]:
    - img
  - button "Attach Node.js inspector":
    - img
  - text: "Page \"/workspace/organizaciones/[slug]/page\" is missing param \"/workspace/organizaciones/[slug]\" in \"generateStaticParams()\", which is required with \"output: export\" config."
  - paragraph: Call Stack 15
  - button "Show 15 ignore-listed frame(s)":
    - text: Show 15 ignore-listed frame(s)
    - img
- contentinfo:
  - region "Error feedback":
    - paragraph:
      - link "Was this helpful?":
        - /url: https://nextjs.org/telemetry#error-feedback
    - button "Mark as helpful"
    - button "Mark as not helpful"
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- button "Collapse issues badge":
  - img
- alert
```

# Test source

```ts
  220 | 
  221 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible()
  222 |   })
  223 | 
  224 |   test('Test 18.5: Registrar beneficiario con fecha de nacimiento futura (Falla)', async ({ page }) => {
  225 |     await loginAsAdmin(page)
  226 |     await page.goto('/workspace/beneficiarios')
  227 |     await page.waitForLoadState('domcontentloaded')
  228 | 
  229 |     await page.click('button:has-text("Registrar Beneficiario")')
  230 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  231 | 
  232 |     await page.fill('#firstName', 'AdminTest')
  233 |     await page.fill('#lastName', 'Playwright')
  234 |     await page.fill('#dni', '12345678')
  235 |     await page.fill('#birthDate', '3026-05-15')
  236 | 
  237 |     await page.selectOption('#ollaId', { index: 1 })
  238 |     await page.click('div.z-50 button:has-text("Registrar")')
  239 | 
  240 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible()
  241 |   })
  242 | 
  243 |   test('Test 19: Edición de Beneficiario', async ({ page }) => {
  244 |     await loginAsAdmin(page)
  245 |     await page.goto('/workspace/beneficiarios')
  246 |     await page.waitForLoadState('domcontentloaded')
  247 | 
  248 |     // Esperar a que cargue la lista
  249 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  250 | 
  251 |     // Hacer clic en "Editar" del primer registro disponible
  252 |     const firstRowEdit = page.locator('button:has-text("Editar")').first()
  253 |     await expect(firstRowEdit).toBeVisible({ timeout: 35000 })
  254 |     await firstRowEdit.click()
  255 | 
  256 |     // Esperar que cargue el modal de edición
  257 |     await expect(page.locator('h2:has-text("Editar Beneficiario")')).toBeVisible({ timeout: 20000 })
  258 | 
  259 |     // Modificar nombre
  260 |     await page.fill('#firstName', 'AdminTestModificado')
  261 | 
  262 |     // Guardar
  263 |     await page.click('button:has-text("Actualizar")')
  264 | 
  265 |     // Esperar cierre de modal
  266 |     await expect(page.locator('h2:has-text("Editar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
  267 |   })
  268 | 
  269 |   test('Test 20: Eliminación de Beneficiario', async ({ page }) => {
  270 |     await loginAsAdmin(page)
  271 |     await page.goto('/workspace/beneficiarios')
  272 |     await page.waitForLoadState('domcontentloaded')
  273 | 
  274 |     // Esperar a que cargue la lista
  275 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  276 | 
  277 |     // Obtener la cantidad de botones "Eliminar" antes
  278 |     const deleteButtons = page.locator('button:has-text("Eliminar")')
  279 |     if (await deleteButtons.count() > 0) {
  280 |       const firstDelete = deleteButtons.first()
  281 |       await firstDelete.click()
  282 | 
  283 |       // Esperar a que se procese la eliminación y desaparezca
  284 |       await expect(firstDelete).not.toBeVisible({ timeout: 35000 })
  285 |     }
  286 |   })
  287 | 
  288 |   // ─── GESTIÓN DE ORGANIZACIONES Y OLLAS ────────────────────────
  289 | 
  290 |   test('Test 21: Listado de Organizaciones', async ({ page }) => {
  291 |     await loginAsAdmin(page)
  292 |     await page.goto('/workspace/organizaciones')
  293 |     await page.waitForLoadState('domcontentloaded')
  294 | 
  295 |     // Verificar título principal
  296 |     await expect(page.locator('h1:has-text("Organizaciones")')).toBeVisible({ timeout: 35000 })
  297 |     await expect(page.locator('text=Nueva organización')).toBeVisible()
  298 |   })
  299 | 
  300 |   test('Test 22.1: Creación de Nueva Organización (Éxito)', async ({ page }) => {
  301 |     await loginAsAdmin(page)
  302 |     const orgName = `Org E2E Test ${Math.floor(Math.random() * 10000)}`
  303 | 
  304 |     await page.goto('/workspace/organizaciones')
  305 |     await page.waitForLoadState('domcontentloaded')
  306 | 
  307 |     // Clic en Nueva organización
  308 |     await page.click('text=Nueva organización')
  309 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  310 | 
  311 |     // Llenar formulario
  312 |     await page.fill('#organization-name', orgName)
  313 |     await page.fill('#organization-location', 'Lima Norte')
  314 | 
  315 |     // Enviar formulario
  316 |     await page.click('button:has-text("Crear organizacion")')
  317 | 
  318 |     // Debería redirigir al detalle de la organización recién creada
  319 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\//, { timeout: 45000 })
> 320 |     await expect(page.locator(`h1:has-text("${orgName}")`)).toBeVisible({ timeout: 35000 })
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  321 |   })
  322 | 
  323 |   test('Test 22.2: Crear organización con nombre vacío (Falla)', async ({ page }) => {
  324 |     await loginAsAdmin(page)
  325 |     await page.goto('/workspace/organizaciones')
  326 |     await page.waitForLoadState('domcontentloaded')
  327 | 
  328 |     await page.click('text=Nueva organización')
  329 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  330 | 
  331 |     // Intentar guardar con nombre vacío
  332 |     await page.fill('#organization-name', '')
  333 |     await page.click('button:has-text("Crear organizacion")')
  334 | 
  335 |     // Debería permanecer en la misma vista de creación
  336 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  337 |   })
  338 | 
  339 |   test('Test 22.3: Crear organización con ubicación vacía (Falla)', async ({ page }) => {
  340 |     await loginAsAdmin(page)
  341 |     await page.goto('/workspace/organizaciones')
  342 |     await page.waitForLoadState('domcontentloaded')
  343 | 
  344 |     await page.click('text=Nueva organización')
  345 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  346 | 
  347 |     await page.fill('#organization-name', 'Municipalidad Test')
  348 |     await page.fill('#organization-location', '')
  349 |     await page.click('button:has-text("Crear organizacion")')
  350 | 
  351 |     await expect(page).toHaveURL(/\/workspace\/organizaciones\/nueva/)
  352 |   })
  353 | 
  354 |   test('Test 23: Creación de Olla Común', async ({ page }) => {
  355 |     await loginAsAdmin(page)
  356 |     await page.goto('/workspace/organizaciones')
  357 |     await page.waitForLoadState('domcontentloaded')
  358 | 
  359 |     // Entrar a la primera organización del listado (excluyendo el botón "nueva")
  360 |     const firstOrgCard = page.locator('a[href^="/workspace/organizaciones/"]:not([href$="/nueva"])').first()
  361 |     await expect(firstOrgCard).toBeVisible({ timeout: 35000 })
  362 |     await firstOrgCard.click()
  363 | 
  364 |     // Verificar que estamos en la vista de detalle
  365 |     await expect(page.locator('h2:has-text("Ollas Comunes")')).toBeVisible({ timeout: 35000 })
  366 | 
  367 |     // Clic en Crear Olla
  368 |     await page.click('button:has-text("Crear Olla")')
  369 |     await expect(page.locator('h2:has-text("Crear Olla Comun")')).toBeVisible({ timeout: 20000 })
  370 | 
  371 |     // Llenar campos
  372 |     const randomOllaName = `Olla E2E ${Math.floor(Math.random() * 10000)}`
  373 |     await page.fill('#olla-name', randomOllaName)
  374 |     await page.fill('#olla-address', 'Dirección E2E 123')
  375 | 
  376 |     // Guardar
  377 |     await page.click('button:has-text("Crear Olla Comun")')
  378 | 
  379 |     // Esperar cierre de modal
  380 |     await expect(page.locator('h2:has-text("Crear Olla Comun")')).not.toBeVisible({ timeout: 35000 })
  381 | 
  382 |     // Verificar que aparezca en la lista de ollas
  383 |     await expect(page.locator(`text=${randomOllaName}`)).toBeVisible({ timeout: 35000 })
  384 |   })
  385 | 
  386 |   test('Test 23.2: Crear Olla Común con nombre vacío (Falla)', async ({ page }) => {
  387 |     await loginAsAdmin(page)
  388 |     await page.goto('/workspace/organizaciones')
  389 |     await page.waitForLoadState('domcontentloaded')
  390 | 
  391 |     const firstOrgCard = page.locator('a[href^="/workspace/organizaciones/"]:not([href$="/nueva"])').first()
  392 |     await expect(firstOrgCard).toBeVisible({ timeout: 35000 })
  393 |     await firstOrgCard.click()
  394 | 
  395 |     await expect(page.locator('h2:has-text("Ollas Comunes")')).toBeVisible({ timeout: 35000 })
  396 |     await page.click('button:has-text("Crear Olla")')
  397 |     await expect(page.locator('h2:has-text("Crear Olla Comun")')).toBeVisible({ timeout: 20000 })
  398 | 
  399 |     await page.fill('#olla-name', '')
  400 |     await page.fill('#olla-address', 'Dirección de prueba')
  401 |     await page.click('button:has-text("Crear Olla Comun")')
  402 | 
  403 |     await expect(page.locator('h2:has-text("Crear Olla Comun")')).toBeVisible()
  404 |   })
  405 | 
  406 |   // ─── CONFIGURACIÓN Y PREFERENCIAS ──────────────────────────────
  407 | 
  408 |   test('Test 24.1: Mi Perfil - Edición de Datos (Mock) (Éxito)', async ({ page }) => {
  409 |     await loginAsAdmin(page)
  410 |     await page.goto('/workspace/perfil')
  411 |     await page.waitForLoadState('domcontentloaded')
  412 | 
  413 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  414 | 
  415 |     // Modificar datos
  416 |     await page.fill('#profile-name', 'Admin Test Playwright Modificado')
  417 |     await page.fill('#profile-email', 'admin-modificado@ollascomunes.pe')
  418 | 
  419 |     // Guardar
  420 |     await page.click('button:has-text("Guardar cambios")')
```