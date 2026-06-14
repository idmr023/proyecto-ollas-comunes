# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> SIGO-Ollas Mobile E2E Tests (15 escenarios) >> Test 14: Solicitar sugerencia de Menú IA
- Location: e2e\mobile.spec.ts:279:7

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  locator('button:has-text("Nueva sugerencia")')
Expected: enabled
Received: disabled
Timeout:  25000ms

Call log:
  - Expect "toBeEnabled" with timeout 25000ms
  - waiting for locator('button:has-text("Nueva sugerencia")')
    53 × locator resolved to <button disabled data-slot="button" data-size="default" data-variant="outline" class="group/button shrink-0 justify-center rounded-lg border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:bor…>…</button>
       - unexpected value "disabled"

```

```yaml
- button "Nueva sugerencia" [disabled]
```

# Test source

```ts
  191 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 10000 })
  192 | 
  193 |     // Abrir formulario
  194 |     await page.click('button[aria-label="Agregar beneficiario"]')
  195 |     await expect(page.locator('text=Nuevo beneficiario')).toBeVisible({ timeout: 5000 })
  196 | 
  197 |     // Llenar campos
  198 |     await page.fill('#firstName', 'TestE2E')
  199 |     await page.fill('#lastName', 'Playwright')
  200 |     await page.fill('#dni', randomDni)
  201 |     await page.fill('#birthDate', '1995-02-20')
  202 | 
  203 |     // Guardar
  204 |     await page.click('button:has-text("Guardar beneficiario")')
  205 | 
  206 |     // Esperar a que el formulario cierre y la lista se actualice
  207 |     await expect(page.locator('text=Nuevo beneficiario')).not.toBeVisible({ timeout: 10000 })
  208 | 
  209 |     // Buscar por DNI
  210 |     await page.fill('input[placeholder="Buscar por nombre o DNI…"]', randomDni)
  211 | 
  212 |     // Debe encontrar el beneficiario recién creado
  213 |     await expect(page.locator(`text=${randomDni}`)).toBeVisible({ timeout: 10000 })
  214 |   })
  215 | 
  216 |   // ─── INVENTARIO ───────────────────────────────────────────────
  217 | 
  218 |   test('Test 11: Inventario muestra lista de stock actual', async ({ page }) => {
  219 |     await loginAsAdmin(page)
  220 |     await page.goto('/mobile/inventario')
  221 |     await page.waitForLoadState('domcontentloaded')
  222 | 
  223 |     // El título "Inventario" debe aparecer
  224 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 10000 })
  225 |   })
  226 | 
  227 |   test('Test 12: Registro de movimiento de ingreso en Inventario', async ({ page }) => {
  228 |     await loginAsAdmin(page)
  229 |     await page.goto('/mobile/inventario')
  230 |     await page.waitForLoadState('domcontentloaded')
  231 | 
  232 |     // Esperar carga
  233 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 10000 })
  234 | 
  235 |     // Click en "Registrar Entrada"
  236 |     await page.click('button:has-text("Registrar Entrada")')
  237 | 
  238 |     // Esperar que aparezca el stepper (cambia título a "Registrar Entrada")
  239 |     await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 5000 })
  240 | 
  241 |     // Seleccionar un insumo (el primero visible que contenga texto de un insumo)
  242 |     const firstItem = page.locator('button[class*="cursor-pointer"]').first()
  243 |     if (await firstItem.isVisible()) {
  244 |       await firstItem.click()
  245 |     }
  246 | 
  247 |     // Click en "Siguiente Paso ➡️"
  248 |     const nextButton = page.locator('button:has-text("Siguiente Paso")')
  249 |     if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
  250 |       await nextButton.click()
  251 |     }
  252 | 
  253 |     // Seleccionar "No tiene / No vence"
  254 |     const noExpiry = page.locator('button:has-text("No tiene")')
  255 |     if (await noExpiry.isVisible({ timeout: 3000 }).catch(() => false)) {
  256 |       await noExpiry.click()
  257 |     }
  258 | 
  259 |     // Click en "Guardar Registro"
  260 |     const saveButton = page.locator('button:has-text("Guardar Registro")')
  261 |     if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
  262 |       await saveButton.click()
  263 |     }
  264 | 
  265 |     // Debería volver al panel de inventario
  266 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 10000 })
  267 |   })
  268 | 
  269 |   // ─── MENÚ IA Y ENTREGAS ───────────────────────────────────────
  270 | 
  271 |   test('Test 13: Menú IA muestra panel de sugerencias', async ({ page }) => {
  272 |     await loginAsAdmin(page)
  273 |     await page.goto('/mobile/menu-ia')
  274 |     await page.waitForLoadState('domcontentloaded')
  275 | 
  276 |     await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 10000 })
  277 |   })
  278 | 
  279 |   test('Test 14: Solicitar sugerencia de Menú IA', async ({ page }) => {
  280 |     await loginAsAdmin(page)
  281 |     await page.goto('/mobile/menu-ia')
  282 |     await page.waitForLoadState('domcontentloaded')
  283 | 
  284 |     await expect(page.locator('h1:has-text("Menú IA")')).toBeVisible({ timeout: 10000 })
  285 | 
  286 |     // Pedir nueva sugerencia
  287 |     await page.click('button:has-text("Nueva sugerencia")')
  288 | 
  289 |     // Esperar que termine de cargar (el botón se habilita de nuevo al terminar)
  290 |     // Puede tardar porque llama a la API de Gemini
> 291 |     await expect(page.locator('button:has-text("Nueva sugerencia")')).toBeEnabled({ timeout: 25000 })
      |                                                                       ^ Error: expect(locator).toBeEnabled() failed
  292 | 
  293 |     // Si la sugerencia se generó, debe verse el botón de "Usar este menú"
  294 |     // Si no hay suficientes insumos, se muestra un toast de error
  295 |     // Verificamos que ya no está en estado de carga
  296 |     const useButton = page.locator('button:has-text("Usar este menú")')
  297 |     const noData = page.locator('text=Presiona')
  298 |     const isUsable = await useButton.isVisible().catch(() => false)
  299 |     const isNoData = await noData.isVisible().catch(() => false)
  300 | 
  301 |     // Alguna de las dos debe ser visible (sugerencia generada o sin insumos)
  302 |     expect(isUsable || isNoData).toBeTruthy()
  303 |   })
  304 | 
  305 |   test('Test 15: Registro de entrega de raciones', async ({ page }) => {
  306 |     await loginAsAdmin(page)
  307 |     await page.goto('/mobile/padron')
  308 |     await page.waitForLoadState('domcontentloaded')
  309 | 
  310 |     // Esperar carga de la lista
  311 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 10000 })
  312 |     await page.waitForTimeout(2000)
  313 | 
  314 |     // Activar modo entrega
  315 |     const deliveryButton = page.locator('button:has-text("Registrar Entrega de Ración")')
  316 |     if (await deliveryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
  317 |       await deliveryButton.click()
  318 | 
  319 |       // Debería cambiar el título a "Entregar Raciones"
  320 |       await expect(page.locator('h1:has-text("Entregar Raciones")')).toBeVisible({ timeout: 5000 })
  321 |     } else {
  322 |       // Si no hay el botón, el test pasa (no hay menú ejecutado para entregar)
  323 |       test.skip()
  324 |     }
  325 |   })
  326 | })
  327 | 
```