# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> SIGO-Ollas Offline-First PWA E2E Tests >> Test Offline: Control de conflictos de sincronización (DNI duplicado)
- Location: e2e\offline.spec.ts:284:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=duplicados').first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('text=duplicados').first()

```

```yaml
- region "Notifications alt+T"
- dialog "Conflictos de Sincronización":
  - heading "Conflictos de Sincronización" [level=2]
  - paragraph: Estos cambios no pudieron guardarse en el servidor debido a reglas de negocio (ej. DNI repetido).
  - button "Descartar todo"
  - text: Registrar Beneficiario
  - paragraph: "DuplicadoTest Playwright (DNI: 67338950)"
  - paragraph: Ya existe un beneficiario con ese DNI en esta organizacion.
  - button
  - button "Close"
```

# Test source

```ts
  232 |     await page.click('button:has-text("Registrar Entrada")')
  233 |     await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 20000 })
  234 | 
  235 |     await page.fill('input[placeholder="Buscar por nombre..."]', firstItem.name)
  236 |     await page.click(`text=${firstItem.name}`)
  237 | 
  238 |     await page.click('button:has-text("Escribir número")')
  239 |     await page.fill('input[type="number"]', '15')
  240 |     await page.click('button:has-text("Siguiente Paso")')
  241 | 
  242 |     await page.click('button:has-text("Guardar Registro")')
  243 | 
  244 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  245 |     await expect(page.locator('text=(1 local)')).toBeVisible({ timeout: 20000 })
  246 | 
  247 |     await restoreNetworkAndFireOnlineEvent(page, context)
  248 | 
  249 |     const dbMovement = await pollDb(() =>
  250 |       prisma.inventoryMovement.findFirst({
  251 |         where: {
  252 |           supplyItemId: firstItem.id,
  253 |           quantity: 15,
  254 |           movementType: 'in'
  255 |         }
  256 |       }),
  257 |     )
  258 | 
  259 |     try {
  260 |       await prisma.inventoryMovement.delete({
  261 |         where: { id: dbMovement.id }
  262 |       })
  263 | 
  264 |       if (dbMovement.ollaId && dbMovement.ollaId !== '' && dbMovement.ollaId !== '""') {
  265 |         const olla = await prisma.ollaComun.findFirst({
  266 |           where: { id: dbMovement.ollaId }
  267 |         })
  268 |         if (olla && olla.id && olla.id !== '') {
  269 |           const stock = await prisma.inventoryStock.findUnique({
  270 |             where: { ollaId_supplyItemId: { ollaId: olla.id, supplyItemId: firstItem.id } }
  271 |           })
  272 |           if (stock) {
  273 |             await prisma.inventoryStock.update({
  274 |               where: { ollaId_supplyItemId: { ollaId: olla.id, supplyItemId: firstItem.id } },
  275 |               data: { quantity: Math.max(0, Number(stock.quantity) - 15) }
  276 |             })
  277 |           }
  278 |         }
  279 |       }
  280 |     } catch {
  281 |     }
  282 |   })
  283 | 
  284 |   test('Test Offline: Control de conflictos de sincronización (DNI duplicado)', async ({ page, context }) => {
  285 |     const duplicateDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  286 |     const firstOlla = await prisma.ollaComun.findFirst()
  287 |     const tenant = await prisma.tenant.findFirst()
  288 |     if (!firstOlla || !tenant) throw new Error('No hay organizacion disponible')
  289 | 
  290 |     const preBeneficiary = await prisma.beneficiary.create({
  291 |       data: {
  292 |         firstName: 'Original',
  293 |         lastName: 'Playwright',
  294 |         dni: duplicateDni,
  295 |         birthDate: new Date('1990-01-01'),
  296 |         ollaId: firstOlla.id,
  297 |         tenantId: tenant.id
  298 |       }
  299 |     })
  300 | 
  301 |     await loginAsAdmin(page)
  302 | 
  303 |     await page.goto('/workspace/beneficiarios')
  304 |     await page.waitForLoadState('domcontentloaded')
  305 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  306 |     await page.waitForFunction(() => document.querySelectorAll('#filter-olla option').length >= 2, { timeout: 30000 })
  307 | 
  308 |     await context.setOffline(true)
  309 |     await page.waitForTimeout(1000)
  310 | 
  311 |     await page.click('button:has-text("Registrar Beneficiario")')
  312 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  313 | 
  314 |     await page.fill('#beneficiary-firstName', 'DuplicadoTest')
  315 |     await page.fill('#beneficiary-lastName', 'Playwright')
  316 |     await page.fill('#beneficiary-dni', duplicateDni)
  317 |     await page.fill('#beneficiary-birthDate', '1992-06-12')
  318 | 
  319 |     await page.selectOption('div.z-50 select', { index: 0 })
  320 | 
  321 |     await page.click('div.z-50 button:has-text("Registrar")')
  322 | 
  323 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
  324 |     await expect(page.locator('text=(1 local)')).toBeVisible({ timeout: 35000 })
  325 | 
  326 |     await restoreNetworkAndFireOnlineEvent(page, context)
  327 | 
  328 |     await expect(page.locator('text=Conflictos de sincronización')).toBeVisible({ timeout: 45000 })
  329 | 
  330 |     await page.click('button:has-text("Revisar")')
  331 | 
> 332 |     await expect(page.locator('text=duplicados').first()).toBeVisible({ timeout: 20000 })
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  333 | 
  334 |     await page.click('button:has-text("Descartar todo")')
  335 |     await expect(page.locator('[data-slot="sheet-title"]:has-text("Conflictos de Sincronización")')).not.toBeVisible({ timeout: 35000 })
  336 | 
  337 |     await prisma.beneficiary.delete({
  338 |       where: { id: preBeneficiary.id }
  339 |     }).catch(() => {})
  340 |   })
  341 | })
  342 | 
```