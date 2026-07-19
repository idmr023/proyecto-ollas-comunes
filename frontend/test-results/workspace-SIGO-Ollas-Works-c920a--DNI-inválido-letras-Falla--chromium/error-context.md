# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 18.3: Registrar beneficiario con formato de DNI inválido (letras) (Falla)
- Location: e2e\workspace.spec.ts:180:7

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
  90  |   // ─── PADRÓN DE BENEFICIARIOS ──────────────────────────────────
  91  | 
  92  |   test('Test 15: Listado de Beneficiarios', async ({ page }) => {
  93  |     await loginAsAdmin(page)
  94  |     await page.goto('/workspace/beneficiarios')
  95  |     await page.waitForLoadState('domcontentloaded')
  96  | 
  97  |     // Verificar que cargue la vista de padrón
  98  |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  99  |     await expect(page.locator('button:has-text("Registrar Beneficiario")')).toBeVisible()
  100 |   })
  101 | 
  102 |   test('Test 16: Búsqueda de Beneficiarios', async ({ page }) => {
  103 |     await loginAsAdmin(page)
  104 |     await page.goto('/workspace/beneficiarios')
  105 |     await page.waitForLoadState('domcontentloaded')
  106 | 
  107 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  108 | 
  109 |     // Ingresar búsqueda aleatoria sin coincidencia
  110 |     await page.fill('#search', 'PersonaTotalmenteInexistenteXYZ123')
  111 | 
  112 |     // Debería salir el empty state
  113 |     await expect(page.locator('text=No se encontraron beneficiarios.')).toBeVisible({ timeout: 35000 })
  114 |   })
  115 | 
  116 |   test('Test 17: Filtro de Beneficiarios por Olla Común', async ({ page }) => {
  117 |     await loginAsAdmin(page)
  118 |     await page.goto('/workspace/beneficiarios')
  119 |     await page.waitForLoadState('domcontentloaded')
  120 | 
  121 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  122 | 
  123 |     // Seleccionar filtro por olla común (el primer option después de "Todas")
  124 |     await page.selectOption('#filter-olla', { index: 1 })
  125 | 
  126 |     // Validar que la tabla reaccione (no haya fallado la interfaz)
  127 |     await page.waitForTimeout(1000)
  128 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible()
  129 |   })
  130 | 
  131 |   test('Test 18.1: Formulario de Beneficiario - Validación (Falla)', async ({ page }) => {
  132 |     await loginAsAdmin(page)
  133 |     await page.goto('/workspace/beneficiarios')
  134 |     await page.waitForLoadState('domcontentloaded')
  135 | 
  136 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  137 | 
  138 |     // Abrir modal
  139 |     await page.click('button:has-text("Registrar Beneficiario")')
  140 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  141 | 
  142 |     // Intentar guardar sin completar datos obligatorios
  143 |     await page.click('div.z-50 button:has-text("Registrar")')
  144 | 
  145 |     // Validar toast de error (los mensajes se unen en uno solo)
  146 |     await expect(page.locator('text=El nombre es obligatorio.')).toBeVisible()
  147 |   })
  148 | 
  149 |   test('Test 18.2: Registro Exitoso de Beneficiario (Éxito)', async ({ page }) => {
  150 |     await loginAsAdmin(page)
  151 |     const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  152 | 
  153 |     await page.goto('/workspace/beneficiarios')
  154 |     await page.waitForLoadState('domcontentloaded')
  155 | 
  156 |     // Abrir formulario
  157 |     await page.click('button:has-text("Registrar Beneficiario")')
  158 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  159 | 
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
> 190 |     await page.fill('#firstName', 'AdminTest')
      |                ^ Error: page.fill: Test timeout of 60000ms exceeded.
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
```