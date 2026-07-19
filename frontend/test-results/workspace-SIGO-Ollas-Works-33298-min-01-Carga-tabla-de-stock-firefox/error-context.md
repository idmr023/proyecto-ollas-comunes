# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test Inventario Admin 01: Carga tabla de stock
- Location: e2e\workspace.spec.ts:536:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Existencias en Stock').or(locator('table'))
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('text=Existencias en Stock').or(locator('table'))

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
  - heading "Monitoreo de Inventario" [level=1]
  - paragraph: Consolidado de almacén y registro histórico de movimientos de todas las ollas comunes.
  - button "Stock por Olla"
  - button "Kardex (Movimientos)"
  - button "Actualizar datos"
  - text: Buscar
  - textbox "Buscar":
    - /placeholder: Buscar por insumo, olla común...
  - text: Filtrar por Olla
  - combobox "Filtrar por Olla":
    - option "Todas las ollas" [selected]
  - text: Resumen de Inventarios Insumos disponibles por cada olla común registrada.
  - paragraph: No se encontraron insumos.
  - paragraph: Intente cambiando el término de búsqueda o filtros.
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  442 |     await loginAsAdmin(page)
  443 |     await page.goto('/workspace/perfil')
  444 |     await page.waitForLoadState('domcontentloaded')
  445 | 
  446 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  447 | 
  448 |     await page.fill('#new-password', 'newSecurePass123')
  449 |     await page.fill('#confirm-password', 'newSecurePass123')
  450 |     await page.click('button:has-text("Guardar cambios")')
  451 | 
  452 |     await expect(page.locator('text=contraseña actual')).toBeVisible({ timeout: 20000 })
  453 |   })
  454 | 
  455 |   test('Test 24.4: Cambio de contraseña con nueva contraseña corta (Falla)', async ({ page }) => {
  456 |     await loginAsAdmin(page)
  457 |     await page.goto('/workspace/perfil')
  458 |     await page.waitForLoadState('domcontentloaded')
  459 | 
  460 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  461 | 
  462 |     await page.fill('#current-password', 'admin123')
  463 |     await page.fill('#new-password', '123')
  464 |     await page.fill('#confirm-password', '123')
  465 |     await page.click('button:has-text("Guardar cambios")')
  466 | 
  467 |     await expect(page.locator('text=al menos 6 caracteres')).toBeVisible({ timeout: 20000 })
  468 |   })
  469 | 
  470 |   test('Test 24.5: Cambio de contraseña con confirmación que no coincide (Falla)', async ({ page }) => {
  471 |     await loginAsAdmin(page)
  472 |     await page.goto('/workspace/perfil')
  473 |     await page.waitForLoadState('domcontentloaded')
  474 | 
  475 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  476 | 
  477 |     await page.fill('#current-password', 'admin123')
  478 |     await page.fill('#new-password', 'newSecurePass123')
  479 |     await page.fill('#confirm-password', 'differentPass')
  480 |     await page.click('button:has-text("Guardar cambios")')
  481 | 
  482 |     await expect(page.locator('text=no coinciden')).toBeVisible({ timeout: 20000 })
  483 |   })
  484 | 
  485 |   test('Test 24.6: Guardar perfil con nombre vacío (Falla)', async ({ page }) => {
  486 |     await loginAsAdmin(page)
  487 |     await page.goto('/workspace/perfil')
  488 |     await page.waitForLoadState('domcontentloaded')
  489 | 
  490 |     await expect(page.locator('h1:has-text("Mi perfil")')).toBeVisible({ timeout: 35000 })
  491 | 
  492 |     await page.fill('#profile-name', '')
  493 |     await page.click('button:has-text("Guardar cambios")')
  494 | 
  495 |     await expect(page.locator('text=vacío')).toBeVisible({ timeout: 20000 })
  496 |   })
  497 | 
  498 |   test('Test 25: Preferencias - Cambio de Tema', async ({ page }) => {
  499 |     await loginAsAdmin(page)
  500 |     await page.goto('/workspace/preferencias')
  501 |     await page.waitForLoadState('domcontentloaded')
  502 | 
  503 |     await expect(page.locator('h1:has-text("Preferencias")')).toBeVisible({ timeout: 35000 })
  504 | 
  505 |     // Interactuar con el menú de aspecto (dropdown)
  506 |     await page.click('button:has-text("Sistema"), button:has-text("Claro"), button:has-text("Oscuro")')
  507 | 
  508 |     // Seleccionar "Oscuro" del menú
  509 |     await page.click('div[role="menuitemradio"]:has-text("Oscuro")')
  510 | 
  511 |     // El dropdown debería actualizar su etiqueta a "Oscuro"
  512 |     await expect(page.locator('button:has-text("Oscuro")')).toBeVisible({ timeout: 20000 })
  513 |   })
  514 | 
  515 |   test('Test 26: Configuración - Enlaces de Acceso', async ({ page }) => {
  516 |     await loginAsAdmin(page)
  517 |     await page.goto('/workspace/configuracion')
  518 |     await page.waitForLoadState('domcontentloaded')
  519 | 
  520 |     await expect(page.locator('h1:has-text("Configuración")')).toBeVisible({ timeout: 35000 })
  521 | 
  522 |     // Clic en "Abrir preferencias"
  523 |     await page.click('a:has-text("Abrir preferencias")')
  524 |     await expect(page).toHaveURL(/\/workspace\/preferencias/)
  525 | 
  526 |     // Volver a Configuración
  527 |     await page.goto('/workspace/configuracion')
  528 | 
  529 |     // Clic en "Abrir perfil"
  530 |     await page.click('a:has-text("Abrir perfil")')
  531 |     await expect(page).toHaveURL(/\/workspace\/perfil/)
  532 |   })
  533 | 
  534 |   // ─── INVENTARIO ADMIN ──────────────────────────────────────────
  535 | 
  536 |   test('Test Inventario Admin 01: Carga tabla de stock', async ({ page }) => {
  537 |     await loginAsAdmin(page)
  538 |     await page.goto('/workspace/inventario')
  539 |     await page.waitForLoadState('domcontentloaded')
  540 | 
  541 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
> 542 |     await expect(page.locator('text=Existencias en Stock').or(page.locator('table'))).toBeVisible()
      |                                                                                       ^ Error: expect(locator).toBeVisible() failed
  543 |   })
  544 | 
  545 |   test('Test Inventario Admin 02: Carga historial de movimientos', async ({ page }) => {
  546 |     await loginAsAdmin(page)
  547 |     await page.goto('/workspace/inventario')
  548 |     await page.waitForLoadState('domcontentloaded')
  549 | 
  550 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  551 |     
  552 |     // Clic en pestaña Historial
  553 |     const tabMovs = page.locator('button:has-text("Historial"), button[value="movements"]').first()
  554 |     if (await tabMovs.isVisible()) {
  555 |       await tabMovs.click()
  556 |       await expect(page.locator('text=Historial de movimientos').or(page.locator('table'))).toBeVisible()
  557 |     }
  558 |   })
  559 | 
  560 |   test('Test Inventario Admin 03: Filtro por olla común', async ({ page }) => {
  561 |     await loginAsAdmin(page)
  562 |     await page.goto('/workspace/inventario')
  563 |     await page.waitForLoadState('domcontentloaded')
  564 | 
  565 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  566 |     
  567 |     // Filtrar por olla si el selector de filtro existe
  568 |     const filterSelect = page.locator('#filter-olla, select[name="olla"]').first()
  569 |     if (await filterSelect.isVisible()) {
  570 |       await filterSelect.selectOption({ index: 1 })
  571 |       await page.waitForTimeout(1000)
  572 |     }
  573 |   })
  574 | 
  575 |   // ─── ALERTAS ADMIN ─────────────────────────────────────────────
  576 | 
  577 |   test('Test Alertas Admin 01: Carga listado de alertas abiertas', async ({ page }) => {
  578 |     await loginAsAdmin(page)
  579 |     await page.goto('/workspace/alertas')
  580 |     await page.waitForLoadState('domcontentloaded')
  581 | 
  582 |     await expect(page.locator('h1:has-text("Alertas del sistema")').or(page.locator('h1:has-text("Alertas")'))).toBeVisible({ timeout: 35000 })
  583 |   })
  584 | 
  585 |   test('Test Alertas Admin 02: Marcar alerta como resuelta', async ({ page }) => {
  586 |     await page.route('**/api/organizations/alerts/*', async (route) => {
  587 |       await route.fulfill({
  588 |         status: 200,
  589 |         contentType: 'application/json',
  590 |         body: JSON.stringify({ ok: true, item: { id: 'alert-123', status: 'resolved' } }),
  591 |       })
  592 |     })
  593 | 
  594 |     await loginAsAdmin(page)
  595 |     await page.goto('/workspace/alertas')
  596 |     await page.waitForLoadState('domcontentloaded')
  597 | 
  598 |     await expect(page.locator('h1:has-text("Alertas del sistema")').or(page.locator('h1:has-text("Alertas")'))).toBeVisible({ timeout: 35000 })
  599 | 
  600 |     const resolveBtn = page.locator('button:has-text("Resolver"), button:has-text("Marcar como resuelta")').first()
  601 |     if (await resolveBtn.isVisible()) {
  602 |       await resolveBtn.click()
  603 |       await page.waitForTimeout(1000)
  604 |     }
  605 |   })
  606 | 
  607 |   // ─── REPORTES ADMIN ────────────────────────────────────────────
  608 | 
  609 |   test('Test Reportes Admin 01: Carga panel de reportes con KPIs', async ({ page }) => {
  610 |     await loginAsAdmin(page)
  611 |     await page.goto('/workspace/reportes')
  612 |     await page.waitForLoadState('domcontentloaded')
  613 | 
  614 |     await expect(page.locator('h1:has-text("Reportes")')).toBeVisible({ timeout: 35000 })
  615 |     await expect(page.locator('text=Ingresos de insumos').or(page.locator('text=Salidas de insumos'))).toBeVisible()
  616 |   })
  617 | 
  618 | })
  619 | 
```