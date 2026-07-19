# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> SIGO-Ollas Mobile E2E Tests (15 escenarios) >> Test 11.2: Fallo de API de IA (Falla)
- Location: e2e\mobile.spec.ts:482:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Error').or(locator('text=sugerencia'))
Expected: visible
Error: strict mode violation: locator('text=Error').or(locator('text=sugerencia')) resolved to 3 elements:
    1) <p class="text-sm text-muted-foreground">Presiona "Nueva sugerencia" para generar un menú …</p> aka getByText('Presiona "Nueva sugerencia"')
    2) <button data-slot="button" data-size="default" data-variant="outline" class="group/button shrink-0 justify-center rounded-lg border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destr…>…</button> aka getByRole('button', { name: 'Nueva sugerencia' })
    3) <div class="" data-title="">Error al generar sugerencia</div> aka getByText('Error al generar sugerencia')

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for locator('text=Error').or(locator('text=sugerencia'))

```

# Test source

```ts
  399 |     }
  400 | 
  401 |     const nextButton = page.locator('button:has-text("Siguiente Paso")')
  402 |     if (await nextButton.isVisible({ timeout: 15000 }).catch(() => false)) {
  403 |       await nextButton.click()
  404 |     }
  405 | 
  406 |     const writeNumber = page.locator('button:has-text("Escribir número")')
  407 |     if (await writeNumber.isVisible({ timeout: 15000 }).catch(() => false)) {
  408 |       await writeNumber.click()
  409 |       await page.fill('input[type="number"]', '0')
  410 |       await nextButton.click()
  411 |       // Debería permanecer en el mismo paso (cantidad inválida)
  412 |       await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible()
  413 |     }
  414 |   })
  415 | 
  416 |   test('Test 09.4: Registrar movimiento con cantidad negativa (Falla)', async ({ page }) => {
  417 |     await loginAsAdmin(page)
  418 |     await page.goto('/mobile/inventario')
  419 |     await page.waitForLoadState('domcontentloaded')
  420 | 
  421 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  422 |     await page.click('button:has-text("Registrar Entrada")')
  423 |     await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 20000 })
  424 | 
  425 |     const firstItem = page.locator('button[class*="cursor-pointer"]').first()
  426 |     if (await firstItem.isVisible()) {
  427 |       await firstItem.click()
  428 |     }
  429 | 
  430 |     const nextButton = page.locator('button:has-text("Siguiente Paso")')
  431 |     if (await nextButton.isVisible({ timeout: 15000 }).catch(() => false)) {
  432 |       await nextButton.click()
  433 |     }
  434 | 
  435 |     const writeNumber = page.locator('button:has-text("Escribir número")')
  436 |     if (await writeNumber.isVisible({ timeout: 15000 }).catch(() => false)) {
  437 |       await writeNumber.click()
  438 |       await page.fill('input[type="number"]', '-10')
  439 |       await nextButton.click()
  440 |       // Debería permanecer en el mismo paso
  441 |       await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible()
  442 |     }
  443 |   })
  444 | 
  445 |   // ─── MENÚ IA Y ENTREGAS ───────────────────────────────────────
  446 | 
  447 |   test('Test 10: Menú IA muestra panel de sugerencias', async ({ page }) => {
  448 |     await loginAsAdmin(page)
  449 |     await page.goto('/mobile/menu-ia')
  450 |     await page.waitForLoadState('domcontentloaded')
  451 | 
  452 |     await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 35000 })
  453 |   })
  454 | 
  455 |   test('Test 11: Solicitar sugerencia de Menú IA', async ({ page }) => {
  456 |     test.setTimeout(60000)
  457 |     await loginAsAdmin(page)
  458 |     await page.goto('/mobile/menu-ia')
  459 |     await page.waitForLoadState('domcontentloaded')
  460 | 
  461 |     await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 35000 })
  462 | 
  463 |     // Pedir nueva sugerencia
  464 |     await page.click('button:has-text("Nueva sugerencia")')
  465 | 
  466 |     // Esperar que termine de cargar (el botón se habilita de nuevo al terminar)
  467 |     // Puede tardar porque llama a la API de Gemini
  468 |     await expect(page.locator('button:has-text("Nueva sugerencia")')).toBeEnabled({ timeout: 200000 })
  469 | 
  470 |     // Si la sugerencia se generó, debe verse el botón de "Usar este menú"
  471 |     // Si no hay suficientes insumos, se muestra un toast de error
  472 |     // Verificamos que ya no está en estado de carga
  473 |     const useButton = page.locator('button:has-text("Usar este menú")')
  474 |     const noData = page.locator('text=Presiona')
  475 |     const isUsable = await useButton.isVisible().catch(() => false)
  476 |     const isNoData = await noData.isVisible().catch(() => false)
  477 | 
  478 |     // Alguna de las dos debe ser visible (sugerencia generada o sin insumos)
  479 |     expect(isUsable || isNoData).toBeTruthy()
  480 |   })
  481 | 
  482 |   test('Test 11.2: Fallo de API de IA (Falla)', async ({ page }) => {
  483 |     await page.route('**/api/mobile/suggestions', async (route) => {
  484 |       await route.fulfill({
  485 |         status: 500,
  486 |         contentType: 'application/json',
  487 |         body: JSON.stringify({ ok: false, message: 'Error interno en el motor de IA.' }),
  488 |       })
  489 |     })
  490 | 
  491 |     await loginAsAdmin(page)
  492 |     await page.goto('/mobile/menu-ia')
  493 |     await page.waitForLoadState('domcontentloaded')
  494 | 
  495 |     await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 35000 })
  496 | 
  497 |     await page.click('button:has-text("Nueva sugerencia")')
  498 | 
