# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> SIGO-Ollas Offline-First PWA E2E Tests >> Test Offline: Registro de movimiento de inventario offline con sincronización
- Location: e2e\offline.spec.ts:202:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=(1 guardado(s) local)')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('text=(1 guardado(s) local)')

```

```yaml
- text: Sin conexión — Modo offline (1 local)
- button "Minimizar"
- main:
  - heading "Inventario" [level=1]
  - paragraph: Gestiona tus insumos
  - heading "👇 Stock actual en almacén:" [level=2]
  - list:
    - listitem:
      - text: 🧅
      - paragraph: Cebolla roja
      - text: ⚠️ Perecible 1.06 kg
    - listitem:
      - text: 🍚
      - paragraph: Arroz
      - text: 📦 Almacenable 53.73 kg
    - listitem:
      - text: 📦
      - paragraph: Maiz cancha
      - text: 📦 Almacenable 15 kg
    - listitem:
      - text: 📦
      - paragraph: Manteca vegetal
      - text: 📦 Almacenable 34 kg
    - listitem:
      - text: 🥔
      - paragraph: Papa blanca
      - text: ⚠️ Perecible 30.8 kg
    - listitem:
      - text: 📦
      - paragraph: Zanahoria
      - text: ⚠️ Perecible 3.79 kg
    - listitem:
      - text: 🍗
      - paragraph: Pollo
      - text: ⚠️ Perecible 9.8 kg
    - listitem:
      - text: 💧
      - paragraph: Agua
      - text: 📦 Almacenable 49.25 lt
    - listitem:
      - text: 📦
      - paragraph: Tomate
      - text: ⚠️ Perecible 9.92 kg
    - listitem:
      - text: 📦
      - paragraph: Huevo
      - text: ⚠️ Perecible 112.28 un
    - listitem:
      - text: 🍲
      - paragraph: Lenteja
      - text: 📦 Almacenable 15.8 kg
    - listitem:
      - text: 🛢️
      - paragraph: Aceite vegetal
      - text: 📦 Almacenable 3.99 lt
    - listitem:
      - text: 📦
      - paragraph: Arveja
      - text: ⚠️ Perecible 5.99 kg
    - listitem:
      - text: 🐟
      - paragraph: Conserva de atun
      - text: 📦 Almacenable 28 un
    - listitem:
      - text: 📦
      - paragraph: Arveja enlatada
      - text: 📦 Almacenable 140 un
    - listitem:
      - text: 🍝
      - paragraph: Fideos
      - text: 📦 Almacenable 24 kg
    - listitem:
      - text: 🔥
      - paragraph: Gas GLP
      - text: 📦 Almacenable 1 un
    - listitem:
      - text: 🍯
      - paragraph: Azucar
      - text: 📦 Almacenable 6 kg
    - listitem:
      - text: 🧂
      - paragraph: Sal
      - text: 📦 Almacenable 5 kg
    - listitem:
      - text: 📦
      - paragraph: Apio
      - text: ⚠️ Perecible 3 kg
    - listitem:
      - text: 📦
      - paragraph: Ajo
      - text: ⚠️ Perecible 2 kg
    - listitem:
      - text: 📦
      - paragraph: Zapallo
      - text: ⚠️ Perecible 11 kg
    - listitem:
      - text: 🫘
      - paragraph: Frejol
      - text: 📦 Almacenable 16 kg
    - listitem:
      - text: 🥛
      - paragraph: Leche evaporada
      - text: 📦 Almacenable 5 un
  - button "Registrar Entrada"
  - button "Registrar Salida"
