# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 23: Creación de Olla Común
- Location: e2e\workspace.spec.ts:354:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2:has-text("Ollas Comunes")')
Expected: visible
Timeout: 35000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 35000ms
  - waiting for locator('h2:has-text("Ollas Comunes")')

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
    - button "AP Admin Principal admin@ollascomunes.pe"
- button "Toggle Sidebar"
- main:
  - button "Toggle Sidebar"
  - text: Ollas Comunes Plataforma de gestion comunitaria
  - heading "Organizaciones" [level=1]
  - paragraph: Gestiona las organizaciones y sus ollas comunes
  - link "Nueva organización":
    - /url: /workspace/organizaciones/nueva/
  - link "Municipalidad de Lima Centro Lima Municipalidad Inactiva MUNI-LIMA-CENTRO · Creado 24 abr. 2026":
    - /url: /workspace/organizaciones/municipalidad-de-lima-centro/
  - link "Municipalidad de San Juan de Lurigancho Lima Este Municipalidad Activa MUNI-SJL · Creado 24 abr. 2026":
    - /url: /workspace/organizaciones/municipalidad-de-san-juan-de-lurigancho/
  - link "Nueva Esperanza Comas Municipalidad Activa NUEVA-ESPERANZA · Creado 08 may. 2026":
    - /url: /workspace/organizaciones/nueva-esperanza/
  - link "Nueva Esperanza 2 XX33+HHP, Jirón Ascope 16, Lima 15082, Peru Municipalidad Activa NUEVA-ESPERANZA-2 · Creado 08 may. 2026":
    - /url: /workspace/organizaciones/nueva-esperanza-2/
  - link "Nueva Esperanza 22 Comas Municipalidad Activa NUEVA-ESPERANZA-22 · Creado 05 jun. 2026":
    - /url: /workspace/organizaciones/nueva-esperanza-22/
  - link "Org E2E Test 1542 Lima Norte Municipalidad Activa ORG-E2E-TEST-1542 · Creado 15 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-1542/
  - link "Org E2E Test 1861 Lima Norte Municipalidad Activa ORG-E2E-TEST-1861 · Creado 15 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-1861/
  - link "Org E2E Test 2170 Lima Norte Municipalidad Activa ORG-E2E-TEST-2170 · Creado 16 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-2170/
  - link "Org E2E Test 2450 Lima Norte Municipalidad Activa ORG-E2E-TEST-2450 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-2450/
  - link "Org E2E Test 2641 Lima Norte Municipalidad Activa ORG-E2E-TEST-2641 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-2641/
  - link "Org E2E Test 3369 Lima Norte Municipalidad Activa ORG-E2E-TEST-3369 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-3369/
  - link "Org E2E Test 3722 Lima Norte Municipalidad Activa ORG-E2E-TEST-3722 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-3722/
  - link "Org E2E Test 3897 Lima Norte Municipalidad Activa ORG-E2E-TEST-3897 · Creado 16 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-3897/
  - link "Org E2E Test 4367 Lima Norte Municipalidad Activa ORG-E2E-TEST-4367 · Creado 16 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-4367/
  - link "Org E2E Test 4571 Lima Norte Municipalidad Activa ORG-E2E-TEST-4571 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-4571/
  - link "Org E2E Test 498 Lima Norte Municipalidad Activa ORG-E2E-TEST-498 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-498/
  - link "Org E2E Test 5447 Lima Norte Municipalidad Activa ORG-E2E-TEST-5447 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-5447/
  - link "Org E2E Test 548 Lima Norte Municipalidad Activa ORG-E2E-TEST-548 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-548/
  - link "Org E2E Test 5524 Lima Norte Municipalidad Activa ORG-E2E-TEST-5524 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-5524/
  - link "Org E2E Test 5937 Lima Norte Municipalidad Activa ORG-E2E-TEST-5937 · Creado 19 jul. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-5937/
  - link "Org E2E Test 6309 Lima Norte Municipalidad Activa ORG-E2E-TEST-6309 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-6309/
  - link "Org E2E Test 6436 Lima Norte Municipalidad Activa ORG-E2E-TEST-6436 · Creado 16 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-6436/
  - link "Org E2E Test 6599 Lima Norte Municipalidad Activa ORG-E2E-TEST-6599 · Creado 16 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-6599/
  - link "Org E2E Test 6836 Lima Norte Municipalidad Activa ORG-E2E-TEST-6836 · Creado 14 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-6836/
  - link "Org E2E Test 9768 Lima Norte Municipalidad Activa ORG-E2E-TEST-9768 · Creado 13 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-9768/
  - link "Org E2E Test 9981 Lima Norte Municipalidad Activa ORG-E2E-TEST-9981 · Creado 14 jun. 2026":
    - /url: /workspace/organizaciones/org-e2e-test-9981/
  - link "Programa Ollas Solidarias Norte Lima Norte Programa social Activa OLLAS-SOL-NORTE · Creado 24 abr. 2026":
    - /url: /workspace/organizaciones/programa-ollas-solidarias-norte/
  - link "Uwuntu Lima Norte Municipalidad Activa UWUNTU · Creado 08 may. 2026":
    - /url: /workspace/organizaciones/uwuntu/
- region "Notifications alt+T"
- alert
```

# Test source

```ts
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
  320 |     await expect(page.locator(`h1:has-text("${orgName}")`)).toBeVisible({ timeout: 35000 })
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
> 365 |     await expect(page.locator('h2:has-text("Ollas Comunes")')).toBeVisible({ timeout: 35000 })
      |                                                                ^ Error: expect(locator).toBeVisible() failed
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
  421 | 
  422 |     // Validar mensaje de éxito de mock
  423 |     await expect(page.locator('text=Datos actualizados correctamente.')).toBeVisible({ timeout: 20000 })
  424 |   })
  425 | 
  426 |   test('Test 24.2: Edición de perfil con correo inválido (Falla)', async ({ page }) => {
  427 |     await loginAsAdmin(page)
  428 |     await page.goto('/workspace/perfil')
  429 |     await page.waitForLoadState('domcontentloaded')
  430 | 
  431 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  432 | 
  433 |     // Rellenar email inválido
  434 |     await page.fill('#profile-email', 'email-invalido')
  435 |     await page.click('button:has-text("Guardar cambios")')
  436 | 
  437 |     // Debería mostrar Toast o invalidar
  438 |   })
  439 | 
  440 |   test('Test 24.3: Cambio de contraseña sin contraseña actual (Falla)', async ({ page }) => {
  441 |     await loginAsAdmin(page)
  442 |     await page.goto('/workspace/perfil')
  443 |     await page.waitForLoadState('domcontentloaded')
  444 | 
  445 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  446 | 
  447 |     await page.fill('#new-password', 'newSecurePass123')
  448 |     await page.fill('#confirm-password', 'newSecurePass123')
  449 |     await page.click('button:has-text("Guardar cambios")')
  450 | 
  451 |     await expect(page.locator('text=contraseña actual')).toBeVisible({ timeout: 20000 })
  452 |   })
  453 | 
  454 |   test('Test 24.4: Cambio de contraseña con nueva contraseña corta (Falla)', async ({ page }) => {
  455 |     await loginAsAdmin(page)
  456 |     await page.goto('/workspace/perfil')
  457 |     await page.waitForLoadState('domcontentloaded')
  458 | 
  459 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  460 | 
  461 |     await page.fill('#current-password', 'admin123')
  462 |     await page.fill('#new-password', '123')
  463 |     await page.fill('#confirm-password', '123')
  464 |     await page.click('button:has-text("Guardar cambios")')
  465 | 
```