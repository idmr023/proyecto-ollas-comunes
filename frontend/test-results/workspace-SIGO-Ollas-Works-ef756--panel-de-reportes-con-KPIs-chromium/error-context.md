# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test Reportes Admin 01: Carga panel de reportes con KPIs
- Location: e2e\workspace.spec.ts:608:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Ingresos de insumos').or(locator('text=Salidas de insumos'))
Expected: visible
Error: strict mode violation: locator('text=Ingresos de insumos').or(locator('text=Salidas de insumos')) resolved to 2 elements:
    1) <span class="text-sm text-muted-foreground">Ingresos de insumos</span> aka getByText('Ingresos de insumos')
    2) <span class="text-sm text-muted-foreground">Salidas de insumos</span> aka getByText('Salidas de insumos')

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('text=Ingresos de insumos').or(locator('text=Salidas de insumos'))

```

# Test source

```ts
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
  535 |   test('Test Inventario Admin 01: Carga tabla de stock', async ({ page }) => {
  536 |     await loginAsAdmin(page)
  537 |     await page.goto('/workspace/inventario')
  538 |     await page.waitForLoadState('domcontentloaded')
  539 | 
  540 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  541 |     await expect(page.locator('text=Existencias en Stock').or(page.locator('table'))).toBeVisible()
  542 |   })
  543 | 
  544 |   test('Test Inventario Admin 02: Carga historial de movimientos', async ({ page }) => {
  545 |     await loginAsAdmin(page)
  546 |     await page.goto('/workspace/inventario')
  547 |     await page.waitForLoadState('domcontentloaded')
  548 | 
  549 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  550 | 
  551 |     // Clic en pestaña Historial
  552 |     const tabMovs = page.locator('button:has-text("Historial"), button[value="movements"]').first()
  553 |     if (await tabMovs.isVisible()) {
  554 |       await tabMovs.click()
  555 |       await expect(page.locator('text=Historial de movimientos').or(page.locator('table'))).toBeVisible()
  556 |     }
  557 |   })
  558 | 
  559 |   test('Test Inventario Admin 03: Filtro por olla común', async ({ page }) => {
  560 |     await loginAsAdmin(page)
  561 |     await page.goto('/workspace/inventario')
  562 |     await page.waitForLoadState('domcontentloaded')
  563 | 
  564 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  565 | 
  566 |     // Filtrar por olla si el selector de filtro existe
  567 |     const filterSelect = page.locator('#filter-olla, select[name="olla"]').first()
  568 |     if (await filterSelect.isVisible()) {
  569 |       await filterSelect.selectOption({ index: 1 })
  570 |       await page.waitForTimeout(1000)
  571 |     }
  572 |   })
  573 | 
  574 |   // ─── ALERTAS ADMIN ─────────────────────────────────────────────
  575 | 
  576 |   test('Test Alertas Admin 01: Carga listado de alertas abiertas', async ({ page }) => {
  577 |     await loginAsAdmin(page)
  578 |     await page.goto('/workspace/alertas')
  579 |     await page.waitForLoadState('domcontentloaded')
  580 | 
  581 |     await expect(page.locator('h1:has-text("Alertas del sistema")').or(page.locator('h1:has-text("Alertas")'))).toBeVisible({ timeout: 35000 })
  582 |   })
  583 | 
  584 |   test('Test Alertas Admin 02: Marcar alerta como resuelta', async ({ page }) => {
  585 |     await page.route('**/api/organizations/alerts/*', async (route) => {
  586 |       await route.fulfill({
  587 |         status: 200,
  588 |         contentType: 'application/json',
  589 |         body: JSON.stringify({ ok: true, item: { id: 'alert-123', status: 'resolved' } }),
  590 |       })
  591 |     })
  592 | 
  593 |     await loginAsAdmin(page)
  594 |     await page.goto('/workspace/alertas')
  595 |     await page.waitForLoadState('domcontentloaded')
  596 | 
  597 |     await expect(page.locator('h1:has-text("Alertas del sistema")').or(page.locator('h1:has-text("Alertas")'))).toBeVisible({ timeout: 35000 })
  598 | 
  599 |     const resolveBtn = page.locator('button:has-text("Resolver"), button:has-text("Marcar como resuelta")').first()
  600 |     if (await resolveBtn.isVisible()) {
  601 |       await resolveBtn.click()
  602 |       await page.waitForTimeout(1000)
  603 |     }
  604 |   })
  605 | 
  606 |   // ─── REPORTES ADMIN ────────────────────────────────────────────
  607 | 
  608 |   test('Test Reportes Admin 01: Carga panel de reportes con KPIs', async ({ page }) => {
  609 |     await loginAsAdmin(page)
  610 |     await page.goto('/workspace/reportes')
  611 |     await page.waitForLoadState('domcontentloaded')
  612 | 
  613 |     await expect(page.locator('h1:has-text("Reportes")')).toBeVisible({ timeout: 35000 })
> 614 |     await expect(page.locator('text=Ingresos de insumos').or(page.locator('text=Salidas de insumos'))).toBeVisible()
      |                                                                                                        ^ Error: expect(locator).toBeVisible() failed
  615 |   })
  616 | 
  617 | })
  618 | 
```