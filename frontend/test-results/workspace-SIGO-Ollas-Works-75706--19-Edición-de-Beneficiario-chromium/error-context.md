# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 19: Edición de Beneficiario
- Location: e2e\workspace.spec.ts:243:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('#firstName')

```

# Test source

```ts
  160 |     // Rellenar campos obligatorios
  161 |     await page.fill('#firstName', 'AdminTest')
  162 |     await page.fill('#lastName', 'Playwright')
  163 |     await page.fill('#dni', randomDni)
  164 |     await page.fill('#birthDate', '1990-05-15')
  165 | 
  166 |     // Seleccionar olla común (primer option después del placeholder)
  167 |     await page.selectOption('#ollaId', { index: 1 })
  168 | 
  169 |     // Guardar
  170 |     await page.click('div.z-50 button:has-text("Registrar")')
  171 | 
  172 |     // Esperar cierre de modal
  173 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
  174 | 
  175 |     // Validar que aparezca en el listado haciendo una búsqueda
  176 |     await page.fill('#search', randomDni)
  177 |     await expect(page.locator(`td:has-text("${randomDni}")`).first()).toBeVisible({ timeout: 35000 })
  178 |   })
  179 | 
  180 |   test('Test 18.3: Registrar beneficiario con formato de DNI inválido (letras) (Falla)', async ({ page }) => {
  181 |     await loginAsAdmin(page)
  182 |     await page.goto('/workspace/beneficiarios')
  183 |     await page.waitForLoadState('domcontentloaded')
  184 | 
  185 |     // Abrir formulario
  186 |     await page.click('button:has-text("Registrar Beneficiario")')
  187 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  188 | 
  189 |     // Rellenar campos, ingresando letras en DNI
  190 |     await page.fill('#firstName', 'AdminTest')
  191 |     await page.fill('#lastName', 'Playwright')
  192 |     await page.fill('#dni', 'dni-letras-invalido')
  193 |     await page.fill('#birthDate', '1990-05-15')
  194 | 
  195 |     // Seleccionar olla común
  196 |     await page.selectOption('#ollaId', { index: 1 })
  197 | 
  198 |     // Intentar guardar
  199 |     await page.click('div.z-50 button:has-text("Registrar")')
  200 | 
  201 |     // Debería permanecer visible indicando que falló o mostrar error
  202 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible()
  203 |   })
  204 | 
  205 |   test('Test 18.4: Registrar beneficiario con DNI corto (Falla)', async ({ page }) => {
  206 |     await loginAsAdmin(page)
  207 |     await page.goto('/workspace/beneficiarios')
  208 |     await page.waitForLoadState('domcontentloaded')
  209 | 
  210 |     await page.click('button:has-text("Registrar Beneficiario")')
  211 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  212 | 
  213 |     await page.fill('#firstName', 'AdminTest')
  214 |     await page.fill('#lastName', 'Playwright')
  215 |     await page.fill('#dni', '1234')
  216 |     await page.fill('#birthDate', '1990-05-15')
  217 | 
  218 |     await page.selectOption('#ollaId', { index: 1 })
  219 |     await page.click('div.z-50 button:has-text("Registrar")')
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
> 260 |     await page.fill('#firstName', 'AdminTestModificado')
      |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
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
```