- navigation:
  - link "Inicio":
    - /url: /mobile/inicio/
  - link "Inventario":
    - /url: /mobile/inventario/
  - link "Padrón":
    - /url: /mobile/padron/
  - link "Alertas":
    - /url: /mobile/alertas/
  - button "Salir"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  138 |     })
  139 |     if (!menuPlan) {
  140 |       menuPlan = await prisma.menuPlan.create({
  141 |         data: {
  142 |           ollaId: firstOlla.id,
  143 |           operationDate,
  144 |           dishName: 'Tallarines con salsa',
  145 |           plannedServings: 50,
  146 |           status: 'approved',
  147 |           suggestedByType: 'user',
  148 |           createdBy: (await prisma.appUser.findFirst())?.id
  149 |         }
  150 |       })
  151 |     }
  152 | 
  153 |     // 2. Iniciar sesión online
  154 |     await loginAsAdmin(page)
  155 | 
  156 |     // 3. Ir a la vista móvil del padrón para cargar la caché local
  157 |     await page.goto('/mobile/padron')
  158 |     await page.waitForLoadState('domcontentloaded')
  159 |     await expect(page.locator('h1:has-text("Padrón")')).toBeVisible({ timeout: 35000 })
  160 |     await page.waitForTimeout(2000) // permitir que IndexedDB guarde la caché de beneficiarios
  161 | 
  162 |     // 4. Simular desconexión
  163 |     await context.setOffline(true)
  164 |     await page.waitForTimeout(1000)
  165 | 
  166 |     // 5. Activar modo entrega e ingresar la entrega offline
  167 |     await page.click('button:has-text("Registrar Entrega de Ración")')
  168 |     await expect(page.locator('h1:has-text("Entregar Raciones")')).toBeVisible({ timeout: 20000 })
  169 | 
  170 |     // Seleccionar nuestro beneficiario de prueba
  171 |     await page.fill('input[placeholder="Buscar por nombre o DNI…"]', testDni)
  172 |     await page.waitForTimeout(500)
  173 |     await page.click(`text=${testDni}`) // hacer clic en la tarjeta
  174 | 
  175 |     // Confirmar entrega (esto encola la mutación offline e inyecta hasEatenToday = true)
  176 |     await page.click('button:has-text("Confirmar")')
  177 | 
  178 |     // Verificamos toast de éxito offline y redirección a inicio
  179 |     await expect(page).toHaveURL(/\/mobile\/inicio/, { timeout: 35000 })
  180 | 
  181 |     // 6. Simular reconexión
  182 |     await context.setOffline(false)
  183 |     await page.waitForTimeout(4000) // esperar sincronización y recarga automática
  184 | 
  185 |     // 7. Verificar en la base de datos Postgres real que se haya creado la entrega (MealDeliveryDetail)
  186 |     const deliveryDetail = await prisma.mealDeliveryDetail.findFirst({
  187 |       where: { beneficiaryId: b.id }
  188 |     })
  189 |     expect(deliveryDetail).not.toBeNull()
  190 | 
  191 |     // Limpieza
  192 |     if (deliveryDetail) {
  193 |       await prisma.mealDelivery.delete({
  194 |         where: { id: deliveryDetail.deliveryId }
  195 |       })
  196 |     }
  197 |     await prisma.beneficiary.delete({
  198 |       where: { id: b.id }
  199 |     })
  200 |   })
  201 | 
  202 |   test('Test Offline: Registro de movimiento de inventario offline con sincronización', async ({ page, context }) => {
  203 |     // 1. Obtener un insumo válido de la base de datos
  204 |     const firstItem = await prisma.supplyItem.findFirst()
  205 |     if (!firstItem) throw new Error('No hay insumos registrados en la base de datos')
  206 | 
  207 |     // 2. Iniciar sesión online
  208 |     await loginAsAdmin(page)
  209 | 
  210 |     // 3. Cargar la vista de inventario móvil para cachear
  211 |     await page.goto('/mobile/inventario')
  212 |     await page.waitForLoadState('domcontentloaded')
  213 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
  214 |     await page.waitForTimeout(2000) // esperar caché
  215 | 
  216 |     // 4. Simular desconexión
  217 |     await context.setOffline(true)
  218 |     await page.waitForTimeout(1000)
  219 | 
  220 |     // 5. Realizar el movimiento de Entrada
  221 |     await page.click('button:has-text("Registrar Entrada")')
  222 |     await expect(page.locator('h1:has-text("Registrar Entrada")')).toBeVisible({ timeout: 20000 })
  223 | 
  224 |     // Buscar y seleccionar el insumo
  225 |     await page.fill('input[placeholder="Buscar por nombre..."]', firstItem.name)
  226 |     await page.click(`text=${firstItem.name}`)
  227 | 
  228 |     // Llenar cantidad
  229 |     await page.click('button:has-text("Escribir número")')
  230 |     await page.fill('input[type="number"]', '15')
  231 |     await page.click('button:has-text("Siguiente Paso")')
  232 | 
  233 |     // Guardar
  234 |     await page.click('button:has-text("Guardar Registro")')
  235 | 
  236 |     // Debe volver al panel de inventario y mostrar toast/banner offline con 1 cambio guardado
  237 |     await expect(page.locator('h1:has-text("Inventario")')).toBeVisible({ timeout: 35000 })
> 238 |     await expect(page.locator('text=(1 guardado(s) local)')).toBeVisible({ timeout: 20000 })
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  239 | 
  240 |     // 6. Simular reconexión
  241 |     await context.setOffline(false)
  242 |     await page.waitForTimeout(4000)
  243 | 
  244 |     // 7. Verificar en la base de datos Postgres real que el movimiento de inventario fue creado
  245 |     const dbMovement = await prisma.inventoryMovement.findFirst({
  246 |       where: {
  247 |         supplyItemId: firstItem.id,
  248 |         quantity: 15,
  249 |         movementType: 'in'
  250 |       }
  251 |     })
  252 |     expect(dbMovement).not.toBeNull()
  253 | 
  254 |     // Limpieza
  255 |     if (dbMovement) {
  256 |       await prisma.inventoryMovement.delete({
  257 |         where: { id: dbMovement.id }
  258 |       })
  259 |       // Descontar del stock para no perturbar otros tests
  260 |       const olla = await prisma.ollaComun.findFirst({
  261 |         where: { id: dbMovement.ollaId }
  262 |       })
  263 |       if (olla) {
  264 |         const stock = await prisma.inventoryStock.findUnique({
  265 |           where: { ollaId_supplyItemId: { ollaId: olla.id, supplyItemId: firstItem.id } }
  266 |         })
  267 |         if (stock) {
  268 |           await prisma.inventoryStock.update({
  269 |             where: { ollaId_supplyItemId: { ollaId: olla.id, supplyItemId: firstItem.id } },
  270 |             data: { quantity: Math.max(0, Number(stock.quantity) - 15) }
  271 |           })
  272 |         }
  273 |       }
  274 |     }
  275 |   })
  276 | 
  277 |   test('Test Offline: Control de conflictos de sincronización (DNI duplicado)', async ({ page, context }) => {
  278 |     // 1. Crear un beneficiario previo en la base de datos
  279 |     const duplicateDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  280 |     const firstOlla = await prisma.ollaComun.findFirst()
  281 |     const tenant = await prisma.tenant.findFirst()
  282 |     if (!firstOlla || !tenant) throw new Error('No hay organizacion disponible')
  283 | 
  284 |     const preBeneficiary = await prisma.beneficiary.create({
  285 |       data: {
  286 |         firstName: 'Original',
  287 |         lastName: 'Playwright',
  288 |         dni: duplicateDni,
  289 |         birthDate: new Date('1990-01-01'),
  290 |         ollaId: firstOlla.id,
  291 |         tenantId: tenant.id
  292 |       }
  293 |     })
  294 | 
  295 |     // 2. Iniciar sesión online
  296 |     await loginAsAdmin(page)
  297 | 
  298 |     // 3. Ir a beneficiarios para cargar caché
  299 |     await page.goto('/workspace/beneficiarios')
  300 |     await page.waitForLoadState('domcontentloaded')
  301 |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  302 | 
  303 |     // 4. Simular desconexión
  304 |     await context.setOffline(true)
  305 |     await page.waitForTimeout(1000)
  306 | 
  307 |     // 5. Registrar un beneficiario offline con el MISMO DNI
  308 |     await page.click('button:has-text("Registrar Beneficiario")')
  309 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  310 | 
  311 |     await page.fill('#firstName', 'DuplicadoTest')
  312 |     await page.fill('#lastName', 'Playwright')
  313 |     await page.fill('#dni', duplicateDni)
  314 |     await page.fill('#birthDate', '1992-06-12')
  315 | 
  316 |     // Seleccionar olla común (primer option después del placeholder)
  317 |     await page.selectOption('#ollaId', { index: 1 })
  318 | 
  319 |     await page.click('div.z-50 button:has-text("Registrar")')
  320 | 
  321 |     // El modal debería cerrarse e inyectar el cambio localmente
  322 |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
  323 |     await expect(page.locator('text=(1 guardado(s) local)')).toBeVisible({ timeout: 35000 })
  324 | 
  325 |     // 6. Simular reconexión (esta mutación fallará con 409 debido al DNI duplicado)
  326 |     await context.setOffline(false)
  327 |     await page.waitForTimeout(4000) // esperar sync, fallo y recarga automática
  328 | 
  329 |     // 7. Debería mostrarse la alerta visual de conflictos en pantalla
  330 |     await expect(page.locator('text=conflicto(s) de sincronización')).toBeVisible({ timeout: 45000 })
  331 | 
  332 |     // 8. Hacer clic en "Revisar" para abrir el panel detallado
  333 |     await page.click('button:has-text("Revisar")')
  334 | 
  335 |     // El panel desplegable debe mostrar el error lógico descriptivo
  336 |     await expect(page.locator('text=Ya existe un beneficiario con ese DNI')).toBeVisible({ timeout: 20000 })
  337 | 
  338 |     // 9. Descartar el conflicto para limpiar la UI
```