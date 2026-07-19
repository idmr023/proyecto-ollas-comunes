# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> SIGO-Ollas Offline-First PWA E2E Tests >> Test Offline: Registro offline con sincronización automática
- Location: e2e\offline.spec.ts:40:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Sin conexión — Modo offline activo')
Expected: visible
Timeout: 35000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 35000ms
  - waiting for locator('text=Sin conexión — Modo offline activo')

```

```yaml
- text: Sin conexión — Modo offline
- button "Minimizar"
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
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import './setup-env'
  2   | import { test, expect, type Page } from '@playwright/test'
  3   | import { generate } from 'otplib'
  4   | import { prisma } from '../../backend/src/lib/prisma'
  5   | 
  6   | const TEST_EMAIL = 'admin@ollascomunes.pe'
  7   | const TEST_PASSWORD = 'admin123'
  8   | 
  9   | async function loginAsAdmin(page: Page) {
  10  |   page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  11  |   page.on('pageerror', err => console.error('BROWSER ERROR:', err.message))
  12  | 
  13  |   await page.goto('/login')
  14  |   await page.waitForLoadState('domcontentloaded')
  15  | 
  16  |   await page.fill('#login-email', TEST_EMAIL)
  17  |   await page.fill('#login-password', TEST_PASSWORD)
  18  |   await page.click('button[type="submit"]')
  19  | 
  20  |   await expect(page.locator('#otp-code')).toBeVisible({ timeout: 45000 })
  21  | 
  22  |   const user = await prisma.appUser.findUnique({ where: { email: TEST_EMAIL } })
  23  |   const secret = user?.totpSecret
  24  |   if (!secret) throw new Error('Secreto TOTP no configurado para el usuario de pruebas')
  25  | 
  26  |   const code = await generate({ secret })
  27  | 
  28  |   await page.fill('#otp-code', code)
  29  |   await page.click('button[type="submit"]')
  30  | 
  31  |   await expect(page).toHaveURL(/\/workspace\/home/, { timeout: 45000 })
  32  | }
  33  | 
  34  | test.describe('SIGO-Ollas Offline-First PWA E2E Tests', () => {
  35  | 
  36  |   test.afterAll(async () => {
  37  |     await prisma.$disconnect()
  38  |   })
  39  | 
  40  |   test('Test Offline: Registro offline con sincronización automática', async ({ page, context }) => {
  41  |     // 1. Iniciar sesión online
  42  |     await loginAsAdmin(page)
  43  | 
  44  |     // 2. Navegar a beneficiarios para cargar la caché inicial
  45  |     await page.goto('/workspace/beneficiarios')
  46  |     await page.waitForLoadState('domcontentloaded')
  47  |     await expect(page.locator('h1:has-text("Beneficiarios")')).toBeVisible({ timeout: 35000 })
  48  | 
  49  |     // 3. Simular desconexión completa (modo offline)
  50  |     await context.setOffline(true)
  51  |     await page.waitForTimeout(1000) // esperar propagación del evento offline
  52  | 
  53  |     // 4. Verificar que el banner offline esté presente
> 54  |     await expect(page.locator('text=Sin conexión — Modo offline activo')).toBeVisible({ timeout: 35000 })
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  55  | 
  56  |     // 5. Generar DNI aleatorio y registrar un beneficiario offline
  57  |     const randomDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  58  |     await page.click('button:has-text("Registrar Beneficiario")')
  59  |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).toBeVisible({ timeout: 20000 })
  60  | 
  61  |     await page.fill('#firstName', 'OfflineTest')
  62  |     await page.fill('#lastName', 'Playwright')
  63  |     await page.fill('#dni', randomDni)
  64  |     await page.fill('#birthDate', '1995-08-25')
  65  | 
  66  |     // Seleccionar olla común (primer option después del placeholder)
  67  |     await page.selectOption('#ollaId', { index: 1 })
  68  | 
  69  |     // Confirmar registro (se guardará en la cola IndexedDB)
  70  |     await page.click('div.z-50 button:has-text("Registrar")')
  71  | 
  72  |     // El modal debería cerrarse e inyectar el cambio localmente
  73  |     await expect(page.locator('h2:has-text("Registrar Beneficiario")')).not.toBeVisible({ timeout: 35000 })
  74  | 
  75  |     // 6. Verificar que el banner ahora indica que hay un cambio guardado localmente
  76  |     await expect(page.locator('text=(1 guardado(s) local)')).toBeVisible({ timeout: 35000 })
  77  | 
  78  |     // 7. Simular reconexión de red (modo online)
  79  |     await context.setOffline(false)
  80  |     await page.waitForTimeout(4000) // esperar a que se active el trigger y ocurra la recarga automática
  81  | 
  82  |     // 8. El banner de sincronizando/offline debería desaparecer tras la recarga y la sincronización exitosa
  83  |     await expect(page.locator('text=Sin conexión — Modo offline activo')).not.toBeVisible({ timeout: 45000 })
  84  | 
  85  |     // 9. Verificar en la base de datos Postgres real que el beneficiario haya sido persistido por la sincronización
  86  |     const dbBeneficiary = await prisma.beneficiary.findUnique({
  87  |       where: { dni: randomDni }
  88  |     })
  89  | 
  90  |     expect(dbBeneficiary).not.toBeNull()
  91  |     expect(dbBeneficiary?.firstName).toBe('OfflineTest')
  92  | 
  93  |     // Limpieza: eliminar el beneficiario de pruebas de la base de datos
  94  |     if (dbBeneficiary) {
  95  |       await prisma.beneficiary.delete({
  96  |         where: { id: dbBeneficiary.id }
  97  |       })
  98  |     }
  99  |   })
  100 | 
  101 |   test('Test Offline: Registro de ración offline con sincronización', async ({ page, context }) => {
  102 |     // 1. Crear un beneficiario de prueba en la base de datos para esta prueba
  103 |     const testDni = Math.floor(10000000 + Math.random() * 90000000).toString()
  104 |     const tenant = await prisma.tenant.findFirst()
  105 |     if (!tenant) throw new Error('No hay tenants en base de datos para las pruebas')
  106 |     const firstOlla = await prisma.ollaComun.findFirst({
  107 |       where: { tenantId: tenant.id, status: 'active' },
  108 |       orderBy: { name: 'asc' }
  109 |     })
  110 |     if (!firstOlla) throw new Error('No hay ollas activas en base de datos para las pruebas')
  111 | 
  112 |     const b = await prisma.beneficiary.create({
  113 |       data: {
  114 |         firstName: 'RacionTest',
  115 |         lastName: 'Playwright',
  116 |         dni: testDni,
  117 |         birthDate: new Date('1990-01-01'),
  118 |         ollaId: firstOlla.id,
  119 |         tenantId: tenant.id
  120 |       }
  121 |     })
  122 | 
  123 |     // Asegurar que exista un plan de menú hoy para evitar el fallback del recomendador IA offline
  124 |     const options = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' } as const
  125 |     const formatter = new Intl.DateTimeFormat('en-US', options)
  126 |     const parts = formatter.formatToParts(new Date())
  127 |     const year = parts.find(p => p.type === 'year')?.value
  128 |     const month = parts.find(p => p.type === 'month')?.value
  129 |     const day = parts.find(p => p.type === 'day')?.value
  130 |     const dateString = `${year}-${month}-${day}` // "YYYY-MM-DD"
  131 |     const operationDate = new Date(dateString)
  132 | 
  133 |     let menuPlan = await prisma.menuPlan.findFirst({
  134 |       where: {
  135 |         ollaId: firstOlla.id,
  136 |         operationDate
  137 |       }
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
```