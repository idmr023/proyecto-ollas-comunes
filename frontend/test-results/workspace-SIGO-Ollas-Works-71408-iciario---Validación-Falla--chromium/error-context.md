# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> SIGO-Ollas Workspace Admin E2E Tests (15 escenarios) >> Test 18.1: Formulario de Beneficiario - Validación (Falla)
- Location: e2e\workspace.spec.ts:131:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=El nombre es obligatorio.')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('text=El nombre es obligatorio.')

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
  - heading "Beneficiarios" [level=1]
  - paragraph: Padrón y seguimiento de beneficiarios.
  - text: Buscar
  - textbox "Buscar":
    - /placeholder: DNI, nombres o apellidos...
  - text: Olla Común
  - combobox "Olla Común":
    - option "Todas" [selected]
    - option "Olla Común Los Olivos"
    - option "Olla Común Villa Maria"
  - text: Condición de Salud
  - combobox "Condición de Salud":
    - option "Todas" [selected]
    - option "Adulto mayor"
    - option "Anemia"
    - option "Diabetes"
    - option "Gestante"
    - option "Hipertension"
  - button "+ Registrar Beneficiario"
  - table:
    - rowgroup:
      - row "DNI Nombre Completo Edad Olla Asignada Prioridad Estado Condiciones Acciones":
        - columnheader "DNI"
        - columnheader "Nombre Completo"
        - columnheader "Edad"
        - columnheader "Olla Asignada"
        - columnheader "Prioridad"
        - columnheader "Estado"
        - columnheader "Condiciones"
        - columnheader "Acciones"
    - rowgroup:
      - row "70020001 Elena Flores 74 años Olla Común Los Olivos Alto Activo Adulto mayor Hipertension Editar Eliminar":
        - cell "70020001"
        - cell "Elena Flores"
        - cell "74 años"
        - cell "Olla Común Los Olivos"
        - cell "Alto"
        - cell "Activo"
        - cell "Adulto mayor Hipertension"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70020003 Patricia Gomez 29 años Olla Común Los Olivos Alto Activo Gestante Editar Eliminar":
        - cell "70020003"
        - cell "Patricia Gomez"
        - cell "29 años"
        - cell "Olla Común Los Olivos"
        - cell "Alto"
        - cell "Activo"
        - cell "Gestante"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70010002 Mateo Huaman 9 años Olla Común Villa Maria Normal Activo — Editar Eliminar":
        - cell "70010002"
        - cell "Mateo Huaman"
        - cell "9 años"
        - cell "Olla Común Villa Maria"
        - cell "Normal"
        - cell "Activo"
        - cell "—"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70020002 Miguel Lopez 67 años Olla Común Los Olivos Alto Activo Adulto mayor Diabetes Editar Eliminar":
        - cell "70020002"
        - cell "Miguel Lopez"
        - cell "67 años"
        - cell "Olla Común Los Olivos"
        - cell "Alto"
        - cell "Activo"
        - cell "Adulto mayor Diabetes"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70010003 Rosa Mamani 34 años Olla Común Villa Maria Normal Activo — Editar Eliminar":
        - cell "70010003"
        - cell "Rosa Mamani"
        - cell "34 años"
        - cell "Olla Común Villa Maria"
        - cell "Normal"
        - cell "Activo"
        - cell "—"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "72365187 Ivan Daniel Manrique 0 años Olla Común Los Olivos Alto Activo Diabetes Editar Eliminar":
        - cell "72365187"
        - cell "Ivan Daniel Manrique"
        - cell "0 años"
        - cell "Olla Común Los Olivos"
        - cell "Alto"
        - cell "Activo"
        - cell "Diabetes"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70020005 Tomas Nina 7 años Olla Común Los Olivos Normal Activo Anemia Editar Eliminar":
        - cell "70020005"
        - cell "Tomas Nina"
        - cell "7 años"
        - cell "Olla Común Los Olivos"
        - cell "Normal"
        - cell "Activo"
        - cell "Anemia"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70010004 Carlos Paredes 37 años Olla Común Villa Maria Normal Activo — Editar Eliminar":
        - cell "70010004"
        - cell "Carlos Paredes"
        - cell "37 años"
        - cell "Olla Común Villa Maria"
        - cell "Normal"
        - cell "Activo"
        - cell "—"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "42508606 Original Playwright 36 años Olla Común Villa Maria Normal Activo — Editar Eliminar":
        - cell "42508606"
        - cell "Original Playwright"
        - cell "36 años"
        - cell "Olla Común Villa Maria"
        - cell "Normal"
        - cell "Activo"
        - cell "—"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "57780561 RacionTest Playwright 36 años Olla Común Los Olivos Normal Activo — Editar Eliminar":
        - cell "57780561"
        - cell "RacionTest Playwright"
        - cell "36 años"
        - cell "Olla Común Los Olivos"
        - cell "Normal"
        - cell "Activo"
        - cell "—"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "87654321 Beneficiario Prueba Vitest 30 años Olla Común Villa Maria Normal Activo — Editar Eliminar":
        - cell "87654321"
        - cell "Beneficiario Prueba Vitest"
        - cell "30 años"
        - cell "Olla Común Villa Maria"
        - cell "Normal"
        - cell "Activo"
        - cell "—"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70010001 Lucia Quispe 8 años Olla Común Villa Maria Normal Activo — Editar Eliminar":
        - cell "70010001"
        - cell "Lucia Quispe"
        - cell "8 años"
        - cell "Olla Común Villa Maria"
        - cell "Normal"
        - cell "Activo"
        - cell "—"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70010006 Jose Ramos 63 años Olla Común Villa Maria Normal Activo Adulto mayor Editar Eliminar":
        - cell "70010006"
        - cell "Jose Ramos"
        - cell "63 años"
        - cell "Olla Común Villa Maria"
        - cell "Normal"
        - cell "Activo"
        - cell "Adulto mayor"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "71860722 Francesco Riva 0 años Olla Común Los Olivos Alto Activo Diabetes Anemia Editar Eliminar":
        - cell "71860722"
        - cell "Francesco Riva"
        - cell "0 años"
        - cell "Olla Común Los Olivos"
        - cell "Alto"
        - cell "Activo"
        - cell "Diabetes Anemia"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70010005 Andrea Salazar 25 años Olla Común Villa Maria Alto Activo Gestante Editar Eliminar":
        - cell "70010005"
        - cell "Andrea Salazar"
        - cell "25 años"
        - cell "Olla Común Villa Maria"
        - cell "Alto"
        - cell "Activo"
        - cell "Gestante"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
      - row "70020004 Diana Vargas 38 años Olla Común Los Olivos Alto Activo Anemia Diabetes Editar Eliminar":
        - cell "70020004"
        - cell "Diana Vargas"
        - cell "38 años"
        - cell "Olla Común Los Olivos"
        - cell "Alto"
        - cell "Activo"
        - cell "Anemia Diabetes"
        - cell "Editar Eliminar":
          - button "Editar"
          - button "Eliminar"
  - button "Cerrar modal"
  - heading "Registrar Beneficiario" [level=2]
  - button
  - heading "Datos Personales" [level=4]
  - text: Nombre
  - textbox "Nombre"
  - text: Apellido
  - textbox "Apellido"
  - text: DNI
  - textbox "DNI":
    - /placeholder: "00000000"
  - text: Fecha de Nacimiento
  - textbox "Fecha de Nacimiento"
  - heading "Olla y Prioridad" [level=4]
  - text: Olla Común
  - combobox:
    - option "Olla Común Los Olivos" [selected]
    - option "Olla Común Villa Maria"
  - text: Prioridad
  - combobox:
    - option "Baja"
    - option "Normal" [selected]
    - option "Alta"
  - text: Género
  - combobox:
    - option "Masculino"
    - option "Femenino"
    - option "Otro"
    - option "No especificado" [selected]
  - heading "Contacto" [level=4]
  - text: Teléfono
  - textbox "Teléfono":
    - /placeholder: "987654321"
  - text: Dirección
  - textbox "Dirección":
    - /placeholder: Av. Ejemplo 123
  - heading "Condiciones de Salud" [level=4]
  - button "Adulto mayor"
  - button "Anemia"
  - button "Diabetes"
  - button "Gestante"
  - button "Hipertension"
  - button "Registrar"
  - button "Cancelar"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  46  |     await prisma.$disconnect()
  47  |   })
  48  | 
  49  |   // ─── DASHBOARD E INTERFAZ GENERAL ────────────────────────────
  50  | 
  51  |   test('Test 13: Dashboard carga correctamente con KPIs y gráficos', async ({ page }) => {
  52  |     await loginAsAdmin(page)
  53  | 
  54  |     // Verificar secciones del Dashboard
  55  |     await expect(page.locator('text=Resumen de inventario')).toBeVisible({ timeout: 35000 })
  56  |     await expect(page.locator('text=Evolución de beneficiarios')).toBeVisible()
  57  |     await expect(page.locator('text=Actividades recientes')).toBeVisible()
  58  | 
  59  |     // Verificar que los KPIs principales estén presentes
  60  |     await expect(page.locator('main').locator('text=Organizaciones').first()).toBeVisible()
  61  |     await expect(page.locator('main').locator('text=Ollas comunes').first()).toBeVisible()
  62  |     await expect(page.locator('main').locator('text=Beneficiarios').first()).toBeVisible()
  63  |     await expect(page.locator('main').locator('text=Insumos').first()).toBeVisible()
  64  |   })
  65  | 
  66  |   test('Test 14.1: Navegación del Sidebar (Éxito)', async ({ page }) => {
  67  |     await loginAsAdmin(page)
  68  | 
  69  |     // Navegar a Padrón de Beneficiarios
  70  |     await page.click('span:has-text("Beneficiarios")')
  71  |     await expect(page).toHaveURL(/\/workspace\/beneficiarios/)
  72  | 
  73  |     // Navegar a Organizaciones
  74  |     await page.click('span:has-text("Organizaciones")')
  75  |     await expect(page).toHaveURL(/\/workspace\/organizaciones/)
  76  | 
  77  |     // Navegar a Configuración
  78  |     await page.click('span:has-text("Configuración")')
  79  |     await expect(page).toHaveURL(/\/workspace\/configuracion/)
  80  |   })
  81  | 
  82  |   test('Test 14.2: Redirección de ruta de workspace protegida sin autenticación (Falla)', async ({ page }) => {
  83  |     // Intentar ir directo a /workspace/home
  84  |     await page.goto('/workspace/home')
  85  |     await page.waitForLoadState('domcontentloaded')
  86  |     // Debería redirigir a login
  87  |     await expect(page).toHaveURL(/\/login/)
  88  |   })
  89  | 
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
> 146 |     await expect(page.locator('text=El nombre es obligatorio.')).toBeVisible()
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
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
```