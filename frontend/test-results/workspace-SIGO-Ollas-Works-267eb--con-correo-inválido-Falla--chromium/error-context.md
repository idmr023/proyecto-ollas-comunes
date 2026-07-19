# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 24.2: Edición de perfil con correo inválido (Falla)
- Location: e2e\workspace.spec.ts:426:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('#profile-email')
    - locator resolved to <input disabled data-slot="input" id="profile-email" value="admin@ollascomunes.pe" class="h-8 w-full min-w-0 rounded-lg border border-input px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacit…/>
    - fill("email-invalido")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not enabled
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not enabled
    - retrying fill action
      - waiting 100ms
    108 × waiting for element to be visible, enabled and editable
        - element is not enabled
      - retrying fill action
        - waiting 500ms

```

# Test source

```ts
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
> 434 |     await page.fill('#profile-email', 'email-invalido')
      |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
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
  466 |     await expect(page.locator('text=al menos 6 caracteres')).toBeVisible({ timeout: 20000 })
  467 |   })
  468 | 
  469 |   test('Test 24.5: Cambio de contraseña con confirmación que no coincide (Falla)', async ({ page }) => {
  470 |     await loginAsAdmin(page)
  471 |     await page.goto('/workspace/perfil')
  472 |     await page.waitForLoadState('domcontentloaded')
  473 | 
  474 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  475 | 
  476 |     await page.fill('#current-password', 'admin123')
  477 |     await page.fill('#new-password', 'newSecurePass123')
  478 |     await page.fill('#confirm-password', 'differentPass')
  479 |     await page.click('button:has-text("Guardar cambios")')
  480 | 
  481 |     await expect(page.locator('text=no coinciden')).toBeVisible({ timeout: 20000 })
  482 |   })
  483 | 
  484 |   test('Test 24.6: Guardar perfil con nombre vacío (Falla)', async ({ page }) => {
  485 |     await loginAsAdmin(page)
  486 |     await page.goto('/workspace/perfil')
  487 |     await page.waitForLoadState('domcontentloaded')
  488 | 
  489 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  490 | 
  491 |     await page.fill('#profile-name', '')
  492 |     await page.click('button:has-text("Guardar cambios")')
  493 | 
  494 |     await expect(page.locator('text=vacío')).toBeVisible({ timeout: 20000 })
  495 |   })
  496 | 
  497 |   test('Test 25: Preferencias - Cambio de Tema', async ({ page }) => {
  498 |     await loginAsAdmin(page)
  499 |     await page.goto('/workspace/preferencias')
  500 |     await page.waitForLoadState('domcontentloaded')
  501 | 
  502 |     await expect(page.locator('h1:has-text("Preferencias")')).toBeVisible({ timeout: 35000 })
  503 | 
  504 |     // Interactuar con el menú de aspecto (dropdown)
  505 |     await page.click('button:has-text("Sistema"), button:has-text("Claro"), button:has-text("Oscuro")')
  506 | 
  507 |     // Seleccionar "Oscuro" del menú
  508 |     await page.click('div[role="menuitemradio"]:has-text("Oscuro")')
  509 | 
  510 |     // El dropdown debería actualizar su etiqueta a "Oscuro"
  511 |     await expect(page.locator('button:has-text("Oscuro")')).toBeVisible({ timeout: 20000 })
  512 |   })
  513 | 
  514 |   test('Test 26: Configuración - Enlaces de Acceso', async ({ page }) => {
  515 |     await loginAsAdmin(page)
  516 |     await page.goto('/workspace/configuracion')
  517 |     await page.waitForLoadState('domcontentloaded')
  518 | 
  519 |     await expect(page.locator('h1:has-text("Configuración")')).toBeVisible({ timeout: 35000 })
  520 | 
  521 |     // Clic en "Abrir preferencias"
  522 |     await page.click('a:has-text("Abrir preferencias")')
  523 |     await expect(page).toHaveURL(/\/workspace\/preferencias/)
  524 | 
  525 |     // Volver a Configuración
  526 |     await page.goto('/workspace/configuracion')
  527 | 
  528 |     // Clic en "Abrir perfil"
  529 |     await page.click('a:has-text("Abrir perfil")')
  530 |     await expect(page).toHaveURL(/\/workspace\/perfil/)
  531 |   })
  532 | 
  533 |   // ─── INVENTARIO ADMIN ──────────────────────────────────────────
  534 | 
```