> 499 |     await expect(page.locator('text=Error').or(page.locator('text=sugerencia'))).toBeVisible({ timeout: 30000 })
      |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  500 |   })
  501 | 
  502 |   test('Test 12: Registro de entrega de raciones', async ({ page }) => {
  503 |     await loginAsAdmin(page)
  504 |     await page.goto('/mobile/padron')
  505 |     await page.waitForLoadState('domcontentloaded')
  506 | 
  507 |     // Esperar carga de la lista
  508 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  509 |     await page.waitForTimeout(2000)
  510 | 
  511 |     // Activar modo entrega
  512 |     const deliveryButton = page.locator('button:has-text("Registrar Entrega de Ración")')
  513 |     if (await deliveryButton.isVisible({ timeout: 20000 }).catch(() => false)) {
  514 |       await deliveryButton.click()
  515 | 
  516 |       // Debería cambiar el título a "Entregar Raciones"
  517 |       await expect(page.locator('h1:has-text("Entregar Raciones")')).toBeVisible({ timeout: 20000 })
  518 |     } else {
  519 |       // Si no hay el botón, el test pasa (no hay menú ejecutado para entregar)
  520 |       test.skip()
  521 |     }
  522 |   })
  523 | 
  524 |   // ─── EVIDENCIAS ───────────────────────────────────────────────
  525 | 
  526 |   test('Test Evidencias 01: Subida exitosa de documento con título y archivo válido', async ({ page }) => {
  527 |     await loginAsAdmin(page)
  528 |     await page.goto('/mobile/evidencias')
  529 |     await page.waitForLoadState('domcontentloaded')
  530 | 
  531 |     await expect(page.locator('text=Subir Evidencia')).toBeVisible({ timeout: 35000 })
  532 | 
  533 |     await page.fill('#evidence-title', 'Foto de Acta de Entrega')
  534 |     await page.fill('#evidence-desc', 'Descripción de prueba E2E')
  535 |     
  536 |     // Subir archivo ficticio usando buffer de Playwright
  537 |     await page.setInputFiles('input[type="file"]', {
  538 |       name: 'evidencia-e2e.png',
  539 |       mimeType: 'image/png',
  540 |       buffer: Buffer.from('image-data-ficticia-base64-content'),
  541 |     })
  542 | 
  543 |     // Mockear la respuesta del upload en Supabase para evitar llamadas reales a storage en E2E si falla
  544 |     await page.route('**/api/mobile/documents/upload', async (route) => {
  545 |       await route.fulfill({
  546 |         status: 201,
  547 |         contentType: 'application/json',
  548 |         body: JSON.stringify({ ok: true, document: { id: 'some-doc-id' } }),
  549 |       })
  550 |     })
  551 | 
  552 |     await page.click('button:has-text("Subir acta")')
  553 | 
  554 |     // Debería volver a inicio con toast de éxito
  555 |     await expect(page).toHaveURL(/\/mobile\/inicio/)
  556 |   })
  557 | 
  558 |   test('Test Evidencias 02: Subida sin título (Falla)', async ({ page }) => {
  559 |     await loginAsAdmin(page)
  560 |     await page.goto('/mobile/evidencias')
  561 |     await page.waitForLoadState('domcontentloaded')
  562 | 
  563 |     await page.fill('#evidence-title', '')
  564 |     await page.setInputFiles('input[type="file"]', {
  565 |       name: 'evidencia-e2e.png',
  566 |       mimeType: 'image/png',
  567 |       buffer: Buffer.from('image-content'),
  568 |     })
  569 | 
  570 |     await page.click('button:has-text("Subir acta")')
  571 |     await expect(page.locator('text=título')).toBeVisible()
  572 |   })
  573 | 
  574 |   test('Test Evidencias 03: Subida sin archivo (Falla)', async ({ page }) => {
  575 |     await loginAsAdmin(page)
  576 |     await page.goto('/mobile/evidencias')
  577 |     await page.waitForLoadState('domcontentloaded')
  578 | 
  579 |     await page.fill('#evidence-title', 'Título de prueba')
  580 |     await page.click('button:has-text("Subir acta")')
  581 |     await expect(page.locator('text=foto').or(page.locator('text=archivo'))).toBeVisible()
  582 |   })
  583 | 
  584 |   // ─── ALERTAS ──────────────────────────────────────────────────
  585 | 
  586 |   test('Test Alertas Mobile 01: Vista de alertas carga correctamente', async ({ page }) => {
  587 |     await loginAsAdmin(page)
  588 |     await page.goto('/mobile/alertas')
  589 |     await page.waitForLoadState('domcontentloaded')
  590 | 
  591 |     await expect(page.locator('h1:has-text("Alertas")')).toBeVisible({ timeout: 35000 })
  592 |   })
  593 | 
  594 |   test('Test Alertas Mobile 02: Descartar alerta de conflicto local', async ({ page }) => {
  595 |     await loginAsAdmin(page)
  596 |     await page.goto('/mobile/alertas')
  597 |     await page.waitForLoadState('domcontentloaded')
  598 | 
  599 |     await expect(page.locator('h1:has-text("Alertas")')).toBeVisible({ timeout: 35000 })
```